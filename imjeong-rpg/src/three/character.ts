import * as THREE from 'three';
import type { Figure } from '../types';
import { clothMaterial, glowMaterial, skinMaterial } from './materials';
import { texturedBox } from './geom';

/**
 * 인물 — 저폴리곤이지만 실루엣이 분명한 캐릭터.
 *
 * 1919~1945년 독립운동가의 차림을 단순화했다.
 *   · 두루마기 — 어깨가 좁고 아래가 퍼지는 긴 겉옷, 앞을 여민 고름
 *   · 양복 — 곧은 어깨와 각진 상의
 *   · 군복 — 허리띠와 각반, 챙 달린 군모
 *
 * ⚠ 실존 인물의 얼굴은 재현하지 않는다. 사진이 남지 않은 인물이 많고,
 *   남은 사진을 3D 로 흉내 내면 오히려 잘못된 인상을 준다. 옷차림과 색으로만 구분한다.
 */

export type OutfitShape = 'durumagi' | 'suit' | 'uniform';

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
  };
  hitMesh: THREE.Mesh;
}

const HAIR = '#241d18';

/** 색을 조금 어둡게/밝게 — 같은 옷이라도 부위마다 톤 차이를 준다 */
function shadeHex(hex: string, amount: number): string {
  const color = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return `#${color.getHexString()}`;
}

/** 옷 색과 모자로 차림새를 추정한다 — 데이터에 따로 적지 않아도 되게. */
function shapeOf(figure: Figure): OutfitShape {
  if (figure.track === 'military' && figure.outfit.hat) return 'uniform';
  // 밝은 옷(흰색 계열)은 두루마기, 짙은 옷은 양복으로 본다.
  const c = new THREE.Color(figure.outfit.coat);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return hsl.l > 0.66 ? 'durumagi' : 'suit';
}

