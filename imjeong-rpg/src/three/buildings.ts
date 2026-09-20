import * as THREE from 'three';
import type { BuildingSpec, BuildingStyle } from '../types';
import { buildMaterials, glowMaterial } from './materials';
import { scaleUV, texturedBox } from './geom';

/**
 * 절차적 건물.
 *
 * 목표는 「3D 상자를 세워 둔 화면」이 아니라 『거상』처럼 **한 채 한 채가
 * 그림 같은 건물**을 만드는 것이다. 그래서 다음을 반드시 넣는다.
 *   1) 기와 이랑이 보이는 지붕 (동아시아 건축의 인상은 거의 지붕에서 온다)
 *   2) 처마 — 벽보다 튀어나와 그림자를 떨어뜨린다
 *   3) 용마루와 그 끝의 마감
 *   4) 창틀이 있는 창, 문틀이 있는 문, 기단
 *   5) 재질감 (벽돌·회벽·나무결·석재)
 *
 * ⚠ 형태는 그 지역 건축의 **인상**을 재현한 것이지 특정 실물의 복원이 아니다.
 */

const TILE = 1;
const FLOOR_H = 1.2;

export interface BuiltBuilding {
  group: THREE.Group;
  textures: THREE.Texture[];
  geometries: THREE.BufferGeometry[];
  /** 건물 이름표를 띄울 높이 (지붕 위) */
  labelHeight: number;
  /** 밤에 켜지는 창 — 등불 연출에 쓴다 */
  litWindows: THREE.Object3D[];
}

interface Ctx {
  group: THREE.Group;
  geometries: THREE.BufferGeometry[];
  litWindows: THREE.Object3D[];
  w: number;
  d: number;
  floors: number;
  bodyH: number;
  wall: string;
  roof: string;
}

/* ───────────────────────── 공통 부재 ───────────────────────── */

