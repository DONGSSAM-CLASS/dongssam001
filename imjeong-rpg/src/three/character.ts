import * as THREE from 'three';
import type { Appearance, Figure } from '../types';
import { clothMaterial, glowMaterial, outlineMaterial, skinMaterial } from './materials';

/**
 * 인물 — 고증한 차림새를 3D 로 세운다.
 *
 * ## 왜 회전체(Lathe)인가
 * 두루마기와 치마는 어깨에서 밑단으로 부드럽게 퍼지는 옷이다.
 * 이걸 상자나 원기둥으로 만들면 「블록 장난감」처럼 보인다.
 * 옆면 윤곽선을 점으로 찍어 회전시키는 LatheGeometry 를 쓰면
 * 천이 흐르는 실루엣이 나오고, 이것이 실루엣만으로 한복을 알아보게 하는 핵심이다.
 *
 * ## 무엇을 재현하고 무엇을 재현하지 않는가
 * - 재현한다 — 옷(두루마기·저고리와 치마·양복·광복군 군복·장삼),
 *   흰 동정, 고름, 갓·중절모·군모, 안경, 수염, 상투·쪽머리, 각반·혁대·견장
 * - 재현하지 않는다 — **실존 인물의 얼굴**. 이목구비는 양식화한다.
 *   사진이 남지 않은 인물이 많고, 만들어 낸 얼굴을 초상처럼 쓰면 역사 오인을 부른다.
 *
 * 각 인물의 차림 근거는 `src/data/figures.ts` 의 `appearance.note` 에 있다.
 */

export interface BuiltCharacter {
  group: THREE.Group;
  geometries: THREE.BufferGeometry[];
  parts: {
    body: THREE.Object3D;
    leftLeg: THREE.Object3D;
    rightLeg: THREE.Object3D;
    leftArm: THREE.Object3D;
    rightArm: THREE.Object3D;
    head: THREE.Object3D;
    /** 치마·두루마기 자락 — 걸을 때 살짝 흔들린다 */
    skirt: THREE.Object3D | null;
  };
  hitMesh: THREE.Mesh;
  /**
   * 가려졌을 때 비쳐 보이는 실루엣 (플레이어만).
   * 건물을 반투명하게 만드는 것만으로는 흰 두루마기가 흰 벽에 묻힌다.
   * 벽 너머로도 보이는 밝은 윤곽을 따로 두어 내 캐릭터를 놓치지 않게 한다.
   */
  xray: THREE.Group | null;
}

/* ───────────────────────── 색 ───────────────────────── */

const SKIN = { young: '#e9c8a4', middle: '#e2bf9b', old: '#dcb994' } as const;
const HAIR_BLACK = '#211a15';
const HAIR_GREY = '#5e564c';
const HAIR_WHITE = '#8e877b';

function hairColor(app: Appearance): string {
  if (app.age === 'old') return app.facialHair === 'long-beard' ? HAIR_WHITE : HAIR_GREY;
  return HAIR_BLACK;
}

function shade(hex: string, amount: number): string {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return `#${color.getHexString()}`;
}

/* ───────────────────────── 만들기 도우미 ───────────────────────── */

interface Ctx {
  geometries: THREE.BufferGeometry[];
}

