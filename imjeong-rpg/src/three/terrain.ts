import * as THREE from 'three';
import type { TileChar } from '../types';
import { TILE_SPECS, type Grid } from '../engine/grid';
import { groundMaterials } from './materials';

/**
 * 지면 메시.
 *
 * 타일마다 상자를 하나씩 놓으면 격자무늬가 그대로 드러나 「엑셀 시트 위를 걷는」
 * 느낌이 난다. 거상의 바닥은 하나의 큰 그림처럼 이어져 보이는데, 그 비결은
 *   ① 텍스처가 타일 경계를 넘어 계속 이어지고
 *   ② 같은 재질끼리는 면이 하나로 붙어 있으며
 *   ③ 높이가 다른 곳에만 옆면(턱)이 생긴다
 * 는 점이다. 여기서는 UV 를 **월드 좌표로** 깔아 ①을, 재질별 병합 지오메트리로
 * ②를, 이웃 타일 높이 비교로 ③을 구현한다.
 */

/** 타일 문자 → 재질 그룹 */
function groupOf(ch: TileChar): keyof typeof groundMaterials {
  switch (ch) {
    case '.':
      return 'dirt';
    case ',':
      return 'grass';
    case 'T':
      return 'grass';
    case 'S':
      return 'stone';
    case '^':
      return 'stone';
    case '=':
      return 'pavement';
    case '+':
      return 'floor';
    case '~':
      return 'water';
    case '#':
      return 'block';
    case 'x':
      return 'block';
  }
}

/** 재질별 텍스처 반복 간격 (월드 칸 단위). 작을수록 무늬가 촘촘하다. */
const UV_SCALE: Record<keyof typeof groundMaterials, number> = {
  dirt: 3.5,
  grass: 3,
  stone: 4,
  pavement: 5,
  floor: 3,
  water: 6,
  block: 3.5,
};

export interface TerrainResult {
  group: THREE.Group;
  geometries: THREE.BufferGeometry[];
  /** 물결 애니메이션용 */
  water: THREE.Mesh | null;
}

/**
 * 타일 높이에 아주 작은 흔들림을 준다.
 * 완전히 평평하면 인공적으로 보이고, 크게 주면 걷기 어색해진다.
 */
function jitter(x: number, z: number): number {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return ((n - Math.floor(n)) - 0.5) * 0.035;
}

export function buildTerrain(grid: Grid): TerrainResult {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  let water: THREE.Mesh | null = null;

  const buckets = new Map<
    keyof typeof groundMaterials,
    { pos: number[]; norm: number[]; uv: number[]; idx: number[] }
  >();

  const bucket = (key: keyof typeof groundMaterials) => {
    let b = buckets.get(key);
    if (!b) {
      b = { pos: [], norm: [], uv: [], idx: [] };
      buckets.set(key, b);
    }
    return b;
  };

  const heightAt = (x: number, z: number): number => {
    if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) return -0.6;
    const ch = grid.cells[z * grid.width + x];
    return TILE_SPECS[ch].height + (ch === '~' ? 0 : jitter(x, z));
  };

  /** 사각형 하나를 버킷에 넣는다 (정점 4개, 삼각형 2개) */
  const quad = (
    key: keyof typeof groundMaterials,
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number],
    normal: [number, number, number],
    /** UV 를 월드 xz 로 깔지(true), 옆면이라 xy 로 깔지(false) */
    topFace: boolean,
  ) => {
    const target = bucket(key);
    const base = target.pos.length / 3;
    const scale = UV_SCALE[key];
    for (const v of [a, b, c, d]) {
      target.pos.push(v[0], v[1], v[2]);
      target.norm.push(normal[0], normal[1], normal[2]);
      if (topFace) {
        target.uv.push(v[0] / scale, v[2] / scale);
      } else {
        // 옆면은 가로 위치와 높이로 UV 를 깐다
        target.uv.push((v[0] + v[2]) / scale, v[1] / scale);
      }
    }
    target.idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
  };

  for (let z = 0; z < grid.height; z += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const ch = grid.cells[z * grid.width + x];
      const key = groupOf(ch);
      // 네 모서리의 높이를 이웃과 평균 내어 부드럽게 잇는다.
      const corner = (cx: number, cz: number) => {
        const hs = [
          heightAt(cx - 1, cz - 1),
          heightAt(cx, cz - 1),
          heightAt(cx - 1, cz),
          heightAt(cx, cz),
        ].filter((h) => h > -0.5);
        if (hs.length === 0) return 0;
        return hs.reduce((s, h) => s + h, 0) / hs.length;
      };

      const h00 = corner(x, z);
      const h10 = corner(x + 1, z);
      const h11 = corner(x + 1, z + 1);
      const h01 = corner(x, z + 1);

      quad(
        key,
        [x, h00, z],
        [x + 1, h10, z],
        [x + 1, h11, z + 1],
        [x, h01, z + 1],
        [0, 1, 0],
        true,
      );

      // 턱(옆면) — 이웃이 더 낮거나 맵 밖이면 벽을 세운다.
      const self = TILE_SPECS[ch].height;
      const sides: Array<[number, number, [number, number, number], [number, number, number], [number, number, number]]> = [
        [0, -1, [x, self, z], [x + 1, self, z], [0, 0, -1]],
        [0, 1, [x + 1, self, z + 1], [x, self, z + 1], [0, 0, 1]],
        [-1, 0, [x, self, z + 1], [x, self, z], [-1, 0, 0]],
        [1, 0, [x + 1, self, z], [x + 1, self, z + 1], [1, 0, 0]],
      ];
      for (const [dx, dz, p0, p1, normal] of sides) {
        const nh = heightAt(x + dx, z + dz);
        const drop = self - nh;
        if (drop <= 0.02) continue;
        const bottom = Math.max(nh, self - 1.2);
        quad(
          key,
          [p0[0], p0[1], p0[2]],
          [p1[0], p1[1], p1[2]],
          [p1[0], bottom, p1[2]],
          [p0[0], bottom, p0[2]],
          normal,
          false,
        );
      }
    }
  }

  buckets.forEach((data, key) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.norm, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
    geometry.setIndex(data.idx);
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, groundMaterials[key]());
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    group.add(mesh);
    geometries.push(geometry);
    if (key === 'water') {
      water = mesh;
      mesh.receiveShadow = false;
    }
  });

  return { group, geometries, water };
}

