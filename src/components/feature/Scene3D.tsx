'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Ring, Text, Line } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useContent } from '../../contexts/ContentContext';

// ─── 궤도 파라미터 타입 ───────────────────────────────────────────────────────

interface OrbitParams {
  radius: number;
  speed: number;
  phase: number;
  inclination: number;
  node: number;
}

interface AsteroidData extends OrbitParams {
  size: number;
}

interface VesselData extends OrbitParams {
  label: string;    // DB 기반 분류 코드 (e.g. MIX-01)
  sublabel: string; // DB 기반 짧은 제목 (truncated)
  streakLength: number;
  streakThickness: number;
}

// ─── 궤도 헬퍼 (out-parameter 패턴 — 매 프레임 벡터 재할당 방지) ─────────────

function calcOrbitalPos(p: OrbitParams, phase: number, out: THREE.Vector3): void {
  const cos = Math.cos(phase);
  const sin = Math.sin(phase);
  const sinI = Math.sin(p.inclination);
  const cosI = Math.cos(p.inclination);
  const sinN = Math.sin(p.node);
  const cosN = Math.cos(p.node);
  out.set(
    p.radius * (cosN * cos - sinN * sin * cosI),
    p.radius * sinN * sinI * sin,
    p.radius * (sinN * cos + cosN * sin * cosI) - 18,
  );
}

function calcOrbitalTangent(p: OrbitParams, phase: number, out: THREE.Vector3): void {
  const sin = Math.sin(phase);
  const cos = Math.cos(phase);
  const sinI = Math.sin(p.inclination);
  const cosI = Math.cos(p.inclination);
  const sinN = Math.sin(p.node);
  const cosN = Math.cos(p.node);
  out
    .set(
      -(cosN * sin + sinN * cos * cosI),
      sinN * sinI * cos,
      -(sinN * sin - cosN * cos * cosI),
    )
    .normalize();
}

// ─── 모듈 레벨 상수 데이터 (react-hooks/purity 위반 방지) ────────────────────
// 궤도 파라미터만 여기서 고정 — 라벨은 컴포넌트에서 DB 기반으로 주입

function createAsteroidData(count: number): AsteroidData[] {
  return Array.from({ length: count }, () => ({
    radius: 6 + Math.random() * 12,
    speed: 0.0004 + Math.random() * 0.001,  // 느린 소행성 공전
    phase: Math.random() * Math.PI * 2,
    inclination: (Math.random() - 0.5) * 0.25, // 얕은 기울기 — 원반형 벨트
    node: Math.random() * Math.PI * 2,
    size: 0.04 + Math.random() * 0.07,
  }));
}

/** 라벨 없는 기본 궤도 슬롯 (최대 10기) */
const VESSEL_ORBITAL_SLOTS = Array.from({ length: 10 }, () => ({
  radius: 15 + Math.random() * 16,
  speed: 0.0012 + Math.random() * 0.002,  // 느린 우주선 공전
  phase: Math.random() * Math.PI * 2,
  inclination: (Math.random() - 0.5) * 1.0,
  node: Math.random() * Math.PI * 2,
  streakLength: 4 + Math.random() * 5,
  streakThickness: 0.035 + Math.random() * 0.035,
}));

const ASTEROID_DATA = createAsteroidData(55);

// ─── 소행성대 (Points — 55개 작은 점) ───────────────────────────────────────

const AsteroidBelt = ({ color = '#444444' }: { color?: string }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = ASTEROID_DATA.length;

  // 위치 버퍼 — 매 프레임 직접 갱신
  const posBuffer = useMemo(() => new Float32Array(count * 3), [count]);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posBuffer, 3));
    return geo;
  }, [posBuffer]);

  const tmp = useRef(new THREE.Vector3());

  useFrame(() => {
    ASTEROID_DATA.forEach((ast, i) => {
      ast.phase += ast.speed;
      calcOrbitalPos(ast, ast.phase, tmp.current);
      posBuffer[i * 3] = tmp.current.x;
      posBuffer[i * 3 + 1] = tmp.current.y;
      posBuffer[i * 3 + 2] = tmp.current.z;
    });
    if (pointsRef.current) {
      (pointsRef.current.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.07}
        sizeAttenuation
        transparent
        opacity={0.75}
      />
    </points>
  );
};

// ─── 우주선 궤도 경로 라인 ─────────────────────────────────────────────────────

const OrbitPath = ({ orbit, color }: { orbit: OrbitParams; color: string }) => {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const tmp = new THREE.Vector3();
    for (let i = 0; i <= 96; i++) {
      calcOrbitalPos(orbit, (i / 96) * Math.PI * 2, tmp);
      pts.push(tmp.clone());
    }
    return pts;
  }, [orbit]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={0.4}
      transparent
      opacity={0.08}
    />
  );
};