function put(
  ctx: Ctx,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  pos: [number, number, number] = [0, 0, 0],
  rot?: [number, number, number],
  castShadow = true,
): THREE.Mesh {
  ctx.geometries.push(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * 윤곽선을 두른다 — 같은 모양을 조금 키워 뒷면만 어둡게 그린다.
 * 실루엣을 결정하는 큰 부재(옷·머리·모자)에만 두른다. 작은 것까지 두르면 지저분해진다.
 */
function outline(ctx: Ctx, source: THREE.Mesh, scale = 1.07): THREE.Mesh {
  const mesh = new THREE.Mesh(source.geometry, outlineMaterial());
  mesh.position.copy(source.position);
  mesh.rotation.copy(source.rotation);
  mesh.scale.copy(source.scale).multiplyScalar(scale);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = -1;
  source.parent?.add(mesh);
  void ctx;
  return mesh;
}

/** 옆면 윤곽선을 돌려 옷을 만든다 */
function lathe(points: Array<[number, number]>, segments = 24): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

/* ───────────────────────── 옷 ───────────────────────── */

/**
 * 두루마기 — 어깨에서 발목까지 부드럽게 퍼지는 한복 겉옷.
 * 앞이 트여 있고 흰 동정과 고름이 달린다.
 */
function makeDurumagi(ctx: Ctx, parent: THREE.Object3D, app: Appearance): THREE.Object3D {
  const body = clothMaterial(app.coat);
  const skirt = new THREE.Group();
  parent.add(skirt);

  // 두루마기는 종 모양이 아니다. 어깨에서 발목까지 거의 곧게 내려오다
  // 밑단에서만 조금 퍼진다. 이 비례가 어긋나면 드레스처럼 보인다.
  outline(ctx, put(
    ctx,
    lathe([
      [0.005, 0.0],
      [0.285, 0.0],
      [0.283, 0.07],
      [0.272, 0.26],
      [0.258, 0.48],
      [0.243, 0.7],
      [0.228, 0.88],
      [0.214, 1.0],
      [0.2, 1.09],
      [0.175, 1.15],
      [0.005, 1.17],
    ]),
    body,
    skirt,
  ), 1.055);

  // 앞 여밈선 — 오른쪽 자락이 왼쪽 위로 덮인다
  // 앞 여밈선 — 오른쪽 자락이 왼쪽 위로 덮인다
  put(
    ctx,
    new THREE.BoxGeometry(0.013, 1.0, 0.02),
    clothMaterial(shade(app.coat, -0.055)),
    skirt,
    [0.035, 0.54, 0.253],
    [0.05, 0, -0.02],
  );
  // 옷자락 그림자선 — 천이 접히는 느낌
  // 옷자락의 접힘 — 진하게 넣으면 얼룩처럼 보인다. 아주 옅게만 넣는다.
  for (const angle of [-0.9, 0.9]) {
    put(
      ctx,
      new THREE.BoxGeometry(0.01, 0.66, 0.012),
      clothMaterial(shade(app.coat, -0.035)),
      skirt,
      [Math.sin(angle) * 0.258, 0.34, Math.cos(angle) * 0.258],
      [0, angle, 0],
      false,
    );
  }
  // 어깨 — 옷이 목에서 곧바로 떨어지면 마네킹처럼 보인다
  put(
    ctx,
    lathe([[0.005, 1.1], [0.2, 1.1], [0.212, 1.14], [0.19, 1.19], [0.005, 1.2]], 20),
    clothMaterial(shade(app.coat, 0.03)),
    parent,
  );
  return skirt;
}

/** 여성 한복 — 가슴 위에서 퍼지는 치마와 짧은 저고리 */
function makeHanbokWoman(ctx: Ctx, parent: THREE.Object3D, app: Appearance): THREE.Object3D {
  const skirt = new THREE.Group();
  parent.add(skirt);

  // 치마 — 이 종 모양이 여성 한복을 한눈에 알아보게 한다
  outline(ctx, put(
    ctx,
    lathe([
      [0.005, 0.0],
      [0.47, 0.0],
      [0.465, 0.08],
      [0.44, 0.28],
      [0.4, 0.5],
      [0.34, 0.68],
      [0.26, 0.82],
      [0.19, 0.9],
      [0.16, 0.93],
    ]),
    clothMaterial(app.lower),
    skirt,
  ), 1.05);
  // 치마 주름
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    put(
      ctx,
      new THREE.BoxGeometry(0.016, 0.8, 0.02),
      clothMaterial(shade(app.lower, -0.035)),
      skirt,
      [Math.sin(angle) * 0.37, 0.4, Math.cos(angle) * 0.37],
      [0.1, angle, 0],
      false,
    );
  }
  // 저고리 — 짧고 품이 좁다
  put(
    ctx,
    lathe([
      [0.005, 0.89],
      [0.196, 0.89],
      [0.218, 0.95],
      [0.226, 1.03],
      [0.214, 1.1],
      [0.185, 1.16],
      [0.005, 1.18],
    ]),
    clothMaterial(app.coat),
    parent,
  );
  return skirt;
}

/** 중국식 장삼 — 목까지 올라오는 깃에 옆이 트인 긴 옷 */
function makeChangshan(ctx: Ctx, parent: THREE.Object3D, app: Appearance): THREE.Object3D {
  const skirt = new THREE.Group();
  parent.add(skirt);
  outline(ctx, put(
    ctx,
    lathe([
      [0.005, 0.0],
      [0.262, 0.0],
      [0.259, 0.1],
      [0.249, 0.34],
      [0.238, 0.6],
      [0.226, 0.82],
      [0.212, 0.98],
      [0.192, 1.09],
      [0.005, 1.16],
    ]),
    clothMaterial(app.coat),
    skirt,
  ), 1.055);
  // 깃 — 목을 감싸는 선 (입식 칼라)
  put(
    ctx,
    new THREE.CylinderGeometry(0.128, 0.128, 0.13, 14, 1, true),
    clothMaterial(shade(app.coat, -0.12)),
    parent,
    [0, 1.16, 0],
  );
  // 오른쪽 옆으로 여미는 단추선
  for (let i = 0; i < 4; i += 1) {
    put(
      ctx,
      new THREE.SphereGeometry(0.018, 6, 5),
      clothMaterial(shade(app.coat, -0.2)),
      parent,
      [0.1 + i * 0.02, 1.08 - i * 0.09, 0.26 - i * 0.012],
      undefined,
      false,
    );
  }
  return skirt;
}

/** 양복 — 어깨가 각지고 허리가 들어간 재킷, 옷깃과 넥타이 */
function makeSuit(ctx: Ctx, parent: THREE.Object3D, app: Appearance): void {
  const jacket = clothMaterial(app.coat);
  outline(ctx, put(
    ctx,
    lathe([
      [0.005, 0.44],
      [0.225, 0.44],
      [0.235, 0.56],
      [0.24, 0.76],
      [0.238, 0.96],
      [0.225, 1.08],
      [0.195, 1.14],
      [0.005, 1.15],
    ]),
    jacket,
    parent,
  ), 1.06);
  // 셔츠와 넥타이
  put(ctx, new THREE.BoxGeometry(0.15, 0.3, 0.06), clothMaterial(app.trim), parent, [0, 0.96, 0.19]);
  put(ctx, new THREE.BoxGeometry(0.046, 0.2, 0.025), clothMaterial('#5d3a33'), parent, [0, 0.95, 0.228]);
  put(ctx, new THREE.BoxGeometry(0.06, 0.05, 0.035), clothMaterial('#6b443c'), parent, [0, 1.06, 0.228]);
  // 옷깃 — 가슴에서 V 로 벌어진다
  for (const sx of [-1, 1]) {
    put(
      ctx,
      new THREE.BoxGeometry(0.1, 0.28, 0.05),
      jacket,
      parent,
      [sx * 0.098, 0.99, 0.2],
      [0.06, 0, sx * 0.22],
    );
  }
  // 앞단추
  for (let i = 0; i < 2; i += 1) {
    put(
      ctx,
      new THREE.SphereGeometry(0.016, 6, 5),
      clothMaterial(shade(app.coat, -0.25)),
      parent,
      [0.03, 0.78 - i * 0.1, 0.235],
      undefined,
      false,
    );
  }
  // 가슴 주머니 수건
  put(ctx, new THREE.BoxGeometry(0.07, 0.03, 0.02), clothMaterial(app.trim), parent, [-0.13, 1.0, 0.235], undefined, false);
}

/** 광복군 군복 — 허리까지 오는 상의에 혁대, 어깨에 견장 */
function makeUniform(ctx: Ctx, parent: THREE.Object3D, app: Appearance): void {
  const tunic = clothMaterial(app.coat);
  outline(ctx, put(
    ctx,
    lathe([
      [0.005, 0.5],
      [0.235, 0.5],
      [0.243, 0.62],
      [0.245, 0.82],
      [0.24, 1.0],
      [0.222, 1.1],
      [0.195, 1.15],
      [0.005, 1.16],
    ]),
    tunic,
    parent,
  ), 1.06);
  // 혁대와 버클
  put(ctx, new THREE.CylinderGeometry(0.248, 0.248, 0.075, 18), clothMaterial('#3b3128'), parent, [0, 0.66, 0]);
  put(ctx, new THREE.BoxGeometry(0.075, 0.07, 0.03), clothMaterial('#a8914f'), parent, [0, 0.66, 0.245], undefined, false);
  // 어깨 견장
  for (const sx of [-1, 1]) {
    put(
      ctx,
      new THREE.BoxGeometry(0.075, 0.03, 0.14),
      clothMaterial(app.trim),
      parent,
      [sx * 0.19, 1.125, 0.01],
      [0, 0, sx * 0.14],
    );
  }
  // 가슴 주머니 두 개
  for (const sx of [-1, 1]) {
    put(ctx, new THREE.BoxGeometry(0.115, 0.1, 0.03), clothMaterial(shade(app.coat, -0.07)), parent, [sx * 0.11, 0.98, 0.235], undefined, false);
    put(ctx, new THREE.BoxGeometry(0.115, 0.022, 0.035), clothMaterial(app.trim), parent, [sx * 0.11, 1.03, 0.238], undefined, false);
  }
  // 깃 — 목 앞에서 V 로 벌어진다
  for (const sx of [-1, 1]) {
    put(ctx, new THREE.BoxGeometry(0.085, 0.1, 0.04), clothMaterial(app.trim), parent, [sx * 0.085, 1.1, 0.2], [0, 0, sx * 0.3]);
  }
}

/** 학생복 — 목까지 올라오는 깃에 단추 한 줄 */
function makeStudent(ctx: Ctx, parent: THREE.Object3D, app: Appearance): void {
  outline(ctx, put(
    ctx,
    lathe([
      [0.005, 0.46],
      [0.225, 0.46],
      [0.235, 0.62],
      [0.238, 0.88],
      [0.23, 1.06],
      [0.2, 1.14],
      [0.005, 1.15],
    ]),
    clothMaterial(app.coat),
    parent,
  ), 1.06);
  put(ctx, new THREE.CylinderGeometry(0.135, 0.135, 0.1, 14, 1, true), clothMaterial(app.trim), parent, [0, 1.16, 0]);
  for (let i = 0; i < 4; i += 1) {
    put(ctx, new THREE.SphereGeometry(0.016, 6, 5), clothMaterial('#c8ab5e'), parent, [0, 1.04 - i * 0.12, 0.235], undefined, false);
  }
}

/* ───────────────────────── 한복 마감 ───────────────────────── */

/**
 * 동정 — 깃에 덧대는 흰 천.
 * 한복에서 이 흰 선 하나가 있고 없고의 차이가 아주 크다.
 */
function addDongjeong(ctx: Ctx, parent: THREE.Object3D, top: number) {
  const white = clothMaterial('#ffffff');
  put(ctx, new THREE.CylinderGeometry(0.128, 0.128, 0.06, 18, 1, true), white, parent, [0, top - 0.01, 0]);
  // 가슴 앞으로 내려오는 V 자 깃 — 흰 두루마기에서도 보이도록 그림자선을 함께 넣는다
  for (const sx of [-1, 1]) {
    put(ctx, new THREE.BoxGeometry(0.046, 0.3, 0.024), white, parent, [sx * 0.07, top - 0.16, 0.165], [0.1, 0, sx * 0.26]);
    put(ctx, new THREE.BoxGeometry(0.012, 0.3, 0.022), clothMaterial('#b9b0a0'), parent, [sx * 0.095, top - 0.16, 0.158], [0.1, 0, sx * 0.26], false);
  }
}

/** 고름 — 오른쪽 가슴에서 맨 끈. 짧은 자락과 긴 자락이 늘어진다. */
function addGoreum(ctx: Ctx, parent: THREE.Object3D, color: string, top: number) {
  const ribbon = clothMaterial(color);
  put(ctx, new THREE.SphereGeometry(0.032, 8, 6), ribbon, parent, [0.05, top - 0.22, 0.208], undefined, false);
  put(ctx, new THREE.BoxGeometry(0.05, 0.2, 0.016), ribbon, parent, [0.026, top - 0.33, 0.208], [0, 0, 0.16]);
  put(ctx, new THREE.BoxGeometry(0.05, 0.27, 0.016), ribbon, parent, [0.078, top - 0.37, 0.205], [0, 0, -0.1]);
}

/* ───────────────────────── 머리와 얼굴 ───────────────────────── */

function addHead(ctx: Ctx, parent: THREE.Object3D, app: Appearance): THREE.Group {
  const head = new THREE.Group();
  head.position.y = 1.38;
  parent.add(head);

  const skin = skinMaterial(SKIN[app.age]);
  const hair = clothMaterial(hairColor(app));

  // 목
  put(ctx, new THREE.CylinderGeometry(0.066, 0.078, 0.13, 12), skin, parent, [0, 1.2, 0]);

  // 머리통 — 완전한 구보다 살짝 갸름하게
  const skull = put(ctx, new THREE.SphereGeometry(0.152, 18, 16), skin, head);
  skull.scale.set(0.92, 1.08, 0.94);
  outline(ctx, skull, 1.07);

  // 귀
  for (const sx of [-1, 1]) {
    const ear = put(ctx, new THREE.SphereGeometry(0.03, 8, 6), skin, head, [sx * 0.14, -0.005, 0], undefined, false);
    ear.scale.set(0.5, 1.1, 0.8);
  }

  // 코
  const nose = put(ctx, new THREE.ConeGeometry(0.03, 0.066, 8), skin, head, [0, -0.022, 0.138], [Math.PI / 2, 0, 0], false);
  nose.scale.set(1, 1, 0.8);

  // 눈 — 점만 찍는다 (이목구비를 자세히 만들면 초상처럼 보인다)
  const ink = clothMaterial('#2a221c');
  for (const sx of [-1, 1]) {
    const eye = put(ctx, new THREE.SphereGeometry(0.019, 8, 6), ink, head, [sx * 0.056, 0.031, 0.13], undefined, false);
    eye.scale.set(1.15, 0.85, 0.5);
  }
  // 눈썹
  for (const sx of [-1, 1]) {
    const brow = put(ctx, new THREE.BoxGeometry(0.056, 0.012, 0.014), hair, head, [sx * 0.058, 0.07, 0.129], undefined, false);
    brow.rotation.z = sx * (app.age === 'old' ? 0.16 : 0.1);
  }
  // 입
  put(ctx, new THREE.BoxGeometry(0.046, 0.009, 0.012), clothMaterial('#9c6a5c'), head, [0, -0.08, 0.126], undefined, false);

  addHair(ctx, head, app, hair);
  addFacialHair(ctx, head, app, hair);
  if (app.glasses) addGlasses(ctx, head);
  addHeadwear(ctx, head, app);

  return head;
}

function addHair(ctx: Ctx, head: THREE.Object3D, app: Appearance, hair: THREE.Material) {
  const cap = (phi: number, radius = 0.16, y = 0.008) => {
    const mesh = put(ctx, new THREE.SphereGeometry(radius, 18, 14, 0, Math.PI * 2, 0, phi), hair, head, [0, y, 0]);
    mesh.scale.set(0.94, 1.06, 0.97);
    return mesh;
  };

  switch (app.hair) {
    case 'cropped': {
      const c = cap(Math.PI * 0.56, 0.163);
      c.scale.set(0.96, 1.02, 0.99);
      put(ctx, new THREE.SphereGeometry(0.088, 12, 10), hair, head, [0, -0.012, -0.102], undefined, false);
      // 구레나룻
      for (const sx of [-1, 1]) {
        const side = put(ctx, new THREE.SphereGeometry(0.05, 8, 6), hair, head, [sx * 0.125, 0.015, -0.01], undefined, false);
        side.scale.set(0.5, 1.05, 1.0);
      }
      break;
    }
    case 'parted': {
      cap(Math.PI * 0.58);
      // 가르마 — 한쪽을 도톰하게
      const side = put(ctx, new THREE.SphereGeometry(0.088, 12, 10), hair, head, [-0.05, 0.075, 0.03], undefined, false);
      side.scale.set(1, 0.55, 0.9);
      put(ctx, new THREE.SphereGeometry(0.08, 10, 8), hair, head, [0, -0.005, -0.1], undefined, false);
      break;
    }
    case 'sleek': {
      const c = cap(Math.PI * 0.56);
      c.scale.set(0.94, 1.0, 1.05);
      const back = put(ctx, new THREE.SphereGeometry(0.095, 12, 10), hair, head, [0, 0.02, -0.075], undefined, false);
      back.scale.set(1, 0.9, 1.1);
      break;
    }
    case 'balding': {
      // 옆과 뒤에만 머리가 남는다
      for (const sx of [-1, 1]) {
        const s = put(ctx, new THREE.SphereGeometry(0.075, 10, 8), hair, head, [sx * 0.098, 0.012, -0.01], undefined, false);
        s.scale.set(0.55, 0.9, 1.05);
      }
      const back = put(ctx, new THREE.SphereGeometry(0.086, 12, 10), hair, head, [0, 0.005, -0.082], undefined, false);
      back.scale.set(1.05, 0.85, 0.8);
      break;
    }
    case 'topknot': {
      // 망건을 두르고 정수리에 상투를 튼 머리
      cap(Math.PI * 0.5, 0.157, 0.004);
      put(ctx, new THREE.CylinderGeometry(0.143, 0.143, 0.045, 18, 1, true), clothMaterial('#241c16'), head, [0, 0.062, 0]);
      put(ctx, new THREE.CylinderGeometry(0.034, 0.042, 0.075, 10), hair, head, [0, 0.175, 0]);
      put(ctx, new THREE.SphereGeometry(0.036, 10, 8), hair, head, [0, 0.215, 0], undefined, false);
      break;
    }
    case 'bun': {
      // 쪽머리 — 뒤통수 아래에 낮게 쪽을 지고 비녀를 꽂는다
      cap(Math.PI * 0.62, 0.162);
      const side = put(ctx, new THREE.SphereGeometry(0.1, 12, 10), hair, head, [0, 0.03, 0.02], undefined, false);
      side.scale.set(1.32, 0.75, 1.15);
      const bun = put(ctx, new THREE.SphereGeometry(0.062, 12, 10), hair, head, [0, -0.085, -0.125]);
      bun.scale.set(1.25, 0.85, 1);
      // 비녀 — 군모를 쓰면 가려지므로 빼 둔다
      if (app.headwear === 'none') {
        put(
          ctx,
          new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6),
          clothMaterial('#c9a24b'),
          head,
          [0, -0.085, -0.125],
          [0, 0, Math.PI / 2],
          false,
        );
      }
      break;
    }
    case 'bob': {
      // 단발 — 턱선까지 내려오는 짧은 머리
      cap(Math.PI * 0.6, 0.163);
      for (const sx of [-1, 1]) {
        const s = put(ctx, new THREE.SphereGeometry(0.085, 12, 10), hair, head, [sx * 0.098, -0.05, -0.012]);
        s.scale.set(0.62, 1.15, 1.02);
      }
      const back = put(ctx, new THREE.SphereGeometry(0.105, 12, 10), hair, head, [0, -0.045, -0.072]);
      back.scale.set(1.05, 1.05, 0.85);
      break;
    }
  }
}