/**
 * 잔디 술 — 풀밭 타일 위에 십자 평면을 흩뿌린다.
 * 하나씩 메시를 만들면 드로우콜이 수백 개가 되므로 InstancedMesh 로 한 번에 그린다.
 */
export function scatterGrassTufts(
  grid: Grid,
  tuftMaterial: THREE.Material,
  density = 0.55,
): { mesh: THREE.InstancedMesh; geometry: THREE.BufferGeometry } | null {
  const spots: Array<[number, number]> = [];
  for (let z = 0; z < grid.height; z += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      if (grid.cells[z * grid.width + x] !== ',') continue;
      const n = Math.abs(Math.sin(x * 37.1 + z * 91.7) * 1000) % 1;
      if (n > density) continue;
      spots.push([x, z]);
    }
  }
  if (spots.length === 0) return null;

  // 십자로 교차한 두 평면 — 어느 방향에서 봐도 풀처럼 보인다.
  const plane = new THREE.PlaneGeometry(0.72, 0.6);
  plane.translate(0, 0.3, 0);
  const plane2 = plane.clone();
  plane2.rotateY(Math.PI / 2);
  const merged = mergeSimple([plane, plane2]);
  plane.dispose();
  plane2.dispose();

  const mesh = new THREE.InstancedMesh(merged, tuftMaterial, spots.length);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  spots.forEach(([x, z], i) => {
    const jx = (Math.sin(x * 12.3 + z * 4.1) + 1) / 2;
    const jz = (Math.cos(x * 7.7 + z * 15.3) + 1) / 2;
    const s = 0.75 + jx * 0.6;
    position.set(x + 0.15 + jx * 0.7, 0, z + 0.15 + jz * 0.7);
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), jx * Math.PI);
    scale.set(s, s * (0.8 + jz * 0.5), s);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return { mesh, geometry: merged };
}

/**
 * 흙길 위의 잔돌 — 넓은 흙바닥이 밋밋하게 보이지 않도록 자갈을 흩뿌린다.
 * 풀 술과 같은 방식으로 InstancedMesh 한 덩어리로 그린다.
 */