function add(
  ctx: Ctx,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  pos: [number, number, number],
  rot?: [number, number, number],
): THREE.Mesh {
  ctx.geometries.push(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(pos[0], pos[1], pos[2]);
  if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  ctx.group.add(mesh);
  return mesh;
}

function box(
  ctx: Ctx,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  pos: [number, number, number],
  rot?: [number, number, number],
  density = 0.55,
): THREE.Mesh {
  return add(ctx, texturedBox(w, h, d, density), material, pos, rot);
}

/**
 * 기와를 얹은 맞배지붕.
 *
 * 두 장의 경사판 + 용마루 + 처마널 + 박공벽으로 이루어진다.
 * `flare` 를 주면 처마 끝이 살짝 들려 동아시아 지붕의 곡선을 흉내 낸다.
 */
function gableRoof(
  ctx: Ctx,
  baseY: number,
  overhang: number,
  pitch: number,
  opts: { flare?: boolean; ridgeCap?: boolean } = {},
): number {
  const { w, d, roof, wall } = ctx;
  const roofMat = buildMaterials.roof(roof);
  const rw = w + overhang * 2;
  const rd = d + overhang * 2;
  const slope = Math.sqrt((rd / 2) ** 2 + pitch ** 2);
  const angle = Math.atan2(pitch, rd / 2);

  for (const sign of [1, -1]) {
    // 경사판 — 두께를 주어 옆에서 보면 기와가 겹친 단면이 보인다.
    const geometry = new THREE.BoxGeometry(rw, 0.13, slope);
    // 지붕은 기와 이랑이 경사 방향(v)으로 흐르게 UV 를 깐다.
    scaleUV(geometry, rw * 0.42, slope * 0.75);
    const mesh = new THREE.Mesh(geometry, roofMat);
    mesh.position.set(0, baseY + pitch / 2, (sign * rd) / 4);
    mesh.rotation.x = sign * -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ctx.group.add(mesh);
    ctx.geometries.push(geometry);

    // 처마널 — 경사판 끝에 덧대는 가로 판. 그림자 선이 생겨 지붕이 또렷해진다.
    const eaveGeo = texturedBox(rw + 0.06, 0.12, 0.16, 0.9);
    const eave = new THREE.Mesh(eaveGeo, buildMaterials.darkWood());
    eave.position.set(0, baseY - Math.tan(angle) * 0 - 0.02, (sign * rd) / 2);
    eave.castShadow = true;
    ctx.group.add(eave);
    ctx.geometries.push(eaveGeo);

    // 처마 끝 들림 — 양쪽 모서리에 짧은 판을 살짝 위로 꺾어 붙인다.
    if (opts.flare) {
      for (const sx of [-1, 1]) {
        const flareGeo = new THREE.BoxGeometry(rw * 0.22, 0.11, 0.5);
        scaleUV(flareGeo, rw * 0.1, 0.4);
        const flare = new THREE.Mesh(flareGeo, roofMat);
        flare.position.set((sx * rw) / 2 - (sx * rw * 0.11), baseY + 0.07, (sign * rd) / 2 - sign * 0.16);
        flare.rotation.x = sign * -angle * 0.35;
        flare.rotation.z = -sx * 0.16;
        flare.castShadow = true;
        ctx.group.add(flare);
        ctx.geometries.push(flareGeo);
      }
    }
  }

  // 용마루 — 지붕의 등뼈. 기와를 세워 쌓은 두툼한 띠.
  const ridgeGeo = texturedBox(rw + 0.1, 0.2, 0.26, 1.1);
  add(ctx, ridgeGeo, roofMat, [0, baseY + pitch + 0.06, 0]);
  const ridgeTopGeo = texturedBox(rw + 0.16, 0.08, 0.34, 1.1);
  add(ctx, ridgeTopGeo, buildMaterials.stoneTrim('#3a3f44'), [0, baseY + pitch + 0.18, 0]);

  // 용마루 끝 마감 (치미 자리) — 작은 덩어리 하나로 실루엣만 준다.
  if (opts.ridgeCap) {
    for (const sx of [-1, 1]) {
      const capGeo = new THREE.ConeGeometry(0.16, 0.34, 4);
      add(ctx, capGeo, buildMaterials.stoneTrim('#34383d'), [
        (sx * (rw + 0.16)) / 2,
        baseY + pitch + 0.3,
        0,
      ], [0, Math.PI / 4, 0]);
    }
  }

  // 박공벽 — 양 옆의 삼각 벽
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-rd / 2, 0);
  gableShape.lineTo(rd / 2, 0);
  gableShape.lineTo(0, pitch);
  gableShape.closePath();
  const gableGeo = new THREE.ShapeGeometry(gableShape);
  scaleUV(gableGeo, rd * 0.4, pitch * 0.5);
  for (const sign of [1, -1]) {
    const mesh = new THREE.Mesh(gableGeo, buildMaterials.plaster(wall));
    mesh.position.set((sign * w) / 2, baseY, 0);
    mesh.rotation.y = (sign * Math.PI) / 2;
    mesh.receiveShadow = true;
    ctx.group.add(mesh);
  }
  ctx.geometries.push(gableGeo);

  return baseY + pitch + 0.34;
}

/** 창 — 틀 + 어두운 유리(또는 불 켜진 창) */
function window_(
  ctx: Ctx,
  x: number,
  y: number,
  z: number,
  w = 0.46,
  h = 0.58,
  lit = false,
  frame = '#3f3529',
) {
  box(ctx, w + 0.12, h + 0.12, 0.08, buildMaterials.stoneTrim(frame), [x, y, z], undefined, 1.2);
  const glass = add(
    ctx,
    new THREE.PlaneGeometry(w, h),
    lit ? buildMaterials.windowLit() : buildMaterials.window(),
    [x, y, z + 0.05],
  );
  glass.castShadow = false;
  if (lit) ctx.litWindows.push(glass);
  // 창살
  box(ctx, w, 0.035, 0.03, buildMaterials.stoneTrim(frame), [x, y, z + 0.07], undefined, 1.4);
  box(ctx, 0.035, h, 0.03, buildMaterials.stoneTrim(frame), [x, y, z + 0.07], undefined, 1.4);
}