function addFacialHair(ctx: Ctx, head: THREE.Object3D, app: Appearance, hair: THREE.Material) {
  if (app.facialHair === 'none') return;
  // 콧수염
  const mustache = put(ctx, new THREE.BoxGeometry(0.1, 0.028, 0.03), hair, head, [0, -0.052, 0.125], undefined, false);
  mustache.scale.set(1, 1, 1);
  if (app.facialHair === 'mustache') return;

  if (app.facialHair === 'beard') {
    const beard = put(ctx, new THREE.SphereGeometry(0.075, 12, 10), hair, head, [0, -0.1, 0.055], undefined, false);
    beard.scale.set(1.05, 0.9, 0.85);
    return;
  }
  // 긴 수염 — 노년의 유학자
  const chin = put(ctx, new THREE.SphereGeometry(0.07, 12, 10), hair, head, [0, -0.095, 0.06], undefined, false);
  chin.scale.set(1, 0.8, 0.85);
  put(ctx, new THREE.ConeGeometry(0.062, 0.3, 10), hair, head, [0, -0.26, 0.045], [Math.PI, 0, 0], false);
}

function addGlasses(ctx: Ctx, head: THREE.Object3D) {
  // 둥근 테 — 이 시기 사진에 가장 흔한 형태
  const frame = clothMaterial('#3a352e');
  for (const sx of [-1, 1]) {
    put(
      ctx,
      new THREE.TorusGeometry(0.042, 0.007, 6, 18),
      frame,
      head,
      [sx * 0.058, 0.031, 0.127],
      undefined,
      false,
    );
    // 안경알 — 살짝 비치게
    const lens = put(
      ctx,
      new THREE.CircleGeometry(0.04, 16),
      glowMaterial('#cfe0e6', 0.22),
      head,
      [sx * 0.058, 0.031, 0.126],
      undefined,
      false,
    );
    lens.renderOrder = 1;
    // 안경다리
    put(ctx, new THREE.BoxGeometry(0.012, 0.008, 0.11), frame, head, [sx * 0.112, 0.033, 0.066], [0, sx * 0.24, 0], false);
  }
  put(ctx, new THREE.BoxGeometry(0.03, 0.008, 0.01), frame, head, [0, 0.035, 0.13], undefined, false);
}