export function createCharacter(figure: Figure, isPlayer = false): BuiltCharacter {
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const shape = shapeOf(figure);
  const coat = figure.outfit.coat;
  const trim = figure.outfit.trim;

  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    pos: [number, number, number] = [0, 0, 0],
    rot?: [number, number, number],
  ): THREE.Mesh => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const cloth = clothMaterial(coat);
  const trimMat = clothMaterial(trim);
  const skin = skinMaterial();

  /* ── 몸통 ── */
  const body = new THREE.Group();
  body.position.y = 0.56;
  group.add(body);

  if (shape === 'durumagi') {
    // 두루마기 — 어깨에서 밑단으로 갈수록 크게 퍼진다
    const torso = new THREE.CylinderGeometry(0.2, 0.31, 0.86, 10, 1);
    add(torso, cloth, body, [0, 0.02, 0]);
    // 밑단 — 살짝 도톰하게
    add(new THREE.CylinderGeometry(0.31, 0.335, 0.08, 10), clothMaterial(trim), body, [0, -0.42, 0]);
    // 어깨선 — 위쪽을 한 톤 어둡게 해서 원기둥이 납작해 보이지 않게 한다
    add(new THREE.CylinderGeometry(0.205, 0.235, 0.14, 10), clothMaterial(shadeHex(coat, -0.07)), body, [0, 0.38, 0]);
    // 앞섶 — 세로로 한 줄
    add(texturedBox(0.035, 0.7, 0.02, 4), clothMaterial(shadeHex(coat, -0.12)), body, [0, 0.02, 0.21]);
    // 고름 — 가슴 앞에 맨 끈
    add(texturedBox(0.07, 0.34, 0.03, 3), trimMat, body, [0.07, 0.16, 0.19]);
    add(texturedBox(0.16, 0.06, 0.03, 3), trimMat, body, [0.02, 0.3, 0.2], [0, 0, -0.5]);
  } else if (shape === 'suit') {
    // 양복 — 각진 어깨, 허리가 들어간 상의
    add(texturedBox(0.42, 0.56, 0.26, 2), cloth, body, [0, 0.18, 0]);
    add(new THREE.CylinderGeometry(0.19, 0.22, 0.42, 8), clothMaterial(trim), body, [0, -0.26, 0]);
    // 셔츠 깃과 넥타이
    add(texturedBox(0.14, 0.2, 0.05, 4), clothMaterial('#f0ece2'), body, [0, 0.36, 0.14]);
    add(texturedBox(0.05, 0.26, 0.03, 4), clothMaterial('#6d2f2c'), body, [0, 0.28, 0.17]);
    // 옷깃
    for (const sx of [-1, 1]) {
      add(texturedBox(0.1, 0.24, 0.04, 4), cloth, body, [sx * 0.1, 0.34, 0.14], [0, 0, sx * 0.24]);
    }
  } else {
    // 군복 — 상의 + 허리띠 + 각반
    add(texturedBox(0.42, 0.6, 0.27, 2), cloth, body, [0, 0.16, 0]);
    add(new THREE.CylinderGeometry(0.235, 0.235, 0.1, 10), clothMaterial('#3a3128'), body, [0, -0.14, 0]);
    add(texturedBox(0.1, 0.1, 0.05, 4), clothMaterial('#8a7a4a'), body, [0, -0.14, 0.15]);
    // 가슴 주머니
    for (const sx of [-1, 1]) {
      add(texturedBox(0.13, 0.12, 0.03, 4), clothMaterial(trim), body, [sx * 0.11, 0.26, 0.15]);
    }
  }

  // 옷깃 / 목
  add(new THREE.CylinderGeometry(0.1, 0.11, 0.12, 8), skin, body, [0, 0.5, 0]);
  if (shape === 'durumagi') {
    add(new THREE.CylinderGeometry(0.17, 0.18, 0.1, 10), trimMat, body, [0, 0.47, 0]);
  }

  /* ── 머리 ── */
  const head = new THREE.Group();
  head.position.y = 0.72;
  body.add(head);
  // 머리를 몸에 비해 조금 크게 잡는다. 이 축척에서는 그래야 사람으로 읽히고,
  // 중학생이 보기에도 캐릭터답게 친근하다.
  const skull = add(new THREE.SphereGeometry(0.2, 14, 12), skin, head);
  skull.scale.set(0.95, 1.04, 0.97);
  // 머리카락
  const hair = add(
    new THREE.SphereGeometry(0.209, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    clothMaterial(HAIR),
    head,
    [0, 0.014, 0],
  );
  hair.scale.set(0.98, 1.04, 1.0);
  // 뒷머리
  add(new THREE.SphereGeometry(0.12, 10, 8), clothMaterial(HAIR), head, [0, -0.02, -0.13]);

  // 얼굴 — 눈만 찍는다. 이목구비를 자세히 만들면 특정 인물의 초상처럼 보이므로,
  // 「사람이 서 있다」는 느낌만 주는 선에서 멈춘다.
  const eye = clothMaterial('#2a2420');
  for (const sx of [-1, 1]) {
    const e = add(new THREE.SphereGeometry(0.027, 7, 6), eye, head, [sx * 0.068, 0.004, 0.178]);
    e.scale.set(1, 1.3, 0.55);
    e.castShadow = false;
  }
  // 눈썹
  for (const sx of [-1, 1]) {
    const brow = add(texturedBox(0.062, 0.015, 0.02, 4), eye, head, [sx * 0.068, 0.064, 0.176]);
    brow.rotation.z = sx * 0.12;
    brow.castShadow = false;
  }

  /* ── 모자 ── */
  if (figure.outfit.hat) {
    const hatColor = figure.outfit.hat;
    if (shape === 'uniform') {
      // 군모 — 낮은 원통에 챙
      add(new THREE.CylinderGeometry(0.205, 0.215, 0.14, 14), clothMaterial(hatColor), head, [0, 0.16, 0]);
      add(texturedBox(0.34, 0.032, 0.2, 4), clothMaterial('#2c2721'), head, [0, 0.1, 0.17]);
      add(new THREE.CylinderGeometry(0.222, 0.222, 0.022, 14), clothMaterial('#2c2721'), head, [0, 0.095, 0]);
    } else if (shape === 'suit') {
      // 중절모 — 챙이 둥글고 위가 눌린 모자
      add(new THREE.CylinderGeometry(0.35, 0.36, 0.026, 18), clothMaterial(hatColor), head, [0, 0.12, 0]);
      add(new THREE.CylinderGeometry(0.182, 0.198, 0.18, 14), clothMaterial(hatColor), head, [0, 0.22, 0]);
      add(new THREE.CylinderGeometry(0.19, 0.2, 0.036, 14), clothMaterial('#2f2a24'), head, [0, 0.148, 0]);
    } else {
      // 갓 — 넓고 평평한 챙에 원통 모자
      add(new THREE.CylinderGeometry(0.42, 0.43, 0.02, 20), clothMaterial(hatColor), head, [0, 0.14, 0]);
      add(new THREE.CylinderGeometry(0.145, 0.16, 0.22, 14), clothMaterial(hatColor), head, [0, 0.26, 0]);
      // 갓끈
      for (const sx of [-1, 1]) {
        add(texturedBox(0.022, 0.24, 0.022, 4), clothMaterial('#2f2a24'), head, [sx * 0.16, 0.02, 0.08]);
      }
    }
  }

  /* ── 팔 ── */
  const makeArm = (side: number) => {
    const pivot = new THREE.Group();
    // 두루마기는 아래가 퍼져 있어 팔을 몸통 안에 두면 묻혀 버린다. 바깥으로 뺀다.
    pivot.position.set(side * (shape === 'durumagi' ? 0.27 : 0.26), 0.4, 0);
    body.add(pivot);
    if (shape === 'durumagi') {
      // 소매가 넓다
      // 소매 — 몸통보다 살짝 어둡게 해서 경계가 보이게 한다
      add(new THREE.CylinderGeometry(0.105, 0.15, 0.46, 8), clothMaterial(shadeHex(coat, -0.06)), pivot, [0, -0.23, 0]);
      add(new THREE.CylinderGeometry(0.15, 0.125, 0.1, 8), trimMat, pivot, [0, -0.47, 0]);
    } else {
      add(texturedBox(0.13, 0.46, 0.14, 3), clothMaterial(shadeHex(coat, -0.07)), pivot, [0, -0.23, 0]);
      if (shape === 'uniform') {
        add(texturedBox(0.125, 0.06, 0.135, 4), clothMaterial(trim), pivot, [0, -0.44, 0]);
      }
    }
    add(new THREE.SphereGeometry(0.072, 9, 7), skin, pivot, [0, -0.53, 0]);
    return pivot;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);

  /* ── 다리 ── */
  const makeLeg = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.1, 0.56, 0);
    group.add(pivot);
    const trouser = shape === 'durumagi' ? '#e2dccd' : coat;
    add(texturedBox(0.13, 0.5, 0.14, 3), clothMaterial(trouser), pivot, [0, -0.26, 0]);
    if (shape === 'uniform') {
      // 각반 — 종아리에 감은 천
      add(new THREE.CylinderGeometry(0.085, 0.078, 0.22, 8), clothMaterial('#8a7f5e'), pivot, [0, -0.41, 0]);
    }
    // 신
    add(texturedBox(0.15, 0.09, 0.23, 4), clothMaterial('#2b2521'), pivot, [0, -0.54, 0.035]);
    return pivot;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);

  /* ── 플레이어 표식 ── */
  if (isPlayer) {
    // 타일 높이가 조금씩 달라 바닥에 붙이면 묻힌다. depthTest 를 꺼서 늘 보이게 한다.
    const ringGeo = new THREE.RingGeometry(0.34, 0.46, 28);
    geometries.push(ringGeo);
    const ring = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#ffd978'),
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthTest: false,
      }),
    );
    ring.renderOrder = 4;
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.14;
    group.add(ring);

    const innerGeo = new THREE.RingGeometry(0.06, 0.12, 20);
    geometries.push(innerGeo);
    const inner = new THREE.Mesh(innerGeo, glowMaterial('#ffe9b0', 0.5));
    inner.renderOrder = 4;
    inner.rotation.x = -Math.PI / 2;
    inner.position.y = 0.14;
    (inner.material as THREE.Material).depthTest = false;
    group.add(inner);
  }

  // 건물에 견주어 사람이 너무 작으면 화면의 주인공이 사라진다.
  group.scale.setScalar(isPlayer ? 1.32 : 1.24);

  return {
    group,
    geometries,
    parts: { body, leftLeg, rightLeg, leftArm, rightArm, head },
    hitMesh: skull,
  };
}