/** 문 — 틀 + 문짝 + 계단 */
function door(ctx: Ctx, z: number, w = 0.92, h = 1.42, frameColor = '#8b8479') {
  box(ctx, w + 0.3, h + 0.2, 0.14, buildMaterials.stoneTrim(frameColor), [0, (h + 0.2) / 2, z], undefined, 0.9);
  box(ctx, w, h, 0.09, buildMaterials.darkWood(), [0, h / 2, z + 0.08], undefined, 1.4);
  // 문고리
  add(ctx, new THREE.SphereGeometry(0.045, 8, 6), buildMaterials.metal(), [w * 0.28, h * 0.5, z + 0.14]);
  add(ctx, new THREE.SphereGeometry(0.045, 8, 6), buildMaterials.metal(), [-w * 0.28, h * 0.5, z + 0.14]);
  // 섬돌
  box(ctx, w + 0.6, 0.12, 0.5, buildMaterials.stoneTrim('#9c968a'), [0, 0.06, z + 0.3], undefined, 0.8);
}

/** 창을 한 층에 가로로 늘어놓는다 */
function windowRow(ctx: Ctx, y: number, z: number, lit = false, w = 0.46, h = 0.58) {
  const count = Math.max(1, Math.round(ctx.w / 1.5));
  for (let i = 0; i < count; i += 1) {
    const x = -ctx.w / 2 + (ctx.w / count) * (i + 0.5);
    // 가운데 칸은 문이 있는 1층에서 건너뛴다
    window_(ctx, x, y, z, w, h, lit && (i + Math.round(y)) % 3 !== 0);
  }
}

/* ───────────────────────── 양식별 ───────────────────────── */

function buildShikumen(ctx: Ctx): number {
  const { w, d, bodyH, wall, floors } = ctx;
  // 회색 벽돌 몸통
  box(ctx, w, bodyH, d, buildMaterials.brick(wall), [0, bodyH / 2, 0], undefined, 0.9);
  // 기단
  box(ctx, w + 0.14, 0.2, d + 0.14, buildMaterials.stoneTrim('#8d8780'), [0, 0.1, 0], undefined, 0.8);
  // 층 사이 돌림띠
  for (let f = 1; f < floors; f += 1) {
    box(ctx, w + 0.1, 0.1, d + 0.1, buildMaterials.stoneTrim('#a39c92'), [0, FLOOR_H * f, 0], undefined, 0.9);
  }
  for (let f = 0; f < floors; f += 1) {
    const y = FLOOR_H * f + FLOOR_H * 0.62;
    if (f === 0) {
      // 1층은 문 양옆에만 창
      const side = Math.max(w / 2 - 0.9, 0.5);
      window_(ctx, -side, y, d / 2 + 0.02, 0.44, 0.56, true);
      window_(ctx, side, y, d / 2 + 0.02, 0.44, 0.56, false);
    } else {
      windowRow(ctx, y, d / 2 + 0.02, true);
    }
  }
  // 석고문(石庫門) — 돌로 테를 두른 문. 이 양식의 이름이 여기서 왔다.
  box(ctx, 1.6, 2.0, 0.2, buildMaterials.ashlar('#b3ada2'), [0, 1.0, d / 2 + 0.06], undefined, 0.7);
  box(ctx, 1.9, 0.22, 0.3, buildMaterials.ashlar('#c0b9ad'), [0, 2.05, d / 2 + 0.06], undefined, 0.8);
  door(ctx, d / 2 + 0.14, 0.9, 1.45, '#6f6a61');
  return gableRoof(ctx, bodyH, 0.26, 0.5, { ridgeCap: true });
}

