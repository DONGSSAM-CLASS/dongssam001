/**
 * 아이소메트릭 시점 계산.
 *
 * 거상은 2:1 비율의 쿼터뷰(직교 투영)를 쓴다. 이 게임은 three.js 의
 * OrthographicCamera 를 같은 각도로 놓아 "3D 로 만들어진 쿼터뷰"를 만든다.
 * 원근 왜곡이 없어 건물이 화면 끝에서도 반듯하게 서 보인다 — 첨부한
 * 거상 화면의 입체감이 바로 이 직교 투영에서 온다.
 */

/** 카메라 방위각(°). 45°면 정확한 대각선 쿼터뷰가 된다. */
export const CAMERA_YAW_DEG = 45;

/**
 * 카메라 고각(°).
 * 30°면 고전적인 2:1 아이소메트릭(타일이 가로:세로 2:1 마름모)이 되고,
 * 35.264°면 수학적으로 정확한 등각(isometric)이 된다.
 * 거상 화면은 이 둘 사이로 보이므로 34°를 기본으로 쓴다.
 */
export const CAMERA_PITCH_DEG = 34;

/** 카메라가 목표점에서 떨어지는 거리 (타일 단위) */
export const CAMERA_DISTANCE = 40;

/**
 * 화면 세로에 몇 칸을 담을지 (작을수록 확대).
 * 직교 카메라라서 「줌」은 곧 보이는 타일 수다.
 */
export const DEFAULT_VIEW_TILES = 19;
export const MIN_VIEW_TILES = 11;
export const MAX_VIEW_TILES = 34;

const DEG = Math.PI / 180;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 목표점(target)을 바라보는 아이소메트릭 카메라의 위치를 구한다.
 * @param target 카메라가 바라볼 월드 좌표 (보통 플레이어 위치)
 */
export function cameraPosition(target: Vec3, distance = CAMERA_DISTANCE): Vec3 {
  const yaw = CAMERA_YAW_DEG * DEG;
  const pitch = CAMERA_PITCH_DEG * DEG;
  const horizontal = Math.cos(pitch) * distance;
  return {
    x: target.x + Math.sin(yaw) * horizontal,
    y: target.y + Math.sin(pitch) * distance,
    z: target.z + Math.cos(yaw) * horizontal,
  };
}

/**
 * 격자 좌표 → 월드 좌표.
 * 타일 1칸 = 월드 1단위. 타일 중심을 쓰기 위해 0.5를 더한다.
 */
export function gridToWorld(x: number, z: number, y = 0): Vec3 {
  return { x: x + 0.5, y, z: z + 0.5 };
}

/** 월드 좌표 → 격자 좌표 */
export function worldToGrid(x: number, z: number): { x: number; z: number } {
  return { x: Math.floor(x), z: Math.floor(z) };
}

/**
 * 두 점 사이의 진행 방향(y축 회전각).
 * 캐릭터가 걸어가는 쪽으로 몸을 돌리게 한다.
 */
export function facingAngle(from: Vec3, to: Vec3): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** 각도를 -π~π 범위로 정규화 */
export function normalizeAngle(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/** 현재 각에서 목표 각으로 최단 회전으로 보간 */
export function lerpAngle(current: number, target: number, t: number): number {
  const diff = normalizeAngle(target - current);
  return current + diff * Math.min(1, Math.max(0, t));
}

/** 줌 값을 허용 범위로 자른다 */
export function clampViewTiles(tiles: number): number {
  return Math.min(MAX_VIEW_TILES, Math.max(MIN_VIEW_TILES, tiles));
}
