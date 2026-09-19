import * as THREE from 'three';
import type { PropSpec } from '../types';
import { buildMaterials, glowMaterial, natureMaterials } from './materials';
import { taegeukTexture } from './palette';
import { scaleUV, texturedBox } from './geom';

/**
 * 장식물 — 화면을 채우는 작은 것들.
 *
 * 건물만 서 있는 거리는 비어 보인다. 『거상』 화면이 풍성해 보이는 까닭은
 * 나무·수레·빨래·등롱·표지판 같은 **살림의 흔적**이 골목마다 놓여 있기 때문이다.
 * 여기서도 그 역할을 하는 것들을 갖춘다.
 */

export interface BuiltProp {
  group: THREE.Group;
  geometries: THREE.BufferGeometry[];
  textures: THREE.Texture[];
  /** 바람에 흔들리는 부분 */
  sway?: THREE.Object3D;
  /** 밤에 켜지는 불빛 */
  light?: THREE.Object3D;
}

/** 위치마다 조금씩 다르게 보이도록 하는 결정적 난수 */
function rnd(x: number, z: number, salt = 0): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

export function createProp(spec: PropSpec): BuiltProp {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  let sway: THREE.Object3D | undefined;
  let light: THREE.Object3D | undefined;

  group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
  const s = spec.scale ?? 1;
  const r1 = rnd(spec.x, spec.z, 1);
  const r2 = rnd(spec.x, spec.z, 2);
  // 같은 나무가 줄줄이 복제된 티가 나지 않도록 방향과 크기를 조금씩 흩는다.
  group.rotation.y = r1 * Math.PI * 2;

  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    pos: [number, number, number],
    rot?: [number, number, number],
    castShadow = true,
  ) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  const box = (
    w: number,
    h: number,
    d: number,
    material: THREE.Material,
    pos: [number, number, number],
    rot?: [number, number, number],
    density = 1,
  ) => add(texturedBox(w, h, d, density), material, pos, rot);

  /** 줄기 — 살짝 기울고 굵기가 변한다 */
  const trunk = (height: number, bottom: number, top: number) => {
    const geometry = new THREE.CylinderGeometry(top * s, bottom * s, height * s, 7);
    scaleUV(geometry, 1.4, height * s * 0.7);
    const mesh = add(geometry, natureMaterials.bark(), [0, (height * s) / 2, 0]);
    mesh.rotation.z = (r2 - 0.5) * 0.12;
    return mesh;
  };

  /** 수관 — 크기가 다른 덩어리를 겹쳐 뭉게구름처럼 만든다 */
  const canopy = (
    color: string,
    blobs: Array<[number, number, number, number]>, // x, y, z, r
  ) => {
    const material = natureMaterials.foliage(color);
    for (const [bx, by, bz, br] of blobs) {
      const geometry = new THREE.IcosahedronGeometry(br * s, 1);
      const mesh = add(geometry, material, [bx * s, by * s, bz * s]);
      mesh.scale.set(1, 0.86, 1);
      mesh.rotation.set(r1 * 3, r2 * 3, r1 * 2);
    }
  };

  switch (spec.kind) {
    /* ── 나무 ── */
    case 'tree': {
      trunk(1.5, 0.15, 0.1);
      canopy(spec.color ?? '#4f6b3a', [
        [0, 1.95, 0, 0.78],
        [0.45, 1.62, 0.28, 0.54],
        [-0.42, 1.7, -0.3, 0.5],
        [0.1, 2.45, -0.15, 0.46],
      ]);
      break;
    }
    case 'pine': {
      trunk(1.2, 0.13, 0.08);
      const material = natureMaterials.foliage('#3f5a38');
      for (let i = 0; i < 4; i += 1) {
        const r = (0.72 - i * 0.14) * s;
        const geometry = new THREE.ConeGeometry(r, 0.72 * s, 8);
        add(geometry, material, [0, (1.1 + i * 0.5) * s, 0]);
      }
      break;
    }
    case 'willow': {
      trunk(1.7, 0.16, 0.1);
      const material = natureMaterials.foliage('#7d9450');
      // 늘어진 가지 — 납작한 덩어리를 둘러 늘어뜨린다
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        const geometry = new THREE.IcosahedronGeometry(0.42 * s, 1);
        const mesh = add(geometry, material, [
          Math.cos(a) * 0.62 * s,
          (1.85 - (i % 3) * 0.16) * s,
          Math.sin(a) * 0.62 * s,
        ]);
        mesh.scale.set(1, 1.7, 1);
      }
      const crown = add(new THREE.IcosahedronGeometry(0.66 * s, 1), material, [0, 2.15 * s, 0]);
      crown.scale.set(1.1, 0.8, 1.1);
      break;
    }
    /* 벚나무 — 봄의 상하이·자싱 풍경. 화면에 분홍이 들어가면 단번에 살아난다. */
    case 'cherry': {
      trunk(1.4, 0.14, 0.09);
      canopy(spec.color ?? '#e8b6c6', [
        [0, 1.85, 0, 0.8],
        [0.5, 1.6, 0.3, 0.55],
        [-0.48, 1.66, -0.26, 0.52],
        [0.06, 2.32, -0.1, 0.48],
        [-0.2, 1.95, 0.5, 0.42],
      ]);
      break;
    }
    /* ── 낮은 식생 ── */
    case 'bush': {
      canopy(spec.color ?? '#55743a', [
        [0, 0.34, 0, 0.42],
        [0.32, 0.26, 0.16, 0.3],
        [-0.28, 0.28, -0.18, 0.32],
      ]);
      break;
    }
    case 'flowerbed': {
      canopy('#5c7a3d', [
        [0, 0.24, 0, 0.36],
        [0.3, 0.2, 0.2, 0.26],
      ]);
      const petal = natureMaterials.foliage(spec.color ?? '#d9a3b4');
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * Math.PI * 2;
        add(new THREE.IcosahedronGeometry(0.11 * s, 0), petal, [
          Math.cos(a) * 0.3 * s,
          (0.42 + rnd(i, spec.x) * 0.1) * s,
          Math.sin(a) * 0.3 * s,
        ], undefined, false);
      }
      break;
    }
    case 'reed': {
      const material = natureMaterials.foliage('#8a8a54');
      for (let i = 0; i < 9; i += 1) {
        const a = (i / 9) * Math.PI * 2;
        const h = (0.7 + rnd(i, spec.z) * 0.5) * s;
        const geometry = new THREE.CylinderGeometry(0.012 * s, 0.022 * s, h, 4);
        const mesh = add(geometry, material, [Math.cos(a) * 0.2 * s, h / 2, Math.sin(a) * 0.2 * s], undefined, false);
        mesh.rotation.z = (rnd(i, spec.x) - 0.5) * 0.5;
      }
      break;
    }
    /* ── 불빛 ── */
    case 'lantern': {
      box(0.09, 1.7 * s, 0.09, buildMaterials.wood('#6b5741'), [0, (1.7 * s) / 2, 0], undefined, 2);
      box(0.4 * s, 0.06, 0.4 * s, buildMaterials.darkWood(), [0, 1.72 * s, 0], undefined, 2);
      const globe = add(new THREE.CylinderGeometry(0.17 * s, 0.17 * s, 0.3 * s, 10), glowMaterial('#d2593f'), [0, 1.52 * s, 0], undefined, false);
      light = globe;
      box(0.26 * s, 0.05, 0.26 * s, buildMaterials.darkWood(), [0, 1.34 * s, 0], undefined, 2);
      break;
    }
    case 'stone-lantern': {
      box(0.44 * s, 0.14 * s, 0.44 * s, natureMaterials.rock(), [0, 0.07 * s, 0], undefined, 1.2);
      add(new THREE.CylinderGeometry(0.1 * s, 0.13 * s, 0.7 * s, 8), natureMaterials.rock(), [0, 0.45 * s, 0]);
      const house = add(new THREE.CylinderGeometry(0.22 * s, 0.22 * s, 0.26 * s, 8), glowMaterial('#e0b070'), [0, 0.93 * s, 0], undefined, false);
      light = house;
      add(new THREE.ConeGeometry(0.34 * s, 0.26 * s, 8), natureMaterials.rock(), [0, 1.18 * s, 0]);
      break;
    }
    case 'streetlamp': {
      add(new THREE.CylinderGeometry(0.06 * s, 0.11 * s, 2.5 * s, 8), buildMaterials.metal(), [0, 1.25 * s, 0]);
      box(0.3 * s, 0.1 * s, 0.3 * s, buildMaterials.metal(), [0, 0.06 * s, 0], undefined, 2);
      const glass = add(new THREE.CylinderGeometry(0.15 * s, 0.11 * s, 0.32 * s, 8), glowMaterial('#f0d097'), [0, 2.62 * s, 0], undefined, false);
      light = glass;
      add(new THREE.ConeGeometry(0.22 * s, 0.16 * s, 8), buildMaterials.metal(), [0, 2.86 * s, 0]);
      break;
    }
    /* ── 깃발·표지 ── */
    case 'flag-taegeuk':
    case 'flag-plain': {
      add(new THREE.CylinderGeometry(0.05 * s, 0.07 * s, 3.4 * s, 8), buildMaterials.wood('#a08b5f'), [0, 1.7 * s, 0]);
      add(new THREE.SphereGeometry(0.09 * s, 8, 6), buildMaterials.metal(), [0, 3.44 * s, 0]);
      const cloth = new THREE.PlaneGeometry(1.25 * s, 0.84 * s, 8, 4);
      geometries.push(cloth);
      let material: THREE.Material;
      if (spec.kind === 'flag-taegeuk') {
        const texture = taegeukTexture();
        textures.push(texture);
        material = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          roughness: 0.9,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(spec.color ?? '#cfc8b6'),
          side: THREE.DoubleSide,
          roughness: 0.95,
        });
      }
      const pivot = new THREE.Group();
      pivot.position.set(0, 2.85 * s, 0);
      const flag = new THREE.Mesh(cloth, material);
      flag.position.set(0.64 * s, 0, 0);
      flag.castShadow = true;
      pivot.add(flag);
      group.add(pivot);
      sway = pivot;
      break;
    }
    /* 세로 현수막 — 골목에 걸린 천 */
    case 'banner': {
      box(0.06, 2.6 * s, 0.06, buildMaterials.wood('#6b5741'), [0, 1.3 * s, 0], undefined, 2);
      const pivot = new THREE.Group();
      pivot.position.set(0, 2.5 * s, 0);
      const cloth = new THREE.PlaneGeometry(0.4 * s, 1.7 * s);
      geometries.push(cloth);
      const banner = new THREE.Mesh(
        cloth,
        new THREE.MeshStandardMaterial({
          color: new THREE.Color(spec.color ?? '#9e3b34'),
          side: THREE.DoubleSide,
          roughness: 0.95,
        }),
      );
      banner.position.set(0.22 * s, -0.9 * s, 0);
      banner.castShadow = true;
      pivot.add(banner);
      group.add(pivot);
      sway = pivot;
      break;
    }
    case 'signpost': {
      box(0.09, 1.5 * s, 0.09, buildMaterials.wood('#6b5741'), [0, 0.75 * s, 0], undefined, 2);
      box(0.72 * s, 0.24 * s, 0.07, buildMaterials.darkWood(), [0.16 * s, 1.34 * s, 0], [0, 0, -0.04], 1.4);
      box(0.6 * s, 0.2 * s, 0.07, buildMaterials.darkWood(), [-0.14 * s, 1.02 * s, 0], [0, 0, 0.05], 1.4);
      break;
    }
    /* ── 살림·짐 ── */
    case 'crate': {
      const h = 0.5 * s;
      box(0.62 * s, h, 0.62 * s, buildMaterials.wood('#8c7454'), [0, h / 2, 0], undefined, 1.6);
      box(0.66 * s, 0.05, 0.05, buildMaterials.darkWood(), [0, h * 0.72, 0.31 * s], undefined, 2);
      box(0.66 * s, 0.05, 0.05, buildMaterials.darkWood(), [0, h * 0.28, 0.31 * s], undefined, 2);
      box(0.5 * s, 0.42 * s, 0.5 * s, buildMaterials.wood('#7d6747'), [0.04 * s, h + 0.21 * s, -0.03 * s], [0, 0.5, 0], 1.6);
      break;
    }
    case 'barrel': {
      const geometry = new THREE.CylinderGeometry(0.28 * s, 0.24 * s, 0.68 * s, 12);
      scaleUV(geometry, 2, 1);
      add(geometry, buildMaterials.wood('#7d6747'), [0, 0.34 * s, 0]);
      for (const y of [0.16, 0.52]) {
        add(new THREE.TorusGeometry(0.28 * s, 0.025 * s, 6, 14), buildMaterials.metal(), [0, y * s, 0], [Math.PI / 2, 0, 0], false);
      }
      break;
    }
    case 'cart': {
      box(1.2 * s, 0.12 * s, 0.72 * s, buildMaterials.wood('#8c7454'), [0, 0.46 * s, 0], undefined, 1.2);
      box(1.2 * s, 0.24 * s, 0.06, buildMaterials.wood('#7d6747'), [0, 0.6 * s, 0.34 * s], undefined, 1.4);
      box(1.2 * s, 0.24 * s, 0.06, buildMaterials.wood('#7d6747'), [0, 0.6 * s, -0.34 * s], undefined, 1.4);
      for (const sz of [-1, 1]) {
        const wheel = add(new THREE.TorusGeometry(0.32 * s, 0.06 * s, 6, 14), buildMaterials.darkWood(), [
          0.2 * s,
          0.33 * s,
          sz * 0.4 * s,
        ], [0, Math.PI / 2, 0]);
        wheel.castShadow = true;
        for (let i = 0; i < 4; i += 1) {
          box(0.05, 0.6 * s, 0.05, buildMaterials.darkWood(), [0.2 * s, 0.33 * s, sz * 0.4 * s], [(i * Math.PI) / 4, Math.PI / 2, 0], 2);
        }
      }
      box(0.09, 0.09, 1.0 * s, buildMaterials.wood('#6b5741'), [-0.62 * s, 0.4 * s, 0.18 * s], [0, 0.18, -0.16], 2);
      break;
    }
    case 'bench': {
      box(1.1 * s, 0.09 * s, 0.38 * s, buildMaterials.wood('#8c7454'), [0, 0.42 * s, 0], undefined, 1.4);
      box(1.1 * s, 0.34 * s, 0.07 * s, buildMaterials.wood('#8c7454'), [0, 0.62 * s, -0.16 * s], undefined, 1.4);
      for (const sx of [-1, 1]) {
        box(0.09, 0.42 * s, 0.34 * s, buildMaterials.darkWood(), [sx * 0.48 * s, 0.21 * s, 0], undefined, 2);
      }
      break;
    }
    case 'desk': {
      box(1.1 * s, 0.1 * s, 0.66 * s, buildMaterials.wood('#8c7454'), [0, 0.64 * s, 0], undefined, 1.4);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          box(0.08, 0.6 * s, 0.08, buildMaterials.darkWood(), [sx * 0.46 * s, 0.3 * s, sz * 0.24 * s], undefined, 2);
        }
      }
      // 서류 뭉치
      box(0.3 * s, 0.08 * s, 0.22 * s, buildMaterials.stoneTrim('#e6dcc4'), [0.2 * s, 0.73 * s, 0.05 * s], [0, 0.3, 0], 2);
      break;
    }
    /* 빨랫줄 — 골목에 사람이 산다는 표시 */
    case 'laundry': {
      for (const sx of [-1, 1]) {
        box(0.07, 2.0 * s, 0.07, buildMaterials.wood('#6b5741'), [sx * 1.1 * s, 1.0 * s, 0], undefined, 2);
      }
      box(2.2 * s, 0.03, 0.03, buildMaterials.stoneTrim('#b8ad94'), [0, 1.92 * s, 0], undefined, 3);
      const colors = ['#d8d2c2', '#9fb0c0', '#c2b49a', '#b9c4a8'];
      const pivot = new THREE.Group();
      pivot.position.set(0, 1.9 * s, 0);
      for (let i = 0; i < 4; i += 1) {
        const cloth = new THREE.PlaneGeometry(0.4 * s, 0.6 * s);
        geometries.push(cloth);
        const mesh = new THREE.Mesh(
          cloth,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(colors[i]),
            side: THREE.DoubleSide,
            roughness: 1,
          }),
        );
        mesh.position.set(-0.75 * s + i * 0.5 * s, -0.32 * s, 0);
        mesh.castShadow = true;
        pivot.add(mesh);
      }
      group.add(pivot);
      sway = pivot;
      break;
    }
    /* ── 지형지물 ── */
    case 'well': {
      const ring = new THREE.CylinderGeometry(0.52 * s, 0.58 * s, 0.6 * s, 14, 1, true);
      scaleUV(ring, 3, 1);
      add(ring, natureMaterials.rock(), [0, 0.3 * s, 0]);
      add(new THREE.CylinderGeometry(0.5 * s, 0.5 * s, 0.03, 14), glowMaterial('#2a3d49'), [0, 0.12 * s, 0], undefined, false);
      for (const sx of [-1, 1]) {
        box(0.09, 1.2 * s, 0.09, buildMaterials.wood('#6b5741'), [sx * 0.48 * s, 0.6 * s, 0], undefined, 2);
      }
      box(1.25 * s, 0.1, 0.16, buildMaterials.wood('#6b5741'), [0, 1.2 * s, 0], undefined, 1.6);
      // 두레박
      box(0.2 * s, 0.22 * s, 0.2 * s, buildMaterials.darkWood(), [0.18 * s, 0.88 * s, 0], undefined, 2);
      break;
    }
    case 'rock': {
      const a = add(new THREE.DodecahedronGeometry(0.44 * s, 0), natureMaterials.rock(), [0, 0.3 * s, 0]);
      a.scale.set(1.25, 0.85, 1.05);
      const b = add(new THREE.DodecahedronGeometry(0.26 * s, 0), natureMaterials.rock(), [0.36 * s, 0.17 * s, 0.2 * s]);
      b.scale.set(1.1, 0.8, 1);
      break;
    }
    case 'stump': {
      const geometry = new THREE.CylinderGeometry(0.3 * s, 0.34 * s, 0.4 * s, 10);
      scaleUV(geometry, 2, 0.6);
      add(geometry, natureMaterials.bark(), [0, 0.2 * s, 0]);
      add(new THREE.CylinderGeometry(0.29 * s, 0.29 * s, 0.03, 10), buildMaterials.wood('#b09468'), [0, 0.41 * s, 0], undefined, false);
      break;
    }
    case 'monument': {
      box(1.0 * s, 0.24 * s, 1.0 * s, natureMaterials.rock(), [0, 0.12 * s, 0], undefined, 0.9);
      box(0.78 * s, 0.16 * s, 0.78 * s, natureMaterials.rock(), [0, 0.32 * s, 0], undefined, 0.9);
      const shaft = texturedBox(0.5 * s, 1.7 * s, 0.4 * s, 0.9);
      add(shaft, buildMaterials.ashlar('#cfc9be'), [0, 1.25 * s, 0]);
      box(0.66 * s, 0.14 * s, 0.56 * s, natureMaterials.rock(), [0, 2.17 * s, 0], undefined, 1);
      add(new THREE.ConeGeometry(0.28 * s, 0.34 * s, 4), natureMaterials.rock(), [0, 2.4 * s, 0], [0, Math.PI / 4, 0]);
      break;
    }
  }

  return { group, geometries, textures, sway, light };
}
