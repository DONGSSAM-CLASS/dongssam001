import * as THREE from 'three';
import {
  ashlarTexture,
  brickTexture,
  canvasClothTexture,
  dirtTexture,
  floorTexture,
  foliageTexture,
  interiorWallTexture,
  grassTexture,
  pavementTexture,
  plasterTexture,
  roofTileTexture,
  stoneTexture,
  waterTexture,
  woodPlanks,
} from './textures';

/**
 * 재질.
 *
 * 단색 Lambert 대신 **텍스처를 입힌 MeshStandardMaterial** 을 쓴다.
 * 거칠기(roughness)를 재료마다 다르게 주면 같은 빛 아래에서도
 * 기와는 매끈하게, 흙은 푸석하게 보여 화면에 깊이가 생긴다.
 *
 * 저사양 기기를 위해 `setQuality('low')` 를 부르면 텍스처 없는
 * 가벼운 재질로 갈아끼운다.
 */

export type Quality = 'high' | 'low';
let quality: Quality = 'high';

const materials = new Map<string, THREE.Material>();

export function setMaterialQuality(next: Quality): void {
  quality = next;
}

export function getMaterialQuality(): Quality {
  return quality;
}

interface StdOptions {
  color?: string;
  map?: () => THREE.Texture;
  /** 텍스처가 월드 몇 칸마다 반복될지 */
  repeat?: number;
  roughness?: number;
  metalness?: number;
  flat?: boolean;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  alphaTest?: number;
}

function std(key: string, options: StdOptions): THREE.Material {
  const cacheKey = `${key}|${quality}`;
  const hit = materials.get(cacheKey);
  if (hit) return hit;

  if (quality === 'low') {
    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(options.color ?? '#b0a894'),
      flatShading: options.flat ?? false,
      transparent: options.transparent,
      opacity: options.opacity ?? 1,
      side: options.side,
      alphaTest: options.alphaTest,
    });
    materials.set(cacheKey, material);
    return material;
  }

  let map: THREE.Texture | undefined;
  if (options.map) {
    map = options.map().clone();
    map.needsUpdate = true;
    const repeat = options.repeat ?? 1;
    map.repeat.set(repeat, repeat);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
  }

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(options.color ?? '#ffffff'),
    map,
    roughness: options.roughness ?? 0.85,
    metalness: options.metalness ?? 0.02,
    flatShading: options.flat ?? false,
    transparent: options.transparent,
    opacity: options.opacity ?? 1,
    side: options.side,
    alphaTest: options.alphaTest,
  });
  materials.set(cacheKey, material);
  return material;
}

/* ───────────────────────── 지면 ───────────────────────── */

/**
 * 지면 재질.
 * UV 를 월드 좌표로 깔기 때문에 repeat 은 1 로 두고,
 * 텍스처가 몇 칸마다 반복될지는 지오메트리 UV 쪽에서 정한다.
 */
export const groundMaterials = {
  dirt: () => std('g.dirt', { map: dirtTexture, color: '#f2ead8', roughness: 0.98 }),
  grass: () => std('g.grass', { map: grassTexture, color: '#eef3e4', roughness: 1 }),
  stone: () => std('g.stone', { map: stoneTexture, color: '#f0eee8', roughness: 0.88 }),
  pavement: () => std('g.pave', { map: pavementTexture, color: '#efeee9', roughness: 0.9 }),
  floor: () => std('g.floor', { map: floorTexture, color: '#f5e9d5', roughness: 0.7 }),
  water: () =>
    std('g.water', {
      map: waterTexture,
      color: '#e8f2f6',
      roughness: 0.16,
      metalness: 0.12,
      transparent: true,
      opacity: 0.92,
    }),
  /** 벽·경계: 실제로는 건물이 덮으므로 어두운 흙으로 둔다 */
  block: () => std('g.block', { map: dirtTexture, color: '#9d947f', roughness: 1 }),
};

/* ───────────────────────── 건축 ───────────────────────── */