function addHeadwear(ctx: Ctx, head: THREE.Object3D, app: Appearance) {
  switch (app.headwear) {
    case 'gat': {
      // 갓 — 넓고 평평한 양태에 원통형 대우, 턱 아래로 갓끈
      const black = clothMaterial('#2a2620');
      put(ctx, new THREE.CylinderGeometry(0.33, 0.345, 0.014, 26), black, head, [0, 0.085, 0]);
      put(ctx, new THREE.CylinderGeometry(0.118, 0.132, 0.17, 18), black, head, [0, 0.175, 0]);
      put(ctx, new THREE.CylinderGeometry(0.12, 0.12, 0.012, 18), black, head, [0, 0.262, 0], undefined, false);
      // 갓끈 — 구슬을 꿴 줄
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i += 1) {
          put(
            ctx,
            new THREE.SphereGeometry(0.016, 6, 5),
            clothMaterial('#3f3730'),
            head,
            [sx * (0.115 - i * 0.012), 0.02 - i * 0.052, 0.055 + i * 0.006],
            undefined,
            false,
          );
        }
      }
      break;
    }
    case 'tanggeon': {
      // 탕건 — 갓 안에 쓰는 낮은 관
      const black = clothMaterial('#2c2721');
      put(ctx, new THREE.CylinderGeometry(0.148, 0.163, 0.115, 20), black, head, [0, 0.12, 0]);
      put(ctx, new THREE.CylinderGeometry(0.125, 0.148, 0.075, 20), black, head, [0, 0.2, 0]);
      put(ctx, new THREE.CylinderGeometry(0.128, 0.128, 0.012, 20), clothMaterial('#3d362e'), head, [0, 0.24, 0], undefined, false);
      break;
    }
    case 'fedora': {
      // 중절모 — 챙이 둥글고 위가 눌린 모자
      const felt = clothMaterial('#3c352c');
      put(ctx, new THREE.CylinderGeometry(0.255, 0.265, 0.018, 22), felt, head, [0, 0.085, 0.01]);
      const crown = put(ctx, new THREE.CylinderGeometry(0.128, 0.148, 0.155, 18), felt, head, [0, 0.165, 0]);
      crown.scale.set(1, 1, 0.94);
      put(ctx, new THREE.CylinderGeometry(0.152, 0.152, 0.032, 18), clothMaterial('#241f19'), head, [0, 0.105, 0], undefined, false);
      // 위가 눌린 자국
      put(ctx, new THREE.BoxGeometry(0.05, 0.05, 0.2), clothMaterial('#332c25'), head, [0, 0.235, 0], undefined, false);
      break;
    }
    case 'military-cap': {
      // 군모 — 낮은 원통에 챙과 모표
      const cloth = clothMaterial('#5e6344');
      // 모자통
      put(ctx, new THREE.CylinderGeometry(0.152, 0.163, 0.098, 22), cloth, head, [0, 0.108, 0]);
      put(ctx, new THREE.CylinderGeometry(0.168, 0.168, 0.02, 22), clothMaterial('#4b5036'), head, [0, 0.066, 0], undefined, false);
      // 챙 — 앞으로 길게 뻗어 나온 반달
      const visor = put(
        ctx,
        new THREE.CylinderGeometry(0.196, 0.196, 0.018, 22, 1, false, -1.0, 2.0),
        clothMaterial('#2b2721'),
        head,
        [0, 0.058, 0.026],
      );
      visor.rotation.x = -0.2;
      visor.scale.set(1, 1, 0.82);
      // 모표
      put(ctx, new THREE.CircleGeometry(0.03, 14), clothMaterial('#c2a355'), head, [0, 0.118, 0.172], undefined, false);
      break;
    }
    default:
      break;
  }
}

