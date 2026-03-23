'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useContent } from '../../contexts/ContentContext';

const Particles = ({ count = 500, color = '#ffffff' }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
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
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color={color} wireframe />
    </instancedMesh>
  );
};

const GridFloor = ({ color = '#00ff00' }) => {
  return (
    <group position={[0, -10, 0]}>
      <gridHelper args={[200, 100, color, color]} position={[0, 0, 0]} />
    </group>
  );
};

const CameraRig = () => {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.z = 20 + Math.sin(t / 4) * 5;
    state.camera.position.x = Math.sin(t / 4) * 5;
    state.camera.position.y = Math.cos(t / 4) * 2;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
};

export default function Scene3D() {
  const { content } = useContent();
  const accentColor = content.themeColors.accent || '#00ff00';
  const mutedColor = content.themeColors.muted || '#333333';

  return (
    <div className="fixed inset-0 pointer-events-none z-[-10] opacity-30">
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 10, 50]} />
        <ambientLight intensity={0.5} />
        
        <Particles count={200} color={mutedColor} />
        <GridFloor color={accentColor} />
        
        {/* Wireframe Planet */}
        <Sphere args={[8, 16, 16]} position={[0, 0, -10]}>
          <meshBasicMaterial color={mutedColor} wireframe transparent opacity={0.2} />
        </Sphere>
        
        <CameraRig />
      </Canvas>
    </div>
  );
}