export const buildMaterials = {
  roof: (color: string) =>
    std(`b.roof.${color}`, { map: () => roofTileTexture(color), repeat: 1, roughness: 0.62 }),
  brick: (color: string) =>
    std(`b.brick.${color}`, { map: () => brickTexture(color), repeat: 1, roughness: 0.94 }),
  plaster: (color: string) =>
    std(`b.plaster.${color}`, { map: () => plasterTexture(color), repeat: 1, roughness: 0.96 }),
  ashlar: (color: string) =>
    std(`b.ashlar.${color}`, { map: () => ashlarTexture(color), repeat: 1, roughness: 0.9 }),
  wood: (color: string) =>
    std(`b.wood.${color}`, { map: () => woodPlanks('b', color, 5), repeat: 1, roughness: 0.82 }),
  cloth: (color: string) =>
    std(`b.cloth.${color}`, { map: () => canvasClothTexture(color), repeat: 1, roughness: 1 }),
  /** 창호지·유리 — 안쪽에서 등불이 비치는 느낌 */
  window: () =>
    std('b.window', { color: '#3a3a3c', roughness: 0.35, metalness: 0.2 }),
  windowLit: () =>
    std('b.windowLit', { color: '#e3b871', roughness: 0.4 }),
  darkWood: () => std('b.darkWood', { map: () => woodPlanks('d', '#4a3c2c', 4), roughness: 0.85 }),
  metal: () => std('b.metal', { color: '#6d7278', roughness: 0.45, metalness: 0.6 }),
  stoneTrim: (color: string) => std(`b.trim.${color}`, { color, roughness: 0.8 }),
  /** 2탄 — 1인칭 실내 벽 */
  interiorWall: (color: string) =>
    std(`b.iwall.${color}`, { map: () => interiorWallTexture(color), repeat: 1, roughness: 0.92 }),
};

/* ───────────────────────── 자연 ───────────────────────── */

export const natureMaterials = {
  foliage: (color: string) =>
    std(`n.leaf.${color}`, { map: () => foliageTexture(color), repeat: 1, roughness: 0.95, flat: true }),
  bark: () => std('n.bark', { map: () => woodPlanks('bark', '#5a4632', 3), roughness: 1 }),
  rock: () => std('n.rock', { map: () => stoneTexture(), repeat: 1, color: '#b6b1a6', roughness: 0.94, flat: true }),
};

/* ───────────────────────── 인물 ───────────────────────── */

export function clothMaterial(color: string): THREE.Material {
  return std(`c.${color}`, { color, roughness: 0.88 });
}

/** 피부 — 나이대에 따라 톤을 조금 달리한다 */
export function skinMaterial(tone = '#e2bf9b'): THREE.Material {
  return std(`c.skin.${tone}`, { color: tone, roughness: 0.78 });
}

/**
 * 윤곽선 재질 — 뒷면만 그려서 물체 바깥에 어두운 테두리를 남긴다.
 *
 * 『거상』의 인물은 2D 그림이라 선이 또렷하다. 3D 모델은 그 선이 없어
 * 배경에 묻히고 「물렁한 덩어리」처럼 보인다. 같은 모양을 조금 키워
 * 뒷면만 어둡게 그리면 손으로 그린 듯한 테두리가 생긴다.
 */
export function outlineMaterial(): THREE.Material {
  const key = 'outline';
  const hit = materials.get(key);
  if (hit) return hit;
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#241d16'),
    side: THREE.BackSide,
  });
  materials.set(key, material);
  return material;
}

/** 빛나는 것 (등불, 표식) — 조명 영향을 받지 않는다 */
export function glowMaterial(color: string, opacity = 1): THREE.Material {
  const key = `glow.${color}.${opacity}`;
  const hit = materials.get(key);
  if (hit) return hit;
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: opacity < 1,
    opacity,
  });
  materials.set(key, material);
  return material;
}

export function disposeMaterials(): void {
  materials.forEach((m) => {
    const anyMat = m as THREE.Material & { map?: THREE.Texture };
    anyMat.map?.dispose();
    m.dispose();
  });
  materials.clear();
}
