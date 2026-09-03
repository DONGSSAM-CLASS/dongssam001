import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToVec3, vec3ToLatLon } from '@/lib/geo';
import { useGlobeStore } from '@/store/globeStore';
import { PolityOverlay } from './PolityOverlay';
import { BordersOverlay } from './BordersOverlay';
import { Markers } from './Markers';
import { pickPolityAt } from './pick';
import { useVisiblePolities } from '@/lib/useVisibleData';

export const EARTH_RADIUS = 1;
const TEXTURE_URL = '/textures/earth-blue-marble-2048.jpg';
const TEXTURE_LOW_URL = '/textures/earth-blue-marble-1024.jpg';

/** 저사양 기기 판별: 논리 코어 4 이하 또는 메모리 4GB 이하면 저해상도 텍스처 */
function isLowEndDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
}

function Earth() {
  const url = useMemo(() => (isLowEndDevice() ? TEXTURE_LOW_URL : TEXTURE_URL), []);
  const texture = useTexture(url);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }, [texture]);
  const polities = useVisiblePolities();
  const select = useGlobeStore((s) => s.select);
  const flyTo = useGlobeStore((s) => s.flyTo);
  const downPos = useRef<[number, number] | null>(null);

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = [e.clientX, e.clientY];
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    // 드래그 회전 후의 click 은 무시 (이동 거리 6px 초과)
    const d = downPos.current;
    if (d && Math.hypot(e.clientX - d[0], e.clientY - d[1]) > 6) return;
    const [lat, lon] = vec3ToLatLon(e.point.x, e.point.y, e.point.z);
    const hit = pickPolityAt([lat, lon], polities);
    select(hit ? { kind: 'polity', id: hit.id } : null);
  };
  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    const [lat, lon] = vec3ToLatLon(e.point.x, e.point.y, e.point.z);
    flyTo(lat, lon, 1.9);
  };

  return (
    <mesh onPointerDown={onPointerDown} onClick={onClick} onDoubleClick={onDoubleClick}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
    </mesh>
  );
}

function EarthFallback() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 32, 32]} />
      <meshStandardMaterial color="#1e3a5f" />
      <Html center><span className="text-xs text-slate-300 whitespace-nowrap">지구본 불러오는 중…</span></Html>
    </mesh>
  );
}

/** 카메라 제어: OrbitControls + flyTo 애니메이션 + FPS 측정 */
function CameraRig() {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const fly = useGlobeStore((s) => s.fly);
  const setFps = useGlobeStore((s) => s.setFps);
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; start: number; token: number } | null>(null);
  const fpsAcc = useRef({ frames: 0, t: 0 });

  useEffect(() => {
    if (!fly) return;
    const dist = fly.distance ?? camera.position.length();
    const [x, y, z] = latLonToVec3(fly.lat, fly.lon, dist);
    anim.current = { from: camera.position.clone(), to: new THREE.Vector3(x, y, z), start: performance.now(), token: fly.token };
  }, [fly, camera]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (a) {
      const t = Math.min(1, (performance.now() - a.start) / 800);
      const ease = 1 - Math.pow(1 - t, 3);
      // 방향은 구면 보간, 거리는 선형 보간 → 지구를 관통하지 않음
      const fromDir = a.from.clone().normalize();
      const toDir = a.to.clone().normalize();
      const dir = new THREE.Vector3().copy(fromDir).lerp(toDir, ease).normalize();
      const dist = THREE.MathUtils.lerp(a.from.length(), a.to.length(), ease);
      camera.position.copy(dir.multiplyScalar(dist));
      camera.lookAt(0, 0, 0);
      if (t >= 1) anim.current = null;
    }
    controls.current?.update();
    // FPS (1초 단위)
    fpsAcc.current.frames += 1;
    fpsAcc.current.t += delta;
    if (fpsAcc.current.t >= 1) {
      setFps(Math.round(fpsAcc.current.frames / fpsAcc.current.t));
      fpsAcc.current = { frames: 0, t: 0 };
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.6}
      minDistance={1.25}
      maxDistance={4}
      // 줌인할수록 회전 속도를 줄여 미세 조작 가능
      onChange={() => {
        const c = controls.current;
        if (c) c.rotateSpeed = 0.15 + 0.35 * ((camera.position.length() - 1.25) / 2.75);
      }}
    />
  );
}

export function GlobeCanvas() {
  return (
    <Canvas
      camera={{ position: latLonToVec3(30, 105, 2.6), fov: 45, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      // 저사양 기기: 조작이 없을 때 렌더링을 멈춰 배터리·CPU 절약
      frameloop="always"
      className="touch-none"
      aria-hidden="true"
    >
      <color attach="background" args={['#05080f']} />
      <ambientLight intensity={1.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <Suspense fallback={<EarthFallback />}>
        <Earth />
      </Suspense>
      <PolityOverlay />
      <BordersOverlay />
      <Markers />
      <CameraRig />
      <Stars />
    </Canvas>
  );
}

function Stars() {
  const positions = useMemo(() => makeStarPositions(600), []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#94a3b8" sizeAttenuation />
    </points>
  );
}

/** 결정적 난수(LCG)로 별 위치 생성 — 렌더가 순수하도록 Math.random 을 쓰지 않음 */
function makeStarPositions(count: number) {
  let seed = 20260903;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const t = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    const dist = 40 + rand() * 20;
    arr.set([r * Math.cos(t) * dist, u * dist, r * Math.sin(t) * dist], i * 3);
  }
  return arr;
}