export function scatterPebbles(
  grid: Grid,
  material: THREE.Material,
  density = 0.2,
): { mesh: THREE.InstancedMesh; geometry: THREE.BufferGeometry } | null {
  const spots: Array<[number, number]> = [];
  for (let z = 0; z < grid.height; z += 1) {
    for (let x = 0; x < grid.width; x += 1) {
      const ch = grid.cells[z * grid.width + x];
      if (ch !== '.' && ch !== 'S') continue;
      const n = Math.abs(Math.sin(x * 51.3 + z * 17.9) * 1000) % 1;
      if (n > density) continue;
      spots.push([x, z]);
    }
  }
  if (spots.length === 0) return null;

  const geometry = new THREE.DodecahedronGeometry(0.1, 0);
  const mesh = new THREE.InstancedMesh(geometry, material, spots.length);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const position = new THREE.Vector3();
  const axis = new THREE.Vector3(0.3, 1, 0.2).normalize();
  spots.forEach(([x, z], i) => {
    const jx = (Math.sin(x * 9.1 + z * 3.3) + 1) / 2;
    const jz = (Math.cos(x * 4.7 + z * 11.1) + 1) / 2;
    position.set(x + 0.2 + jx * 0.6, 0.04, z + 0.2 + jz * 0.6);
    quaternion.setFromAxisAngle(axis, jx * 6);
    const sc = 0.6 + jz * 1.1;
    scale.set(sc, sc * 0.55, sc);
    matrix.compose(position, quaternion, scale);
    mesh.setMatrixAt(i, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return { mesh, geometry };
}

/** 작은 병합 유틸 — three 의 BufferGeometryUtils 를 따로 불러오지 않기 위해 직접 만든다. */
function mergeSimple(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const norm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let offset = 0;
  for (const geometry of geometries) {
    const p = geometry.getAttribute('position');
    const n = geometry.getAttribute('normal');
    const u = geometry.getAttribute('uv');
    for (let i = 0; i < p.count; i += 1) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i));
      norm.push(n.getX(i), n.getY(i), n.getZ(i));
      uv.push(u.getX(i), u.getY(i));
    }
    const index = geometry.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 1) idx.push(index.getX(i) + offset);
    } else {
      for (let i = 0; i < p.count; i += 1) idx.push(i + offset);
    }
    offset += p.count;
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  merged.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  merged.setIndex(idx);
  return merged;
}

/**
 * 맵 바깥 — 여백과 먼 풍경.
 *
 * 타일 맵만 그리면 지도 가장자리 너머가 까맣게 비어 「공중에 뜬 모형」처럼 보인다.
 * 바깥으로 넓은 땅을 깔고 먼 산을 둘러 세운 뒤 안개로 지우면,
 * 화면 밖에도 세계가 이어지는 것처럼 느껴진다.
 */
export function buildSurroundings(
  grid: Grid,
  colors: { apron: string; hill: string },
): { group: THREE.Group; geometries: THREE.BufferGeometry[]; materials: THREE.Material[] } {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const cx = grid.width / 2;
  const cz = grid.height / 2;
  const span = Math.max(grid.width, grid.height);

  // 바깥 들판 — 맵보다 한 뼘 낮게 깔아 지도 가장자리에 자연스러운 턱을 만든다.
  const apronGeo = new THREE.PlaneGeometry(span * 12, span * 12);
  const uv = apronGeo.getAttribute('uv');
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * span * 4, uv.getY(i) * span * 4);
  const apronMat = groundMaterials.grass().clone() as THREE.Material & { color?: THREE.Color };
  apronMat.color?.set(colors.apron);
  const apron = new THREE.Mesh(apronGeo, apronMat);
  apron.rotation.x = -Math.PI / 2;
  // 지면(y≈0)보다 아주 조금만 낮게 둔다. 크게 낮추면 지도가 공중에 뜬 판처럼 보인다.
  apron.position.set(cx, -0.22, cz);
  apron.receiveShadow = true;
  group.add(apron);
  geometries.push(apronGeo);
  materials.push(apronMat);

  // 먼 산 — 안개에 반쯤 지워진 실루엣
  const hillMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colors.hill),
    roughness: 1,
    flatShading: true,
  });
  materials.push(hillMat);
  const hillGeo = new THREE.ConeGeometry(1, 1, 6);
  geometries.push(hillGeo);
  // 산은 안개 너머에 두어야 한다. 가까이 두면 흰 삼각형이 화면에 불쑥 끼어든다.
  const count = 22;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    const radius = span * (1.75 + ((i * 37) % 11) / 14);
    const scale = span * (0.3 + ((i * 53) % 13) / 34);
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.set(cx + Math.cos(angle) * radius, -0.3, cz + Math.sin(angle) * radius);
    hill.scale.set(scale * 2.2, scale * (0.42 + ((i * 29) % 7) / 20), scale * 2.2);
    hill.rotation.y = i;
    hill.receiveShadow = false;
    hill.castShadow = false;
    group.add(hill);
  }

  return { group, geometries, materials };
}