/* ───────────────────────── 팔·다리·손에 든 것 ───────────────────────── */

function makeArm(
  ctx: Ctx,
  parent: THREE.Object3D,
  app: Appearance,
  side: number,
): THREE.Group {
  const pivot = new THREE.Group();
  const wide = app.garment === 'durumagi' || app.garment === 'hanbok-woman' || app.garment === 'changshan';
  // 한복은 소매가 옆으로 벌어져 붙는다. 안쪽에 두면 옷에 묻혀 팔이 없는 것처럼 보인다.
  pivot.position.set(side * (wide ? 0.24 : 0.225), 1.1, 0);
  parent.add(pivot);

  if (wide) {
    // 한복 소매 — 아래로 갈수록 넓어지고 끝에 흰 끝동
    // 한복 소매 — 아래로 갈수록 넓어지고 끝에 흰 끝동을 댄다
    put(
      ctx,
      lathe([[0.005, 0.02], [0.085, 0.0], [0.108, -0.12], [0.128, -0.3], [0.138, -0.44], [0.005, -0.46]], 16),
      clothMaterial(app.coat),
      pivot,
    );
    put(ctx, new THREE.CylinderGeometry(0.1, 0.088, 0.055, 14), clothMaterial(app.trim), pivot, [0, -0.475, 0]);
  } else {
    put(ctx, new THREE.CylinderGeometry(0.072, 0.062, 0.46, 12), clothMaterial(app.coat), pivot, [0, -0.23, 0]);
    if (app.garment === 'uniform') {
      put(ctx, new THREE.CylinderGeometry(0.066, 0.064, 0.05, 12), clothMaterial(app.trim), pivot, [0, -0.44, 0], undefined, false);
    }
  }
  put(ctx, new THREE.SphereGeometry(0.054, 10, 8), skinMaterial(SKIN[app.age]), pivot, [0, -0.52, 0]);
  return pivot;
}