function buildWestern(ctx: Ctx): number {
  const { w, d, bodyH, wall, floors } = ctx;
  box(ctx, w, bodyH, d, buildMaterials.ashlar(wall), [0, bodyH / 2, 0], undefined, 0.55);
  // 기단 (계단식)
  box(ctx, w + 0.4, 0.18, d + 0.4, buildMaterials.stoneTrim('#b0aaa0'), [0, 0.09, 0], undefined, 0.6);
  box(ctx, w + 0.24, 0.16, d + 0.24, buildMaterials.stoneTrim('#bdb7ad'), [0, 0.26, 0], undefined, 0.6);

  // 기둥 — 정면에 늘어선 원기둥과 주두
  const pillars = Math.max(2, Math.min(6, Math.round(w / 1.4)));
  for (let i = 0; i < pillars; i += 1) {
    const x = -w / 2 + 0.4 + ((w - 0.8) / (pillars - 1 || 1)) * i;
    const shaft = new THREE.CylinderGeometry(0.15, 0.17, bodyH * 0.8, 12);
    scaleUV(shaft, 1, bodyH * 0.5);
    add(ctx, shaft, buildMaterials.ashlar('#d2ccc1'), [x, bodyH * 0.4 + 0.34, d / 2 + 0.2]);
    box(ctx, 0.42, 0.1, 0.42, buildMaterials.stoneTrim('#c8c2b7'), [x, bodyH * 0.8 + 0.36, d / 2 + 0.2], undefined, 1);
    box(ctx, 0.38, 0.08, 0.38, buildMaterials.stoneTrim('#c8c2b7'), [x, 0.38, d / 2 + 0.2], undefined, 1);
  }
  // 층마다 창
  for (let f = 0; f < floors; f += 1) {
    windowRow(ctx, FLOOR_H * f + FLOOR_H * 0.66 + 0.34, d / 2 + 0.02, f > 0, 0.5, 0.72);
    if (f > 0) box(ctx, w + 0.08, 0.09, d + 0.08, buildMaterials.stoneTrim('#c4beb3'), [0, FLOOR_H * f + 0.34, 0], undefined, 0.8);
  }
  // 코니스와 평지붕, 그리고 정면 박공(페디먼트)
  box(ctx, w + 0.34, 0.2, d + 0.34, buildMaterials.stoneTrim('#c8c2b7'), [0, bodyH + 0.1, 0], undefined, 0.7);
  box(ctx, w + 0.18, 0.16, d + 0.18, buildMaterials.ashlar(ctx.roof), [0, bodyH + 0.28, 0], undefined, 0.7);
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-w * 0.32, 0);
  pedShape.lineTo(w * 0.32, 0);
  pedShape.lineTo(0, 0.5);
  pedShape.closePath();
  const ped = new THREE.ExtrudeGeometry(pedShape, { depth: 0.24, bevelEnabled: false });
  add(ctx, ped, buildMaterials.stoneTrim('#cdc7bc'), [0, bodyH + 0.2, d / 2 + 0.08]);
  // 난간 기둥
  for (let i = 0; i <= 6; i += 1) {
    const x = -w / 2 + (w / 6) * i;
    box(ctx, 0.1, 0.24, 0.1, buildMaterials.stoneTrim('#c8c2b7'), [x, bodyH + 0.46, d / 2 + 0.12], undefined, 1.4);
  }
  door(ctx, d / 2 + 0.06, 1.0, 1.6, '#b3ada2');
  return bodyH + 0.8;
}

function buildChinese(ctx: Ctx): number {
  const { w, d, bodyH, wall } = ctx;
  box(ctx, w + 0.24, 0.26, d + 0.24, buildMaterials.stoneTrim('#9a9488'), [0, 0.13, 0], undefined, 0.7);
  box(ctx, w, bodyH, d, buildMaterials.plaster(wall), [0, bodyH / 2 + 0.26, 0], undefined, 0.6);
  // 나무 기둥과 인방
  const posts = Math.max(2, Math.round(w / 1.5));
  for (let i = 0; i <= posts; i += 1) {
    const x = -w / 2 + (w / posts) * i;
    box(ctx, 0.13, bodyH, 0.13, buildMaterials.wood('#6b5741'), [x, bodyH / 2 + 0.26, d / 2 + 0.03], undefined, 1.6);
  }
  box(ctx, w + 0.12, 0.16, 0.18, buildMaterials.wood('#6b5741'), [0, bodyH + 0.18, d / 2 + 0.03], undefined, 1.2);
  // 격자 창
  const side = Math.max(w / 2 - 0.85, 0.55);
  window_(ctx, -side, bodyH * 0.6 + 0.26, d / 2 + 0.05, 0.6, 0.6, true, '#6b5741');
  window_(ctx, side, bodyH * 0.6 + 0.26, d / 2 + 0.05, 0.6, 0.6, true, '#6b5741');
  door(ctx, d / 2 + 0.05, 0.96, 1.5, '#6b5741');
  return gableRoof(ctx, bodyH + 0.26, 0.5, 0.56, { flare: true, ridgeCap: true });
}

