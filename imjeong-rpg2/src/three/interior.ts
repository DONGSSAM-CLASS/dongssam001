import * as THREE from 'three';
import type { Figure, FurnitureSpec } from '../types';
import { buildMaterials, clothMaterial, glowMaterial } from './materials';
import { taegeukTexture } from './palette';
import { texturedBox } from './geom';
import { portraitDataUrl } from '../ui/portrait';

/**
 * 실내 가구 — 2탄에서 새로 만든 부분.
 *
 * 1탄은 하늘에서 내려다보는 쿼터뷰라 방 안이 보이지 않았다.
 * 2탄은 1인칭으로 방 안을 걸어 다니므로, 회의실·사무실·인쇄실이
 * 「그 방이구나」 하고 알아볼 수 있을 만큼 채워져 있어야 한다.
 *
 * ⚠ 가구의 모양과 배치는 1920~40년대 사무 공간의 **인상**을 재현한 것이지,
 *   특정 청사 내부의 실측 복원이 아니다. (맵의 historicalNote 에도 밝힌다)
 */

export interface BuiltFurniture {
  group: THREE.Group;
  geometries: THREE.BufferGeometry[];
  textures: THREE.Texture[];
  /** 불빛 — 천장등·등잔 (점광원을 붙일 위치) */
  light?: THREE.Object3D;
  /** 명패처럼 눌러서 여는 것 */
  interactive?: THREE.Object3D;
}

const WOOD = '#7a5c3e';
const WOOD_DARK = '#4a3627';
const PAPER = '#ece3cc';