function makeLeg(ctx: Ctx, parent: THREE.Object3D, app: Appearance, side: number): THREE.Group {
  const pivot = new THREE.Group();
  pivot.position.set(side * 0.09, 0.52, 0);
  parent.add(pivot);

  const hidden = app.garment === 'durumagi' || app.garment === 'hanbok-woman' || app.garment === 'changshan';
  if (!hidden) {
    put(ctx, new THREE.CylinderGeometry(0.078, 0.068, 0.46, 10), clothMaterial(app.lower), pivot, [0, -0.23, 0]);
    if (app.garment === 'uniform') {
      // 각반 — 종아리에 감은 천
      put(ctx, new THREE.CylinderGeometry(0.072, 0.064, 0.2, 10), clothMaterial('#8d8462'), pivot, [0, -0.38, 0]);
      for (let i = 0; i < 3; i += 1) {
        put(ctx, new THREE.TorusGeometry(0.07 - i * 0.003, 0.006, 5, 12), clothMaterial('#7a7154'), pivot, [0, -0.32 - i * 0.055, 0], [Math.PI / 2, 0, 0], false);
      }
    }
  }
  // 신 — 한복은 흰 버선에 검은 신, 양복·군복은 구두
  if (hidden) {
    put(ctx, new THREE.SphereGeometry(0.058, 10, 8), clothMaterial('#f0ece0'), pivot, [0, -0.46, 0.01], undefined, false);
  }
  const shoe = put(ctx, new THREE.SphereGeometry(0.068, 12, 10), clothMaterial(app.garment === 'uniform' ? '#3a332a' : '#26211c'), pivot, [0, -0.5, 0.028]);
  shoe.scale.set(1, 0.6, 1.5);
  return pivot;
}

