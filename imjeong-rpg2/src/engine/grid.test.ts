import { Plan } from '../data/plan';
import type { WorldMap } from '../types';
import { buildWorldGrid, circleHits, findPath, isWalkable, moveWithCollision, pathToNpc, validateMap } from './grid';

function mapOf(plan: Plan, extra: Partial<WorldMap> = {}): WorldMap {
  return {
    id: 'memorial',
    name: 't',
    period: '',
    summary: { middle: '', high: '' },
    historicalNote: '',
    tiles: plan.rows(),
    ceiling: 3,
    buildings: [],
    props: [],
    furniture: [],
    spawn: { x: 2, z: 2, yaw: 0 },
    npcs: [],
    relics: [],
    rooms: [],
    portals: [],
    ...extra,
  };
}

describe('도면', () => {
  it('방은 테두리가 벽, 안이 바닥이다', () => {
    const p = new Plan(5, 4).room(0, 0, 5, 4);
    expect(p.rows()).toEqual(['WWWWW', 'W+++W', 'W+++W', 'WWWWW']);
  });
  it('문을 내면 지나갈 수 있다', () => {
    const p = new Plan(9, 5).room(0, 0, 5, 5).room(4, 0, 5, 5).door(4, 2);
    const grid = buildWorldGrid(mapOf(p));
    expect(findPath(grid, { x: 2, z: 2 }, { x: 6, z: 2 }).length).toBeGreaterThan(0);
  });
  it('도면 밖에 그리면 예외', () => {
    expect(() => new Plan(3, 3).set(5, 5, '+')).toThrow();
  });
});

describe('충돌', () => {
  const p = new Plan(7, 7).room(0, 0, 7, 7);
  const grid = buildWorldGrid(mapOf(p));
  it('벽을 뚫고 지나가지 못한다', () => {
    const to = moveWithCollision(grid, { x: 3.5, z: 3.5 }, -10, 0);
    expect(to.x).toBeGreaterThan(1.2);
  });
  it('벽에 비스듬히 닿으면 미끄러진다', () => {
    const to = moveWithCollision(grid, { x: 1.4, z: 3.5 }, -0.5, 0.5);
    expect(to.z).toBeGreaterThan(3.8);
  });
  it('원 판정', () => {
    expect(circleHits(grid, 1.1, 3.5, 0.3)).toBe(true);
    expect(circleHits(grid, 3.5, 3.5, 0.3)).toBe(false);
  });
});

describe('가구와 사람', () => {
  it('회의 탁자는 길을 막고, 의자는 막지 않는다', () => {
    const p = new Plan(12, 8).room(0, 0, 12, 8);
    const map = mapOf(p, {
      furniture: [
        { kind: 'long-table', x: 3, z: 3, w: 5 },
        { kind: 'chair', x: 2, z: 2 },
      ],
    });
    const grid = buildWorldGrid(map);
    expect(isWalkable(grid, 4, 3)).toBe(false);
    expect(isWalkable(grid, 4, 4)).toBe(false);
    expect(isWalkable(grid, 2, 2)).toBe(true);
  });
  it('사람 앞까지 가는 길은 그 사람 옆칸에서 끝난다', () => {
    const p = new Plan(8, 8).room(0, 0, 8, 8);
    const grid = buildWorldGrid(mapOf(p));
    grid.blocked[5 * grid.width + 5] = 1;
    const path = pathToNpc(grid, { x: 1, z: 1 }, { x: 5, z: 5 });
    const end = path[path.length - 1];
    expect(Math.max(Math.abs(end.x - 5), Math.abs(end.z - 5))).toBe(1);
  });
  it('가구가 벽에 박히면 검사에서 걸린다', () => {
    const p = new Plan(6, 6).room(0, 0, 6, 6);
    const map = mapOf(p, { furniture: [{ kind: 'long-table', x: 3, z: 2, w: 4 }] });
    expect(validateMap(map).join()).toContain('벽');
  });
});