function buildHanok(ctx: Ctx): number {
  const { w, d, bodyH, wall } = ctx;
  // 높은 기단
  box(ctx, w + 0.5, 0.36, d + 0.5, buildMaterials.stoneTrim('#a29a8c'), [0, 0.18, 0], undefined, 0.6);
  box(ctx, w, bodyH, d, buildMaterials.plaster(wall), [0, bodyH / 2 + 0.36, 0], undefined, 0.6);
  // 기둥
  for (let i = 0; i <= Math.max(2, Math.round(w / 1.3)); i += 1) {
    const n = Math.max(2, Math.round(w / 1.3));
    const x = -w / 2 + (w / n) * i;
    box(ctx, 0.15, bodyH, 0.15, buildMaterials.wood('#7a6144'), [x, bodyH / 2 + 0.36, d / 2], undefined, 1.6);
  }
  // 창호지 문 — 밤에 은은히 빛난다
  const bays = Math.max(2, Math.round(w / 1.3));
  for (let i = 0; i < bays; i += 1) {
    const x = -w / 2 + (w / bays) * (i + 0.5);
    window_(ctx, x, bodyH * 0.55 + 0.36, d / 2 + 0.04, w / bays - 0.28, bodyH * 0.72, true, '#7a6144');
  }
  box(ctx, w + 0.2, 0.18, 0.2, buildMaterials.wood('#6b5741'), [0, bodyH + 0.3, d / 2], undefined, 1.2);
  return gableRoof(ctx, bodyH + 0.36, 0.62, 0.62, { flare: true, ridgeCap: true });
}

function buildChongqing(ctx: Ctx): number {
  const { w, d, bodyH, wall, floors } = ctx;
  // 1층은 돌, 위층은 나무 — 산비탈 도시의 전형
  box(ctx, w, FLOOR_H, d, buildMaterials.brick(wall), [0, FLOOR_H / 2, 0], undefined, 0.8);
  if (floors > 1) {
    const upperH = FLOOR_H * (floors - 1);
    box(ctx, w + 0.2, upperH, d + 0.2, buildMaterials.wood('#8c7454'), [0, FLOOR_H + upperH / 2, 0], undefined, 0.7);
    // 2층 난간과 툇마루
    box(ctx, w + 0.5, 0.1, 0.56, buildMaterials.wood('#6b5741'), [0, FLOOR_H + 0.02, d / 2 + 0.28], undefined, 1);
    box(ctx, w + 0.5, 0.09, 0.09, buildMaterials.wood('#6b5741'), [0, FLOOR_H + 0.52, d / 2 + 0.52], undefined, 1.4);
    const rails = Math.max(3, Math.round(w * 1.4));
    for (let i = 0; i <= rails; i += 1) {
      const x = -(w + 0.5) / 2 + ((w + 0.5) / rails) * i;
      box(ctx, 0.05, 0.5, 0.05, buildMaterials.wood('#6b5741'), [x, FLOOR_H + 0.27, d / 2 + 0.52], undefined, 2);
    }
    // 처마를 받치는 기둥
    for (const sx of [-1, 1]) {
      box(ctx, 0.11, FLOOR_H * floors, 0.11, buildMaterials.wood('#6b5741'), [
        (sx * (w + 0.4)) / 2,
        (FLOOR_H * floors) / 2,
        d / 2 + 0.5,
      ], undefined, 1.6);
    }
    windowRow(ctx, FLOOR_H * floors - 0.48, d / 2 + 0.12, true, 0.44, 0.56);
  }
  window_(ctx, Math.max(w / 2 - 0.9, 0.6), FLOOR_H * 0.6, d / 2 + 0.02, 0.44, 0.54, true);
  window_(ctx, -Math.max(w / 2 - 0.9, 0.6), FLOOR_H * 0.6, d / 2 + 0.02, 0.44, 0.54, false);
  door(ctx, d / 2 + 0.02, 0.9, 1.42, '#6f6a61');
  return gableRoof(ctx, bodyH, 0.52, 0.5, { flare: true, ridgeCap: true });
}

