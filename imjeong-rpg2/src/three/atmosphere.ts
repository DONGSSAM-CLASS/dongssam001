import * as THREE from 'three';
import type { MapId } from '../types';

/**
 * 맵마다의 빛과 공기.
 *
 * 같은 모델이라도 빛이 바뀌면 전혀 다른 화면이 된다. 상하이의 봄 안개,
 * 파리의 잿빛 하늘, 충칭의 짙은 강안개, 시안의 노을 — 각 장소가 사료와
 * 사진에서 전해지는 인상을 조명으로 옮긴다. (1탄에서 이어받은 방식)
 *
 * ⚠ 날씨 자체는 역사 기록이 아니라 분위기 연출이다.
 *   (충칭이 안개가 많은 도시라는 점, 임정이 그곳에서 일제의 폭격을 피해
 *    방공호를 드나들었다는 점은 사실이다.)
 */

export interface Mood {
  /** 태양 색과 세기 */
  sun: string;
  sunIntensity: number;
  /** 태양 방위(도) — 그림자가 지는 방향 */
  sunAzimuth: number;
  /** 태양 고도(도) — 낮을수록 그림자가 길어진다 */
  sunElevation: number;
  /** 하늘빛 / 땅에서 반사되는 빛 */
  skyLight: string;
  groundLight: string;
  hemiIntensity: number;
  /** 하늘 그라데이션 (위 → 아래) */
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  /** 안개 */
  fog: string;
  fogNear: number;
  fogFar: number;
  /** 톤 매핑 노출 */
  exposure: number;
  /** 화면 가장자리를 어둡게 (0~1) */
  vignette: number;
  /** 공중에 떠다니는 것 */
  motes: 'petal' | 'dust' | 'none';
  motesColor: string;
  /** 맵 바깥 들판의 색 — 지도 가장자리가 튀지 않게 지면과 비슷하게 맞춘다 */
  apron: string;
  /** 먼 산의 색 */
  hill: string;
}

export const MOODS: Record<MapId, Mood> = {
  /* 보훈의 전당 — 오늘날의 전시관. 높은 창으로 드는 맑고 고른 빛. (가상 공간) */
  memorial: {
    sun: '#fff6e8',
    sunIntensity: 1.6,
    sunAzimuth: 150,
    sunElevation: 58,
    skyLight: '#e8eef2',
    groundLight: '#b9ad96',
    hemiIntensity: 1.55,
    skyTop: '#86a8c6',
    skyMid: '#c9d9e4',
    skyBottom: '#eef0ec',
    fog: '#dfe3e2',
    fogNear: 40,
    fogFar: 120,
    exposure: 1.08,
    vignette: 0.3,
    motes: 'dust',
    motesColor: '#fff4dc',
    apron: '#a8a495',
    hill: '#c3ccd1',
  },
  /* 상하이 김신부로 — 1919년 4월의 흐린 봄. 벚꽃이 날린다. */
  assembly: {
    sun: '#ffe9c8',
    sunIntensity: 2.2,
    sunAzimuth: 128,
    sunElevation: 46,
    skyLight: '#cdddea',
    groundLight: '#8a7d63',
    hemiIntensity: 1.15,
    skyTop: '#7fa2c4',
    skyMid: '#bfd2e0',
    skyBottom: '#e3e0d2',
    fog: '#cfd8dd',
    fogNear: 26,
    fogFar: 90,
    exposure: 1.05,
    vignette: 0.42,
    motes: 'petal',
    motesColor: '#f0c3d0',
    apron: '#93a878',
    hill: '#aebcc4',
  },
  /* 상하이 하비로 — 1919년 가을, 맑게 갠 조계 거리 */
  hafei: {
    sun: '#fff0d6',
    sunIntensity: 2.4,
    sunAzimuth: 200,
    sunElevation: 40,
    skyLight: '#cfe0ec',
    groundLight: '#8d8062',
    hemiIntensity: 1.1,
    skyTop: '#6f97c0',
    skyMid: '#b7cfe2',
    skyBottom: '#e6e2d4',
    fog: '#d4dde2',
    fogNear: 28,
    fogFar: 96,
    exposure: 1.06,
    vignette: 0.4,
    motes: 'dust',
    motesColor: '#efe4c6',
    apron: '#98a27c',
    hill: '#b0bcc4',
  },
  /* 상하이 마당로 — 1920년대 후반. 흐리고 무거운 하늘 (임정의 침체기) */
  madang: {
    sun: '#f1e6d4',
    sunIntensity: 1.7,
    sunAzimuth: 150,
    sunElevation: 34,
    skyLight: '#c8cfd4',
    groundLight: '#7d7666',
    hemiIntensity: 1.2,
    skyTop: '#8595a4',
    skyMid: '#bdc5cb',
    skyBottom: '#dcdad2',
    fog: '#cfd3d4',
    fogNear: 22,
    fogFar: 80,
    exposure: 1.0,
    vignette: 0.5,
    motes: 'dust',
    motesColor: '#dcdcd6',
    apron: '#8f977f',
    hill: '#b2b8bb',
  },
  /* 충칭 — 「안개의 도시」. 시야가 짧다. */
  chongqing: {
    sun: '#f3e7d2',
    sunIntensity: 1.55,
    sunAzimuth: 158,
    sunElevation: 42,
    skyLight: '#c9cbc6',
    groundLight: '#7a7565',
    hemiIntensity: 1.3,
    skyTop: '#93999a',
    skyMid: '#c0c3bf',
    skyBottom: '#d9d6cc',
    fog: '#c8cbc5',
    fogNear: 18,
    fogFar: 70,
    exposure: 1.0,
    vignette: 0.55,
    motes: 'dust',
    motesColor: '#d9dad4',
    apron: '#8a9482',
    hill: '#a9aea6',
  },
  /* 서울 경교장 — 1945년 11월 말, 맑고 찬 초겨울 */
  seoul: {
    sun: '#ffe7c4',
    sunIntensity: 2.3,
    sunAzimuth: 196,
    sunElevation: 30,
    skyLight: '#d3e0ea',
    groundLight: '#8c7f66',
    hemiIntensity: 1.1,
    skyTop: '#5f8cbc',
    skyMid: '#aecbe3',
    skyBottom: '#e8e4d8',
    fog: '#d6dee4',
    fogNear: 30,
    fogFar: 100,
    exposure: 1.06,
    vignette: 0.38,
    motes: 'none',
    motesColor: '#ffffff',
    apron: '#a0967a',
    hill: '#b6c2c9',
  },
};