function addHandProp(ctx: Ctx, hand: THREE.Object3D, app: Appearance) {
  switch (app.holding) {
    case 'cane':
      put(ctx, new THREE.CylinderGeometry(0.018, 0.022, 0.9, 8), clothMaterial('#6b5741'), hand, [0, -0.44, 0.03]);
      put(ctx, new THREE.SphereGeometry(0.032, 8, 6), clothMaterial('#54452f'), hand, [0, 0.0, 0.03], undefined, false);
      break;
    case 'briefcase':
      put(ctx, new THREE.BoxGeometry(0.22, 0.26, 0.08), clothMaterial('#54402c'), hand, [0, -0.19, 0.02]);
      put(ctx, new THREE.TorusGeometry(0.035, 0.008, 5, 10), clothMaterial('#3e2f20'), hand, [0, -0.06, 0.02], [Math.PI / 2, 0, 0], false);
      break;
    case 'book':
      put(ctx, new THREE.BoxGeometry(0.15, 0.2, 0.04), clothMaterial('#6d4a3a'), hand, [0.02, -0.08, 0.05], [0.3, 0, 0.2]);
      put(ctx, new THREE.BoxGeometry(0.14, 0.19, 0.02), clothMaterial('#e8dfc8'), hand, [0.02, -0.085, 0.07], [0.3, 0, 0.2], false);
      break;
    case 'scroll':
      put(ctx, new THREE.CylinderGeometry(0.028, 0.028, 0.26, 10), clothMaterial('#e6dcc4'), hand, [0.02, -0.08, 0.05], [0.4, 0, 1.1]);
      break;
    default:
      break;
  }
}

/* ───────────────────────── 조립 ───────────────────────── */

