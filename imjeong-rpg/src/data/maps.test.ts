import { describe, expect, it } from 'vitest';
import { worldMaps } from './maps';
import { buildWorldGrid, findPath, validateMap } from '../engine/grid';
import { figures } from './figures';

describe('맵 데이터 무결성', () => {
  it('모든 맵이 격자·건물·NPC 검사를 통과한다', () => {
    const errors = worldMaps.flatMap(validateMap);
    expect(errors).toEqual([]);
  });

  it('맵 id 가 중복되지 않는다', () => {
    const ids = worldMaps.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 NPC 가 인물 사전에 등록되어 있다', () => {
    const missing = worldMaps.flatMap((m) =>
      m.npcs.filter((n) => !(n.figureId in figures)).map((n) => `${m.id}:${n.figureId}`),
    );
    expect(missing).toEqual([]);
  });

  it('같은 맵에 같은 인물이 두 번 서 있지 않는다', () => {
    for (const map of worldMaps) {
      const ids = map.npcs.map((n) => n.figureId);
      expect(new Set(ids).size, `${map.id} 에 중복 NPC`).toBe(ids.length);
    }
  });

  it('NPC 끼리 같은 칸에 겹쳐 서 있지 않는다', () => {
    for (const map of worldMaps) {
      const cells = map.npcs.map((n) => `${n.x},${n.z}`);
      expect(new Set(cells).size, `${map.id} 에 겹친 NPC 좌표`).toBe(cells.length);
    }
  });

  it('건물끼리 겹치지 않는다', () => {
    for (const map of worldMaps) {
      const taken = new Set<string>();
      for (const b of map.buildings) {
        for (let dz = 0; dz < b.d; dz += 1) {
          for (let dx = 0; dx < b.w; dx += 1) {
            const key = `${b.x + dx},${b.z + dz}`;
            expect(taken.has(key), `${map.id}: 건물 ${b.id} 가 다른 건물과 겹침 (${key})`).toBe(false);
            taken.add(key);
          }
        }
      }
    }
  });

  it('건물 출입구 앞(남쪽 한 칸)에 걸어갈 수 있다', () => {
    for (const map of worldMaps) {
      const grid = buildWorldGrid(map);
      for (const b of map.buildings) {
        const doorX = b.x + Math.floor(b.w / 2);
        const doorZ = b.z + b.d; // 건물 남쪽 바로 앞 칸
        if (doorZ >= grid.height) continue;
        const path = findPath(grid, map.spawn, { x: doorX, z: doorZ });
        const reached = path.length > 0 || (map.spawn.x === doorX && map.spawn.z === doorZ);
        expect(reached, `${map.id}: 건물 ${b.id} 입구(${doorX},${doorZ})에 접근 불가`).toBe(true);
      }
    }
  });
});