function buildBarracks(ctx: Ctx): number {
  const { w, d, wall } = ctx;
  const h = ctx.bodyH * 0.8;
  box(ctx, w + 0.2, 0.16, d + 0.2, buildMaterials.stoneTrim('#8e897e'), [0, 0.08, 0], undefined, 0.7);
  box(ctx, w, h, d, buildMaterials.wood(wall), [0, h / 2 + 0.16, 0], undefined, 0.7);
  // 가로 널을 강조하는 띠
  for (let i = 1; i < 3; i += 1) {
    box(ctx, w + 0.04, 0.05, d + 0.04, buildMaterials.stoneTrim('#6a675c'), [0, 0.16 + (h / 3) * i, 0], undefined, 1);
  }
  const count = Math.max(2, Math.round(w));
  for (let i = 0; i < count; i += 1) {
    const x = -w / 2 + (w / count) * (i + 0.5);
    window_(ctx, x, h * 0.62 + 0.16, d / 2 + 0.02, 0.34, 0.4, i % 2 === 0, '#4d4a40');
  }
  door(ctx, d / 2 + 0.02, 0.8, 1.3, '#57534a');
  return gableRoof(ctx, h + 0.16, 0.22, 0.3, {});
}

function buildTent(ctx: Ctx): number {
  const { w, d, wall, roof } = ctx;
  const pitch = 1.0;
  const slope = Math.sqrt((d / 2) ** 2 + pitch ** 2);
  const angle = Math.atan2(pitch, d / 2);
  for (const sign of [1, -1]) {
    const geometry = new THREE.BoxGeometry(w, 0.06, slope);
    scaleUV(geometry, w, slope);
    const mesh = new THREE.Mesh(geometry, buildMaterials.cloth(wall));
    mesh.position.set(0, pitch / 2, (sign * d) / 4);
    mesh.rotation.x = sign * -angle;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ctx.group.add(mesh);
    ctx.geometries.push(geometry);
    // 천막 자락의 주름
    for (let i = 1; i < 4; i += 1) {
      const x = -w / 2 + (w / 4) * i;
      box(ctx, 0.05, 0.05, slope, buildMaterials.cloth('#b4ad98'), [x, pitch / 2 + 0.04, (sign * d) / 4], [sign * -angle, 0, 0], 1);
    }
  }
  box(ctx, w + 0.12, 0.1, 0.12, buildMaterials.stoneTrim(roof), [0, pitch, 0], undefined, 1.2);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      box(ctx, 0.08, pitch, 0.08, buildMaterials.wood('#6b5741'), [(sx * w) / 2, pitch / 2, (sz * d) / 2], undefined, 2);
      // 버팀줄
      const rope = new THREE.CylinderGeometry(0.014, 0.014, 0.9, 5);
      add(ctx, rope, buildMaterials.stoneTrim('#8a7f68'), [
        (sx * (w / 2 + 0.28)),
        0.34,
        (sz * (d / 2 + 0.28)),
      ], [sz * 0.6, 0, -sx * 0.6]);
    }
  }
  return pitch + 0.5;
}

const BUILDERS: Record<BuildingStyle, (ctx: Ctx) => number> = {
  shikumen: buildShikumen,
  western: buildWestern,
  chinese: buildChinese,
  hanok: buildHanok,
  chongqing: buildChongqing,
  barracks: buildBarracks,
  tent: buildTent,
};

/* ───────────────────────── 진입점 ───────────────────────── */