/**
 * 걷기·서 있기 애니메이션.
 * @param speed 0 이면 정지, 1 이면 보통 걸음
 */
export function animateCharacter(character: BuiltCharacter, time: number, speed: number): void {
  const { body, leftLeg, rightLeg, leftArm, rightArm, head } = character.parts;
  if (speed > 0.01) {
    const phase = time * 8.6 * speed;
    const swing = Math.sin(phase) * 0.62 * Math.min(1, speed);
    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;
    leftArm.rotation.x = -swing * 0.72;
    rightArm.rotation.x = swing * 0.72;
    // 걸을 때 몸이 위아래로 튀고 좌우로 살짝 기운다
    body.position.y = 0.56 + Math.abs(Math.sin(phase)) * 0.04;
    body.rotation.z = Math.sin(phase) * 0.035;
    head.rotation.z = -Math.sin(phase) * 0.03;
  } else {
    // 서 있을 때는 숨 쉬듯 아주 천천히
    const idle = Math.sin(time * 1.5) * 0.016;
    leftLeg.rotation.x *= 0.86;
    rightLeg.rotation.x *= 0.86;
    leftArm.rotation.x = idle;
    rightArm.rotation.x = -idle;
    body.position.y = 0.56 + idle * 0.6;
    body.rotation.z *= 0.86;
    head.rotation.y = Math.sin(time * 0.42) * 0.16;
    head.rotation.z *= 0.86;
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

  const bar = new THREE.CylinderGeometry(0.075, 0.045, 0.42, 7);
  geometries.push(bar);
  const barMesh = new THREE.Mesh(bar, material);
  barMesh.position.y = 0.26;
  group.add(barMesh);

  const dot = new THREE.SphereGeometry(0.068, 9, 7);
  geometries.push(dot);
  const dotMesh = new THREE.Mesh(dot, material);
  dotMesh.position.y = -0.02;
  group.add(dotMesh);

  // 뒤에 은은한 후광
  const halo = new THREE.RingGeometry(0.22, 0.34, 20);
  geometries.push(halo);
  const haloMesh = new THREE.Mesh(halo, glowMaterial('#ffd24a', 0.18));
  haloMesh.position.y = 0.14;
  group.add(haloMesh);

  return { group, geometries };
}