// ─── 개별 우주선 (스트릭 + HUD 분류 라벨) ────────────────────────────────────

const Vessel = ({ data, color }: { data: VesselData; color: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useRef(data.phase);
  const dir = useRef(new THREE.Vector3());
  const up = useRef(new THREE.Vector3(0, 1, 0));
  const pos = useRef(new THREE.Vector3());

  useFrame(() => {
    phase.current += data.speed;

    calcOrbitalPos(data, phase.current, pos.current);
    calcOrbitalTangent(data, phase.current, dir.current);

    if (groupRef.current) {
      groupRef.current.position.copy(pos.current);
    }

    const mesh = meshRef.current;
    if (mesh) {
      if (Math.abs(dir.current.dot(up.current)) > 0.98) {
        up.current.set(0, 0, 1);
      } else {
        up.current.set(0, 1, 0);
      }
      mesh.quaternion.setFromUnitVectors(up.current, dir.current);
      mesh.scale.set(
        data.streakThickness,
        data.streakLength * data.streakThickness,
        data.streakThickness,
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* 우주선 스트릭 본체 */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[1, 1, 1, 4, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      {/* 분류 코드 (1행) */}
      <Text
        position={[0.5, 0.4, 0]}
        fontSize={0.28}
        color={color}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.85}
        letterSpacing={0.1}
      >
        {data.label}
      </Text>
      {/* 짧은 제목 (2행) — 더 작고 흐리게 */}
      <Text
        position={[0.5, 0.08, 0]}
        fontSize={0.18}
        color={color}
        anchorX="left"
        anchorY="middle"
        fillOpacity={0.4}
        letterSpacing={0.05}
      >
        {data.sublabel}
      </Text>
    </group>
  );
};

/** FUI 레이더 링 */
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

/** 팔각형 프리즘 코어 */
const OctagonCore = ({ color = '#00ff00' }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -10]}>
      <cylinderGeometry args={[2, 2, 1.6, 8, 1, false]} />
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
      0.04,
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      state.pointer.y * 3,
      0.04,
    );
    state.camera.lookAt(0, 0, -10);
  });
  return null;
};

// ─── Scene3D ──────────────────────────────────────────────────────────────────

export default function Scene3D() {
  const { content, musicContent } = useContent();
  const accentColor = content.themeColors.accent || '#00ff00';
  const mutedColor = content.themeColors.muted || '#333333';

  const chromaticOffset = useMemo(() => new THREE.Vector2(0.004, 0.004), []);

  // 트랙 데이터를 우주선 슬롯에 매핑
  // — 분류 코드: track.type 앞 3자(대문자) + 인덱스 2자리
  // — 부제목: track.title 앞 11자(대문자) 절삭
  const vesselData = useMemo<VesselData[]>(() => {
    const tracks = musicContent.tracks.slice(0, VESSEL_ORBITAL_SLOTS.length);
    return VESSEL_ORBITAL_SLOTS.map((slot, i) => {
      const track = tracks[i];
      const prefix = track
        ? track.type.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'OBJ'
        : 'OBJ';
      const idx = String(i + 1).padStart(2, '0');
      const sublabel = track
        ? track.title.toUpperCase().slice(0, 11)
        : `UNKNOWN-${idx}`;
      return {
        ...slot,
        label: `${prefix}-${idx}`,
        sublabel,
      };
    });
  }, [musicContent.tracks]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-10]">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />
          <ambientLight intensity={0.1} />
          <pointLight position={[0, 0, -3]} intensity={3} color={accentColor} />

          {/* 소행성대 */}
          <AsteroidBelt color={mutedColor} />

          {/* 우주선 궤도 경로 (faint) + 우주선 스트릭 + HUD 라벨 */}
          {vesselData.map((vessel) => (
            <OrbitPath key={`orbit-${vessel.label}`} orbit={vessel} color={accentColor} />
          ))}
          {vesselData.map((vessel) => (
            <Vessel key={vessel.label} data={vessel} color={accentColor} />
          ))}

          <FuiRings color={accentColor} />
          <OctagonCore color={accentColor} />
          <CameraRig />

          <EffectComposer enableNormalPass={false}>
            <Bloom
              luminanceThreshold={0}
              luminanceSmoothing={0.4}
              intensity={3.5}
              mipmapBlur
            />
            <Noise opacity={0.4} blendFunction={BlendFunction.OVERLAY} />
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