export function createBuilding(spec: BuildingSpec): BuiltBuilding {
  const group = new THREE.Group();
  const w = spec.w * TILE;
  const d = spec.d * TILE;
  const floors = Math.max(1, spec.floors);

  const ctx: Ctx = {
    group,
    geometries: [],
    litWindows: [],
    w,
    d,
    floors,
    bodyH: FLOOR_H * floors,
    wall: spec.wall ?? '#d9d2c2',
    roof: spec.roof ?? '#4a5058',
  };

  group.position.set(spec.x + w / 2, 0, spec.z + d / 2);
  const top = BUILDERS[spec.style](ctx);

  /**
   * 단청 — 처마 밑 목재에 칠한 색 띠.
   * 첨부한 『거상』 화면의 기와집이 화려해 보이는 큰 이유가 이 색 띠다.
   * 동아시아 목조 건축에만 넣는다 (서양식 관청·막사·천막에는 없다).
   */
  if (spec.style === 'chinese' || spec.style === 'hanok' || spec.style === 'chongqing') {
    const beamY = FLOOR_H * floors + 0.04;
    const dancheong: Array<[string, number]> = [
      ['#2f5f6e', 0.0],
      ['#8d3b3b', 0.055],
      ['#3f6b45', 0.11],
      ['#c2a355', 0.165],
    ];
    for (const [color, offset] of dancheong) {
      box(ctx, w + 0.5, 0.05, d + 0.5, buildMaterials.stoneTrim(color), [0, beamY - offset, 0], undefined, 1.6);
    }
    // 기둥 머리의 색 마디
    for (const sx of [-1, 1]) {
      box(ctx, 0.17, 0.3, 0.17, buildMaterials.stoneTrim('#8d3b3b'), [(sx * w) / 2, beamY - 0.28, d / 2 + 0.03], undefined, 1.6);
      box(ctx, 0.19, 0.06, 0.19, buildMaterials.stoneTrim('#2f5f6e'), [(sx * w) / 2, beamY - 0.13, d / 2 + 0.03], undefined, 1.6);
    }
  }

  // 글자 없는 나무 현판 — 이름은 CSS 라벨로 또렷하게 띄운다.
  // (텍스처로 구운 글씨는 비스듬한 시점에서 읽기 어렵고 지붕에 가린다.)
  if (spec.sign) {
    const plaqueW = Math.min(w * 0.58, 2.2);
    // 층수가 높아도 현판은 문 바로 위에 건다 (처마에 가리지 않고 눈높이에 들어온다)
    const y = Math.min(FLOOR_H * floors - 0.34, 1.98);
    box(ctx, plaqueW, 0.38, 0.09, buildMaterials.stoneTrim('#3c3227'), [0, y, d / 2 + 0.22], undefined, 1.2);
    box(ctx, plaqueW + 0.14, 0.07, 0.14, buildMaterials.wood('#7a6144'), [0, y + 0.22, d / 2 + 0.22], undefined, 1.4);
    box(ctx, plaqueW + 0.14, 0.07, 0.14, buildMaterials.wood('#7a6144'), [0, y - 0.22, d / 2 + 0.22], undefined, 1.4);
    // 현판 양옆으로 늘어뜨린 붉은 세로 천
    for (const sx of [-1, 1]) {
      const bannerX = sx * (Math.min(w * 0.58, 2.2) / 2 + 0.62);
      if (Math.abs(bannerX) < w / 2 + 0.3) {
        box(ctx, 0.3, 1.5, 0.05, buildMaterials.stoneTrim('#8d3231'), [bannerX, y - 0.62, d / 2 + 0.16], undefined, 1.2);
        box(ctx, 0.34, 0.09, 0.09, buildMaterials.wood('#6b5741'), [bannerX, y + 0.16, d / 2 + 0.16], undefined, 1.6);
        box(ctx, 0.3, 0.1, 0.06, buildMaterials.stoneTrim('#c2a355'), [bannerX, y - 1.34, d / 2 + 0.17], undefined, 1.6);
      }
    }

    // 현판 양옆의 등롱
    for (const sx of [-1, 1]) {
      const lamp = add(
        ctx,
        new THREE.SphereGeometry(0.13, 10, 8),
        glowMaterial('#d8894a'),
        [sx * (plaqueW / 2 + 0.34), y, d / 2 + 0.24],
      );
      lamp.scale.set(1, 1.25, 1);
      lamp.castShadow = false;
      ctx.litWindows.push(lamp);
    }
  }

  return {
    group,
    textures: [],
    geometries: ctx.geometries,
    labelHeight: top + 0.5,
    litWindows: ctx.litWindows,
  };
}