export function createFurniture(
  spec: FurnitureSpec,
  figureTable: Record<string, Figure>,
  ceiling: number,
): BuiltFurniture {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];
  let light: THREE.Object3D | undefined;
  let interactive: THREE.Object3D | undefined;

  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    pos: [number, number, number],
    rot?: [number, number, number],
    shadow = true,
  ) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    mesh.castShadow = shadow;
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
    density = 1.2,
    shadow = true,
  ) => add(texturedBox(w, h, d, density), material, pos, rot, shadow);

  const wood = buildMaterials.wood(spec.color ?? WOOD);
  const dark = buildMaterials.wood(WOOD_DARK);
  const paper = buildMaterials.stoneTrim(PAPER);

  /** 가구 발자국(격자)과 맞추기 위해, 크기 w×d 칸의 가운데를 원점으로 삼는다 */
  const footprint = (w: number, d: number) => {
    const turned = Math.abs(Math.sin(spec.rot ?? 0)) > 0.5;
    const ww = turned ? d : w;
    const dd = turned ? w : d;
    group.position.set(spec.x + ww / 2, 0, spec.z + dd / 2);
  };

  switch (spec.kind) {
    case 'long-table': {
      const w = spec.w ?? 4;
      footprint(w, 2);
      const len = w - 0.2;
      box(len, 0.07, 1.5, wood, [0, 0.76, 0], undefined, 0.8);
      box(len - 0.3, 0.12, 1.3, dark, [0, 0.67, 0], undefined, 0.8);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) box(0.09, 0.7, 0.09, dark, [sx * (len / 2 - 0.15), 0.35, sz * 0.6], undefined, 2);
      }
      // 초록 모전(탁자보)과 서류 — 회의 탁자로 읽히게
      box(len - 0.6, 0.012, 0.8, clothMaterial('#3f5a45'), [0, 0.8, 0], undefined, 1, false);
      for (let i = 0; i < Math.floor(len / 1.1); i += 1) {
        const x = -len / 2 + 0.7 + i * 1.1;
        box(0.3, 0.012, 0.22, paper, [x, 0.815, 0.46], [0, 0.1 * (i % 3 - 1), 0], 2, false);
        box(0.3, 0.012, 0.22, paper, [x + 0.2, 0.815, -0.46], [0, -0.12 * (i % 2), 0], 2, false);
        // 잉크병
        if (i % 2 === 0) add(new THREE.CylinderGeometry(0.04, 0.045, 0.07, 8), buildMaterials.stoneTrim('#23262c'), [x + 0.25, 0.84, 0.3]);
      }
      break;
    }
    case 'chair': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      box(0.46, 0.05, 0.44, wood, [0, 0.46, 0], undefined, 2);
      box(0.46, 0.55, 0.05, wood, [0, 0.74, -0.2], undefined, 2);
      box(0.36, 0.06, 0.04, dark, [0, 0.92, -0.2], undefined, 2);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) box(0.045, 0.46, 0.045, dark, [sx * 0.19, 0.23, sz * 0.18], undefined, 3);
      }
      break;
    }
    case 'podium': {
      footprint(3, 2);
      // 단 — 의장석은 한 단 높다
      box(2.9, 0.22, 1.9, dark, [0, 0.11, 0], undefined, 0.8);
      box(2.2, 0.85, 0.7, wood, [0, 0.64, 0.45], undefined, 0.8);
      box(2.3, 0.06, 0.8, dark, [0, 1.09, 0.45], undefined, 0.8);
      // 앞판의 태극 문양 원
      add(new THREE.CircleGeometry(0.22, 24), glowMaterial('#b33a3a', 1), [0, 0.66, 0.806], undefined, false);
      add(new THREE.CircleGeometry(0.26, 24), buildMaterials.stoneTrim('#c9a24b'), [0, 0.66, 0.803], undefined, false);
      // 의사봉과 서류
      box(0.36, 0.02, 0.26, paper, [-0.4, 1.13, 0.4], [0, 0.2, 0], 2, false);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), dark, [0.45, 1.15, 0.4], [0, 0, Math.PI / 2]);
      // 의장 의자
      box(0.6, 1.2, 0.08, dark, [0, 0.82, -0.55], undefined, 1.5);
      box(0.6, 0.06, 0.5, dark, [0, 0.7, -0.3], undefined, 1.5);
      break;
    }
    case 'office-desk': {
      footprint(2, 1);
      box(1.7, 0.06, 0.8, wood, [0, 0.76, 0], undefined, 1);
      box(0.5, 0.7, 0.74, dark, [-0.55, 0.37, 0], undefined, 1.5);
      box(0.06, 0.7, 0.7, dark, [0.78, 0.37, 0], undefined, 1.5);
      for (let i = 0; i < 3; i += 1) {
        box(0.44, 0.012, 0.3, paper, [0.1 + i * 0.05, 0.8 + i * 0.013, 0.05], [0, i * 0.12, 0], 2, false);
      }
      const lamp = add(new THREE.CylinderGeometry(0.02, 0.07, 0.22, 10), buildMaterials.metal(), [0.62, 0.9, -0.2]);
      lamp.castShadow = false;
      add(new THREE.ConeGeometry(0.13, 0.12, 12, 1, true), clothMaterial('#3d6a4c'), [0.62, 1.05, -0.2]);
      light = add(new THREE.SphereGeometry(0.04, 8, 6), glowMaterial('#ffe0a0'), [0.62, 1.0, -0.2], undefined, false);
      break;
    }
    case 'bookshelf': {
      footprint(2, 1);
      box(1.8, 2.1, 0.4, dark, [0, 1.05, -0.28], undefined, 1);
      const colors = ['#7d3a2e', '#3e5a6b', '#6b5a2e', '#2f4a3a', '#8a6d44', '#5b3d52'];
      for (let row = 0; row < 4; row += 1) {
        const y = 0.2 + row * 0.5;
        box(1.7, 0.03, 0.38, wood, [0, y, -0.25], undefined, 2, false);
        let x = -0.78;
        let n = 0;
        while (x < 0.76) {
          const bw = 0.05 + ((row * 7 + n * 3) % 5) * 0.012;
          const bh = 0.3 + ((row + n) % 3) * 0.04;
          box(bw, bh, 0.26, clothMaterial(colors[(row + n) % colors.length]), [x + bw / 2, y + bh / 2 + 0.02, -0.2], undefined, 3, false);
          x += bw + 0.008;
          n += 1;
        }
      }
      break;
    }
    case 'flag-stand': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      add(new THREE.CylinderGeometry(0.22, 0.28, 0.12, 14), dark, [0, 0.06, 0]);
      add(new THREE.CylinderGeometry(0.025, 0.03, 2.5, 8), buildMaterials.wood('#b08a4a'), [0, 1.25, 0]);
      add(new THREE.SphereGeometry(0.06, 10, 8), buildMaterials.stoneTrim('#c9a24b'), [0, 2.53, 0]);
      const cloth = new THREE.PlaneGeometry(1.2, 0.8, 10, 4);
      // 깃발이 자연스럽게 늘어지도록 살짝 물결을 준다
      const pos = cloth.getAttribute('position');
      for (let i = 0; i < pos.count; i += 1) {
        const x = pos.getX(i);
        pos.setZ(i, Math.sin((x + 0.6) * 3.2) * 0.05 * (x + 0.6));
      }
      cloth.computeVertexNormals();
      geometries.push(cloth);
      const texture = taegeukTexture();
      textures.push(texture);
      const flag = new THREE.Mesh(
        cloth,
        new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.9 }),
      );
      flag.position.set(0.62, 2.0, 0);
      flag.castShadow = true;
      group.add(flag);
      break;
    }
    case 'frame': {
      group.position.set(spec.x + 0.5, spec.y ?? 1.7, spec.z + 0.5);
      box(0.9, 0.7, 0.05, buildMaterials.stoneTrim('#5a4128'), [0, 0, 0], undefined, 2, false);
      box(0.78, 0.58, 0.02, buildMaterials.stoneTrim(spec.color ?? '#d8ccb0'), [0, 0, 0.03], undefined, 2, false);
      // 글씨처럼 보이는 가로줄
      for (let i = 0; i < 5; i += 1) {
        box(0.56 - (i % 2) * 0.12, 0.02, 0.005, buildMaterials.stoneTrim('#3a3025'), [0, 0.2 - i * 0.1, 0.045], undefined, 4, false);
      }
      break;
    }
    case 'map-board':
    case 'blackboard': {
      const w = spec.w ?? 2;
      group.position.set(spec.x + 0.5, spec.y ?? 1.6, spec.z + 0.5);
      const isMap = spec.kind === 'map-board';
      box(w, 1.2, 0.05, buildMaterials.stoneTrim('#4a3627'), [0, 0, 0], undefined, 2, false);
      box(w - 0.12, 1.08, 0.02, buildMaterials.stoneTrim(isMap ? '#d9ceb0' : '#2e3b33'), [0, 0, 0.03], undefined, 2, false);
      if (isMap) {
        // 한반도를 닮은 윤곽 — 지도판이라는 걸 알아보게 하는 정도 (실제 지도가 아니다)
        const shape = new THREE.Shape();
        const pts: Array<[number, number]> = [
          [0.02, 0.42], [0.14, 0.36], [0.18, 0.2], [0.12, 0.05], [0.16, -0.12], [0.1, -0.3],
          [0.02, -0.4], [-0.1, -0.36], [-0.12, -0.2], [-0.06, -0.05], [-0.12, 0.1], [-0.2, 0.26], [-0.1, 0.4],
        ];
        shape.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts.slice(1)) shape.lineTo(x, y);
        const g = new THREE.ShapeGeometry(shape);
        add(g, buildMaterials.stoneTrim('#8fa27a'), [-w / 4, 0, 0.045], undefined, false);
        // 연락망을 뜻하는 붉은 점과 선
        for (let i = 0; i < 6; i += 1) {
          add(new THREE.CircleGeometry(0.025, 8), glowMaterial('#b33a3a'), [-w / 4 + ((i * 37) % 7) * 0.03 - 0.08, 0.3 - i * 0.12, 0.05], undefined, false);
        }
        for (let i = 0; i < 4; i += 1) {
          box(0.5, 0.012, 0.004, buildMaterials.stoneTrim('#3a3025'), [w / 5, 0.3 - i * 0.14, 0.045], undefined, 4, false);
        }
      } else {
        for (let i = 0; i < 4; i += 1) {
          box(w * 0.6 - (i % 2) * 0.3, 0.02, 0.004, buildMaterials.stoneTrim('#dfe3da'), [-0.1, 0.3 - i * 0.18, 0.045], undefined, 4, false);
        }
      }
      break;
    }
    case 'press': {
      footprint(2, 2);
      // 활판 인쇄기 — 무거운 철제 몸체, 판을 누르는 원판, 손잡이
      const iron = buildMaterials.stoneTrim('#3b3d40');
      box(1.4, 0.9, 1.1, iron, [0, 0.45, 0], undefined, 1);
      box(1.0, 0.08, 0.8, buildMaterials.stoneTrim('#6b6e72'), [0, 0.94, 0], undefined, 1);
      add(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 20), iron, [0, 1.35, -0.2], [0, 0, Math.PI / 2]);
      box(0.1, 0.9, 0.1, iron, [0.6, 1.35, -0.2], undefined, 2);
      box(0.1, 0.9, 0.1, iron, [-0.6, 1.35, -0.2], undefined, 2);
      add(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), buildMaterials.metal(), [0.85, 1.35, 0.2], [0.6, 0, 0]);
      // 찍혀 나온 신문 더미
      for (let i = 0; i < 6; i += 1) box(0.62, 0.01, 0.44, paper, [0.1, 0.99 + i * 0.012, 0.25], [0, i * 0.04, 0], 2, false);
      box(0.7, 0.6, 0.5, wood, [0, 0.3, 0.85], undefined, 1.5);
      for (let i = 0; i < 12; i += 1) box(0.6, 0.01, 0.4, paper, [0, 0.61 + i * 0.01, 0.85], [0, (i % 3) * 0.03, 0], 2, false);
      break;
    }
    case 'safe': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      box(0.8, 1.0, 0.7, buildMaterials.stoneTrim('#2f3a36'), [0, 0.5, 0], undefined, 1);
      box(0.66, 0.84, 0.02, buildMaterials.stoneTrim('#3b4843'), [0, 0.52, 0.36], undefined, 1);
      add(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), buildMaterials.stoneTrim('#c9a24b'), [0.12, 0.6, 0.38], [Math.PI / 2, 0, 0]);
      box(0.04, 0.2, 0.04, buildMaterials.stoneTrim('#c9a24b'), [-0.2, 0.55, 0.38], undefined, 2);
      break;
    }
    case 'ceiling-lamp': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      const top = ceiling > 0 ? ceiling : 3.2;
      add(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), buildMaterials.metal(), [0, top - 0.4, 0], undefined, false);
      add(new THREE.ConeGeometry(0.3, 0.2, 16, 1, true), buildMaterials.stoneTrim('#e9dfc7'), [0, top - 0.86, 0], undefined, false);
      light = add(new THREE.SphereGeometry(0.09, 10, 8), glowMaterial('#ffe4ad'), [0, top - 0.92, 0], undefined, false);
      break;
    }
    case 'oil-lamp': {
      group.position.set(spec.x + 0.5, spec.y ?? 0.8, spec.z + 0.5);
      add(new THREE.CylinderGeometry(0.07, 0.09, 0.08, 12), buildMaterials.stoneTrim('#8c6a3a'), [0, 0.04, 0]);
      add(new THREE.SphereGeometry(0.07, 12, 10), buildMaterials.stoneTrim('#e8e0cc'), [0, 0.15, 0]);
      light = add(new THREE.SphereGeometry(0.035, 8, 6), glowMaterial('#ffcf7a'), [0, 0.2, 0], undefined, false);
      break;
    }
    case 'bench-long': {
      const w = spec.w ?? 3;
      footprint(w, 1);
      box(w - 0.2, 0.06, 0.4, wood, [0, 0.45, 0], undefined, 1);
      box(w - 0.2, 0.4, 0.05, wood, [0, 0.7, -0.2], undefined, 1);
      for (let i = 0; i <= Math.floor(w / 1.5); i += 1) {
        const x = -w / 2 + 0.25 + (i * (w - 0.5)) / Math.max(1, Math.floor(w / 1.5));
        box(0.06, 0.45, 0.36, dark, [x, 0.22, 0], undefined, 2);
      }
      break;
    }
    case 'plant': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      add(new THREE.CylinderGeometry(0.2, 0.15, 0.4, 12), buildMaterials.stoneTrim('#8a5a3c'), [0, 0.2, 0]);
      const leaf = buildMaterials.stoneTrim('#4d6b3c');
      for (let i = 0; i < 7; i += 1) {
        const a = (i / 7) * Math.PI * 2;
        const m = add(new THREE.SphereGeometry(0.16, 8, 6), leaf, [Math.cos(a) * 0.14, 0.62 + (i % 3) * 0.12, Math.sin(a) * 0.14]);
        m.scale.set(1, 1.5, 0.6);
        m.rotation.y = a;
      }
      break;
    }
    case 'display-case': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      box(0.9, 0.9, 0.9, buildMaterials.stoneTrim('#3a3128'), [0, 0.45, 0], undefined, 1);
      const glass = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#cfe3ea'),
        transparent: true,
        opacity: 0.18,
        roughness: 0.05,
        metalness: 0.1,
        depthWrite: false,
      });
      add(new THREE.BoxGeometry(0.86, 0.5, 0.86), glass, [0, 1.15, 0], undefined, false);
      box(0.4, 0.02, 0.3, paper, [0, 0.92, 0], [0, 0.3, 0], 2, false);
      light = add(new THREE.SphereGeometry(0.02, 6, 4), glowMaterial('#fff4d8'), [0, 1.38, 0], undefined, false);
      break;
    }
    case 'stove': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      box(0.9, 0.7, 0.8, buildMaterials.brick('#7d6a5a'), [0, 0.35, 0], undefined, 1);
      add(new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), buildMaterials.stoneTrim('#2a2724'), [0, 0.7, 0], [Math.PI, 0, 0]);
      add(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 16), buildMaterials.stoneTrim('#3a3632'), [0, 0.74, 0]);
      break;
    }
    case 'signboard': {
      group.position.set(spec.x + 0.5, spec.y ?? 2.55, spec.z + 0.5);
      const len = Math.max(1.4, Math.min(3.2, (spec.label?.length ?? 6) * 0.3));
      box(len, 0.5, 0.08, buildMaterials.wood('#3c2c1e'), [0, 0, 0], undefined, 1.4, false);
      box(len + 0.14, 0.07, 0.12, buildMaterials.wood('#6b5238'), [0, 0.28, 0], undefined, 1.4, false);
      box(len + 0.14, 0.07, 0.12, buildMaterials.wood('#6b5238'), [0, -0.28, 0], undefined, 1.4, false);
      box(len - 0.2, 0.34, 0.01, buildMaterials.stoneTrim('#2b2118'), [0, 0, 0.045], undefined, 2, false);
      group.userData.signText = spec.label ?? '';
      break;
    }
    case 'honor-plaque': {
      group.position.set(spec.x + 0.5, 0, spec.z + 0.5);
      const figure = spec.figureId ? figureTable[spec.figureId] : undefined;
      // 석조 받침 + 초상 액자 + 이름판. 초상은 1탄과 같은 방식으로 캔버스에 그린 양식화된 그림이다.
      box(0.9, 0.9, 0.5, buildMaterials.ashlar('#bdb6a7'), [0, 0.45, -0.1], undefined, 1);
      box(0.98, 0.06, 0.58, buildMaterials.stoneTrim('#8d8574'), [0, 0.92, -0.1], undefined, 1);
      box(0.72, 0.9, 0.06, buildMaterials.stoneTrim('#3d2c1c'), [0, 1.55, -0.3], [-0.08, 0, 0], 2);
      if (figure) {
        const texture = new THREE.TextureLoader().load(portraitDataUrl(figure));
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        add(
          new THREE.PlaneGeometry(0.6, 0.76),
          new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
          [0, 1.56, -0.262],
          [-0.08, 0, 0],
          false,
        );
      }
      // 이름판 (글씨는 CSS 이름표로 띄운다)
      box(0.66, 0.16, 0.03, buildMaterials.stoneTrim('#c9a24b'), [0, 0.7, 0.16], undefined, 2, false);
      // 헌화대 — 기부하면 국화가 놓인다 (렌더러가 켠다)
      const flowers = new THREE.Group();
      flowers.name = 'flowers';
      flowers.visible = false;
      const stem = buildMaterials.stoneTrim('#4d6b3c');
      const petal = buildMaterials.stoneTrim('#f3efe2');
      const core = buildMaterials.stoneTrim('#e2c25a');
      for (let i = 0; i < 5; i += 1) {
        const x = -0.2 + i * 0.1;
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 4), stem);
        s.position.set(x, 1.08, 0.02 + (i % 2) * 0.04);
        s.rotation.z = (i - 2) * 0.12;
        geometries.push(s.geometry);
        flowers.add(s);
        const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), petal);
        bloom.position.set(x + (i - 2) * 0.017, 1.23, 0.02 + (i % 2) * 0.04);
        bloom.scale.set(1, 0.65, 1);
        geometries.push(bloom.geometry);
        flowers.add(bloom);
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), core);
        c.position.set(bloom.position.x, 1.26, bloom.position.z);
        geometries.push(c.geometry);
        flowers.add(c);
      }
      // 편지 봉투 — 편지를 쓰면 놓인다
      const envelope = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.01, 0.18), buildMaterials.stoneTrim('#f4ecd8'));
      envelope.name = 'envelope';
      envelope.position.set(0.28, 0.965, 0.05);
      envelope.rotation.y = -0.3;
      envelope.visible = false;
      geometries.push(envelope.geometry);
      group.add(flowers, envelope);
      // 기부 후 은은하게 빛나는 받침 테두리
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 32), glowMaterial('#ffd978', 0.5));
      halo.name = 'halo';
      halo.rotation.x = -Math.PI / 2;
      halo.position.set(0, 0.02, 0.2);
      halo.visible = false;
      geometries.push(halo.geometry);
      group.add(halo);
      interactive = group;
      group.userData.plaqueFigureId = spec.figureId;
      break;
    }
  }

  // 벽에 거는 것은 칸 가운데가 아니라 뒤쪽 벽면에 붙인다 (rot 으로 어느 벽인지 정한다)
  if (spec.kind === 'frame' || spec.kind === 'map-board' || spec.kind === 'blackboard' || spec.kind === 'signboard') {
    for (const child of group.children) child.position.z -= 0.45;
  }
  if (spec.rot) group.rotation.y = spec.rot;

  return { group, geometries, textures, light, interactive };
}
