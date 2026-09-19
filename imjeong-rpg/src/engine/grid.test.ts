import { describe, expect, it } from 'vitest';
import type { WorldMap } from '../types';
import {
  buildGrid,
  buildWorldGrid,
  findPath,
  isWalkable,
  nearestWalkable,
  tileAt,
  validateMap,
} from './grid';
import {
  cameraPosition,
  clampViewTiles,
  facingAngle,
  gridToWorld,
  lerpAngle,
  normalizeAngle,
  worldToGrid,
  MAX_VIEW_TILES,
  MIN_VIEW_TILES,
} from './isometric';

describe('격자 만들기', () => {
  it('문자열에서 격자를 만든다', () => {
    const grid = buildGrid(['...', '.#.', '...']);
    expect(grid.width).toBe(3);
    expect(grid.height).toBe(3);
    expect(tileAt(grid, 1, 1)).toBe('#');
    expect(isWalkable(grid, 1, 1)).toBe(false);
    expect(isWalkable(grid, 0, 0)).toBe(true);
  });

  it('행 길이가 다르면 예외를 던진다', () => {
    expect(() => buildGrid(['...', '..'])).toThrow();
  });

  it('모르는 타일 문자는 예외를 던진다', () => {
    expect(() => buildGrid(['..?'])).toThrow();
  });

  it('맵 밖은 통행 불가로 본다', () => {
    const grid = buildGrid(['..', '..']);
    expect(tileAt(grid, -1, 0)).toBeNull();
    expect(isWalkable(grid, 5, 5)).toBe(false);
  });
});

describe('길찾기', () => {
  const open = buildGrid(['.....', '.....', '.....', '.....', '.....']);

  it('가로지르는 최단 경로를 찾는다', () => {
    const path = findPath(open, { x: 0, z: 0 }, { x: 4, z: 4 });
    expect(path.length).toBe(4); // 대각선 4번
    expect(path[path.length - 1]).toEqual({ x: 4, z: 4 });
  });

  it('벽을 돌아간다', () => {
    const walled = buildGrid(['.....', '.###.', '.....', '.###.', '.....']);
    const path = findPath(walled, { x: 2, z: 0 }, { x: 2, z: 4 });
    expect(path.length).toBeGreaterThan(4);
    for (const step of path) expect(isWalkable(walled, step.x, step.z)).toBe(true);
  });

  it('막혀서 갈 수 없으면 빈 경로를 준다', () => {
    const sealed = buildGrid(['..#..', '..#..', '..#..']);
    expect(findPath(sealed, { x: 0, z: 0 }, { x: 4, z: 0 })).toEqual([]);
  });

  it('제자리를 누르면 움직이지 않는다', () => {
    expect(findPath(open, { x: 2, z: 2 }, { x: 2, z: 2 })).toEqual([]);
  });

  it('벽을 눌러도 그 옆 칸까지는 걸어간다', () => {
    const walled = buildGrid(['.....', '..#..', '.....']);
    const path = findPath(walled, { x: 0, z: 0 }, { x: 2, z: 1 });
    expect(path.length).toBeGreaterThan(0);
    const last = path[path.length - 1];
    expect(isWalkable(walled, last.x, last.z)).toBe(true);
  });

  it('건물 모서리를 대각선으로 뚫고 지나가지 않는다', () => {
    // 대각선으로 맞닿은 두 벽 사이를 빠져나갈 수 없어야 한다
    const corner = buildGrid(['.#.', '#..', '...']);
    const path = findPath(corner, { x: 0, z: 0 }, { x: 2, z: 2 });
    // (0,0) 에서 (1,1) 로 바로 갈 수 없으므로 우회하거나 도달 불가
    if (path.length > 0) {
      expect(path[0]).not.toEqual({ x: 1, z: 1 });
    }
  });

  it('가장 가까운 통행 가능 칸을 찾는다', () => {
    const walled = buildGrid(['...', '.#.', '...']);
    expect(nearestWalkable(walled, { x: 1, z: 1 })).not.toBeNull();
  });
});

describe('건물 발자국 자동 반영', () => {
  const map: WorldMap = {
    id: 'shanghai',
    name: '시험 맵',
    period: '1919',
    summary: { middle: '시험', high: '시험' },
    historicalNote: '시험용 맵이며 실제 장소가 아니다. 이 문장은 길이를 채우기 위한 것이다.',
    tiles: ['.....', '.....', '.....', '.....', '.....'],
    sky: '#fff',
    fog: '#fff',
    spawn: { x: 0, z: 4 },
    buildings: [{ id: 'b', style: 'shikumen', x: 1, z: 1, w: 3, d: 2, floors: 1 }],
    props: [{ kind: 'tree', x: 0, z: 0 }],
    npcs: [{ figureId: 'kimgu', x: 4, z: 4 }],
  };

  it('건물이 놓인 칸은 통행 불가가 된다', () => {
    const grid = buildWorldGrid(map);
    expect(isWalkable(grid, 2, 1)).toBe(false);
    expect(isWalkable(grid, 2, 3)).toBe(true);
  });

  it('부피 있는 장식물도 통행을 막는다', () => {
    const grid = buildWorldGrid(map);
    expect(isWalkable(grid, 0, 0)).toBe(false);
  });

  it('검사에 통과한다', () => {
    expect(validateMap(map)).toEqual([]);
  });

  it('시작 지점이 벽이면 오류를 보고한다', () => {
    const broken: WorldMap = { ...map, spawn: { x: 2, z: 1 } };
    expect(validateMap(broken).length).toBeGreaterThan(0);
  });
});

describe('아이소메트릭 계산', () => {
  it('카메라는 목표점보다 위에, 그리고 대각선 방향에 놓인다', () => {
    const pos = cameraPosition({ x: 10, y: 0, z: 10 }, 40);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.x).toBeGreaterThan(10);
    expect(pos.z).toBeGreaterThan(10);
  });

  it('격자와 월드 좌표를 오간다', () => {
    const world = gridToWorld(3, 5);
    expect(world).toEqual({ x: 3.5, y: 0, z: 5.5 });
    expect(worldToGrid(world.x, world.z)).toEqual({ x: 3, z: 5 });
  });

  it('진행 방향을 구한다', () => {
    const angle = facingAngle({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    expect(angle).toBeCloseTo(0);
    const right = facingAngle({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    expect(right).toBeCloseTo(Math.PI / 2);
  });

  it('각도를 -π~π 로 정규화한다', () => {
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI);
  });

  it('최단 방향으로 회전한다 (먼 길로 돌지 않는다)', () => {
    // 3.0 에서 -3.0 으로 갈 때는 뒤로 도는 편이 가깝다
    const next = lerpAngle(3.0, -3.0, 0.5);
    expect(Math.abs(next)).toBeGreaterThan(3.0);
  });

  it('줌 범위를 벗어나지 않는다', () => {
    expect(clampViewTiles(1)).toBe(MIN_VIEW_TILES);
    expect(clampViewTiles(999)).toBe(MAX_VIEW_TILES);
  });
});
