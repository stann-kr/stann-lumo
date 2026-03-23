'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Ring } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useContent } from '../../contexts/ContentContext';

/** 파티클 초기 데이터 생성 — 렌더 사이클 외부에서 호출되어 purity 규칙 준수 */
function createParticleData(count: number) {
  const temp = [];
  for (let i = 0; i < count; i++) {
    temp.push({
      t: Math.random() * 100,
      factor: 10 + Math.random() * 50,
      speed: 0.005 + Math.random() / 200,
      xFactor: -30 + Math.random() * 60,
      yFactor: -30 + Math.random() * 60,
      zFactor: -30 + Math.random() * 60,
    });
  }
  return temp;
}

const Particles = ({ count = 250, color = '#ffffff' }) => {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useRef(createParticleData(count));

  useFrame(() => {
    particles.current.forEach((particle, i) => {
      particle.t += particle.speed;
      const { t, factor, xFactor, yFactor, zFactor } = particle;

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
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        wireframe
        transparent
        opacity={0.5}
      />
    </instancedMesh>
  );
};

/** FUI 레이더 링 — 세그먼트 128로 완전한 원형 */
const FuiRings = ({ color = '#00ff00' }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.rotation.z = t * 0.05;
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.2;
      groupRef.current.rotation.y = Math.cos(t * 0.1) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -15]}>
      {/* 외부 완전 원형 링 */}
      <Ring args={[14, 14.08, 128]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </Ring>
      {/* 부분 아크 링 — 세그먼트 128로 매끄럽게 */}
      <Ring args={[10, 10.12, 128, 1, 0, Math.PI * 1.5]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </Ring>
      {/* 내부 링 — 16 → 128 세그먼트로 원형화 */}
      <Ring args={[6, 6.08, 128]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </Ring>
    </group>
  );
};

/** 회전하는 옥타헤드론 코어 — 연속 rotation으로 3D 형태 인식 */
const OctahedronCore = ({ color = '#00ff00' }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.25;
      meshRef.current.rotation.x = t * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <octahedronGeometry args={[2, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={3.5}
        wireframe
        transparent
        opacity={0.85}
      />
    </mesh>
  );
};

/** 마우스 패럴랙스 카메라 리그 */
const CameraRig = () => {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      state.pointer.x * 3,
      0.04
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      state.pointer.y * 3,
      0.04
    );
    state.camera.lookAt(0, 0, -10);
  });
  return null;
};

export default function Scene3D() {
  const { content } = useContent();
  const accentColor = content.themeColors.accent || '#00ff00';
  const mutedColor = content.themeColors.muted || '#333333';

  // 매 렌더마다 새 객체 생성 방지
  const chromaticOffset = useMemo(() => new THREE.Vector2(0.004, 0.004), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-10]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          // ACES Filmic 톤 매핑이 emissive/Bloom을 압축하므로 NoToneMapping 사용
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />
          {/* fog 제거 — 이전에는 near=5/far=25로 오브젝트가 50~75% fog에 가려졌음 */}
          <ambientLight intensity={0.1} />
          {/* accent 컬러 포인트 라이트로 오브젝트 조명 */}
          <pointLight position={[0, 0, -3]} intensity={3} color={accentColor} />

          <Particles count={250} color={mutedColor} />
          <FuiRings color={accentColor} />
          <OctahedronCore color={accentColor} />

          <CameraRig />

          <EffectComposer enableNormalPass={false}>
            {/* threshold=0으로 모든 emissive 픽셀 bloom 대상, intensity 강화 */}
            <Bloom
              luminanceThreshold={0}
              luminanceSmoothing={0.4}
              intensity={3.5}
              mipmapBlur
            />
            <Noise opacity={0.4} blendFunction={BlendFunction.OVERLAY} />
            {/* chromatic aberration 수치 증가로 가시성 확보 */}
            <ChromaticAberration
              offset={chromaticOffset}
              blendFunction={BlendFunction.NORMAL}
            />
            <Vignette offset={0.15} darkness={1.3} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
