'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, Ring } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useContent } from '../../contexts/ContentContext';

const Particles = ({ count = 300, color = '#ffffff' }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 10 + Math.random() * 50;
      const speed = 0.005 + Math.random() / 200;
      const xFactor = -30 + Math.random() * 60;
      const yFactor = -30 + Math.random() * 60;
      const zFactor = -30 + Math.random() * 60;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame(() => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed;
      
      dummy.position.set(
        xFactor + Math.cos((t / 10) * factor),
        yFactor + Math.sin((t / 10) * factor),
        zFactor + Math.sin(t * 2) * 5
      );
      
      const s = 0.5 + Math.sin(t) * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      if (mesh.current) {
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[null as any, null as any, count]}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
    </instancedMesh>
  );
};

// 미니멀 FUI 느낌을 위한 회전하는 레이더 링
const FuiRings = ({ color = '#00ff00' }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.2;
      groupRef.current.rotation.y = Math.cos(state.clock.getElapsedTime() * 0.1) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -15]}>
      {/* Outer Ring */}
      <Ring args={[14, 14.05, 64]} >
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </Ring>
      {/* Inner Dashed/Segmented Ring effect using low poly */}
      <Ring args={[10, 10.1, 32, 1, 0, Math.PI * 1.5]} >
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </Ring>
      <Ring args={[6, 6.05, 16]} >
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
      </Ring>
    </group>
  );
};

const CameraRig = () => {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // 마우스 포인터에 따른 미세한 Parallax 이동
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, (state.pointer.x * 2), 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, (state.pointer.y * 2), 0.05);
    state.camera.lookAt(0, 0, -10);
  });
  return null;
};

export default function Scene3D() {
  const { content } = useContent();
  const accentColor = content.themeColors.accent || '#00ff00';
  const mutedColor = content.themeColors.muted || '#333333';

  return (
    <div className="fixed inset-0 pointer-events-none z-[-10] opacity-80">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 5, 25]} />
        
        <Particles count={250} color={mutedColor} />
        <FuiRings color={accentColor} />
        
        {/* Core Geometry (Target / Data Core) */}
        <Icosahedron args={[2, 1]} position={[0, 0, -10]}>
          <meshBasicMaterial color={accentColor} wireframe transparent opacity={0.3} />
        </Icosahedron>
        
        <CameraRig />

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} intensity={2.0} />
          <Noise opacity={0.4} blendFunction={BlendFunction.OVERLAY} />
          <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} blendFunction={BlendFunction.NORMAL} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