export function createCharacter(figure: Figure, isPlayer = false): BuiltCharacter {
  const ctx: Ctx = { geometries: [] };
  const app = figure.appearance;
  const group = new THREE.Group();

  // 몸통 — 걸을 때 이 그룹이 살짝 튀고 기운다
  const body = new THREE.Group();
  group.add(body);

  let skirt: THREE.Object3D | null = null;
  switch (app.garment) {
    case 'durumagi':
      skirt = makeDurumagi(ctx, body, app);
      break;
    case 'hanbok-woman':
      skirt = makeHanbokWoman(ctx, body, app);
      break;
    case 'changshan':
      skirt = makeChangshan(ctx, body, app);
      break;
    case 'suit':
      makeSuit(ctx, body, app);
      break;
    case 'uniform':
      makeUniform(ctx, body, app);
      break;
    case 'student':
      makeStudent(ctx, body, app);
      break;
  }

  // 한복에만 있는 마감
  if (app.garment === 'durumagi') {
    addDongjeong(ctx, body, 1.17);
    addGoreum(ctx, body, shade(app.coat, -0.14), 1.17);
  } else if (app.garment === 'hanbok-woman') {
    addDongjeong(ctx, body, 1.16);
    addGoreum(ctx, body, '#8d3b4a', 1.14);
  }

  const head = addHead(ctx, body, app);
  const leftArm = makeArm(ctx, body, app, -1);
  const rightArm = makeArm(ctx, body, app, 1);
  addHandProp(ctx, rightArm, app);
  const leftLeg = makeLeg(ctx, group, app, -1);
  const rightLeg = makeLeg(ctx, group, app, 1);

  // 클릭 판정 — 몸통 전체를 덮는 보이지 않는 기둥
  const hitGeo = new THREE.CylinderGeometry(0.34, 0.4, 1.75, 8);
  ctx.geometries.push(hitGeo);
  const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false }));
  hitMesh.position.y = 0.87;
  group.add(hitMesh);

  let xray: THREE.Group | null = null;
  if (isPlayer) {
    // 벽 너머로 비치는 실루엣 — 평소에는 꺼 두고, 가려졌을 때만 켠다.
    xray = new THREE.Group();
    xray.visible = false;
    const xrayMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#ffd978'),
      transparent: true,
      opacity: 0.5,
      depthTest: false,
      depthWrite: false,
    });
    const silhouette = (geometry: THREE.BufferGeometry, y: number, scale = 1) => {
      const mesh = new THREE.Mesh(geometry, xrayMaterial);
      mesh.position.y = y;
      mesh.scale.setScalar(scale);
      mesh.renderOrder = 6;
      xray!.add(mesh);
      ctx.geometries.push(geometry);
    };
    silhouette(new THREE.CylinderGeometry(0.2, 0.3, 1.18, 12), 0.59);
    silhouette(new THREE.SphereGeometry(0.16, 12, 10), 1.38);
    group.add(xray);

    // 타일마다 높이가 조금씩 달라 바닥에 붙이면 묻힌다. depthTest 를 꺼서 늘 보이게 한다.
    const ringGeo = new THREE.RingGeometry(0.36, 0.5, 32);
    ctx.geometries.push(ringGeo);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffd978'),
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    ring.renderOrder = 4;
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.14;
    group.add(ring);
  }

  // 화면에서 사람이 주인공으로 읽히는 크기
  group.scale.setScalar(isPlayer ? 1.04 : 1.0);

  return {
    group,
    geometries: ctx.geometries,
    parts: { body, leftLeg, rightLeg, leftArm, rightArm, head, skirt },
    hitMesh,
    xray,
  };
}

/* ───────────────────────── 움직임 ───────────────────────── */

export function animateCharacter(character: BuiltCharacter, time: number, speed: number): void {
  const { body, leftLeg, rightLeg, leftArm, rightArm, head, skirt } = character.parts;
  if (speed > 0.01) {
    const phase = time * 8.2 * speed;
    const swing = Math.sin(phase) * 0.58 * Math.min(1, speed);
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;
    leftArm.rotation.x = -swing * 0.62;
    rightArm.rotation.x = swing * 0.62;
    body.position.y = Math.abs(Math.sin(phase)) * 0.038;
    body.rotation.z = Math.sin(phase) * 0.03;
    head.rotation.z = -Math.sin(phase) * 0.026;
    // 옷자락이 걸음에 따라 흔들린다
    if (skirt) skirt.rotation.z = Math.sin(phase) * 0.045;
  } else {
    const idle = Math.sin(time * 1.5) * 0.015;
    leftLeg.rotation.x *= 0.86;
    rightLeg.rotation.x *= 0.86;
    leftArm.rotation.x = idle;
    rightArm.rotation.x = -idle;
    body.position.y = idle * 0.5;
    body.rotation.z *= 0.86;
    head.rotation.y = Math.sin(time * 0.4) * 0.15;
    head.rotation.z *= 0.86;
    if (skirt) skirt.rotation.z *= 0.9;
  }
}

/**
 * 임무를 주는 사람 머리 위의 느낌표.
 * 중학생이 「어디로 가서 누구에게 말을 걸어야 하는지」 한눈에 알 수 있어야 한다.
 */
export function createQuestMarker(): { group: THREE.Group; geometries: THREE.BufferGeometry[] } {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const material = glowMaterial('#ffd24a');

  const bar = new THREE.CylinderGeometry(0.075, 0.045, 0.42, 8);
  geometries.push(bar);
  const barMesh = new THREE.Mesh(bar, material);
  barMesh.position.y = 0.26;
  group.add(barMesh);

  const dot = new THREE.SphereGeometry(0.068, 10, 8);
  geometries.push(dot);
  const dotMesh = new THREE.Mesh(dot, material);
  dotMesh.position.y = -0.02;
  group.add(dotMesh);

  const halo = new THREE.RingGeometry(0.22, 0.34, 22);
  geometries.push(halo);
  const haloMesh = new THREE.Mesh(halo, glowMaterial('#ffd24a', 0.18));
  haloMesh.position.y = 0.14;
  group.add(haloMesh);

  return { group, geometries };
}