/** 하늘 그라데이션 텍스처 — 단색 배경보다 훨씬 깊이 있어 보인다. */
export function skyTexture(mood: Mood): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, mood.skyTop);
  gradient.addColorStop(0.52, mood.skyMid);
  gradient.addColorStop(1, mood.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** 태양 위치를 방위·고도에서 구한다 */
export function sunPosition(mood: Mood, distance = 42): THREE.Vector3 {
  const az = (mood.sunAzimuth * Math.PI) / 180;
  const el = (mood.sunElevation * Math.PI) / 180;
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(el) * distance,
    Math.sin(el) * distance,
    Math.cos(az) * Math.cos(el) * distance,
  );
}

/**
 * 공중에 떠다니는 알갱이 — 벚꽃잎이나 먼지.
 * 화면에 아주 느리게 움직이는 것이 있으면 정지 화면처럼 보이지 않는다.
 */
export function createMotes(
  mood: Mood,
  area: { width: number; height: number },
): { points: THREE.Points; geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (mood.motes === 'none') return null;
  const count = mood.motes === 'petal' ? 260 : 180;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = Math.random() * area.width;
    positions[i * 3 + 1] = Math.random() * 9 + 0.4;
    positions[i * 3 + 2] = Math.random() * area.height;
    speeds[i * 3] = 0.12 + Math.random() * 0.3;
    speeds[i * 3 + 1] = -(0.12 + Math.random() * 0.26);
    speeds[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(speeds, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(mood.motesColor),
    size: mood.motes === 'petal' ? 0.16 : 0.09,
    transparent: true,
    opacity: mood.motes === 'petal' ? 0.85 : 0.5,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, geometry, material };
}

/** 알갱이를 한 프레임만큼 움직인다 (바닥에 닿으면 위로 되돌린다) */
export function updateMotes(
  geometry: THREE.BufferGeometry,
  delta: number,
  area: { width: number; height: number },
  time: number,
): void {
  const pos = geometry.getAttribute('position') as THREE.BufferAttribute;
  const vel = geometry.getAttribute('velocity') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 1) {
    let x = pos.getX(i) + vel.getX(i) * delta;
    let y = pos.getY(i) + vel.getY(i) * delta;
    // 좌우로 하늘거리며 떨어진다
    let z = pos.getZ(i) + (vel.getZ(i) + Math.sin(time * 1.4 + i) * 0.18) * delta;
    if (y < 0.1 || x > area.width) {
      x = Math.random() * area.width * 0.4;
      y = 8 + Math.random() * 2;
      z = Math.random() * area.height;
    }
    if (z > area.height) z -= area.height;
    if (z < 0) z += area.height;
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
}
