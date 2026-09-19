import type { PropKind, TileChar, TileSpec, WorldMap } from '../types';

/**
 * 타일 격자와 길찾기.
 *
 * 거상처럼 「바닥을 클릭하면 캐릭터가 걸어간다」를 구현하려면
 *  (1) 맵 문자열 → 통행 가능 격자
 *  (2) 시작칸 → 목표칸 A* 최단 경로
 *  (3) 경로를 부드럽게 따라가는 보간
 * 이 필요하다. 이 파일은 (1)(2)를 순수 함수로 다뤄 단위 테스트가 가능하게 한다.
 */

/** 타일 문자별 속성표 */
export const TILE_SPECS: Record<TileChar, TileSpec> = {
  /** 흙길 */
  '.': { walkable: true, color: '#9c8a68', height: 0 },
  ',': { walkable: true, color: '#6f8f4f', height: 0 },
  '#': { walkable: false, color: '#6b6258', height: 0.9 },
  '~': { walkable: false, color: '#3f6b86', height: -0.15 },
  '=': { walkable: true, color: '#8d8579', height: 0.02 },
  '+': { walkable: true, color: '#a98b62', height: 0.06 },
  T: { walkable: false, color: '#4f6b3a', height: 0.05 },
  '^': { walkable: true, color: '#9a8d76', height: 0.35 },
  S: { walkable: true, color: '#a5a096', height: 0.04 },
  x: { walkable: false, color: '#5a5145', height: 0.2 },
};

export interface Grid {
  width: number;
  height: number;
  /** z*width + x 로 접근하는 타일 문자 배열 */
  cells: TileChar[];
}

/** 맵 문자열 배열을 격자로 바꾼다. 행 길이가 다르면 예외를 던진다. */
export function buildGrid(tiles: string[]): Grid {
  if (tiles.length === 0) throw new Error('빈 맵입니다.');
  const width = tiles[0].length;
  const height = tiles.length;
  const cells: TileChar[] = [];
  tiles.forEach((row, z) => {
    if (row.length !== width) {
      throw new Error(`맵 ${z}행의 길이(${row.length})가 첫 행(${width})과 다릅니다.`);
    }
    for (const ch of row) {
      if (!(ch in TILE_SPECS)) throw new Error(`알 수 없는 타일 문자: "${ch}"`);
      cells.push(ch as TileChar);
    }
  });
  return { width, height, cells };
}

/**
 * 통행을 막는 장식물.
 * 나무·바위·우물처럼 부피가 있는 것만 막고, 깃대·가로등처럼 가느다란 것은 통과시킨다.
 */
export const BLOCKING_PROPS: ReadonlySet<PropKind> = new Set<PropKind>([
  'tree',
  'pine',
  'willow',
  'cherry',
  'well',
  'rock',
  'monument',
  'crate',
  'barrel',
  'cart',
  'desk',
  'stone-lantern',
  'stump',
]);

/**
 * 맵 데이터로부터 실제 플레이용 격자를 만든다.
 *
 * 지형은 `map.tiles` 문자열로 그리고, **건물과 부피 있는 장식물은 좌표로만 배치**한다.
 * 이 함수가 그 발자국을 자동으로 통행 불가('#')로 찍어 주므로,
 * 맵을 손으로 그릴 때 건물 모양을 타일에 맞춰 다시 그릴 필요가 없다.
 * (지형과 건물이 어긋나 캐릭터가 벽을 뚫고 걷는 사고를 원천적으로 막는다.)
 */
export function buildWorldGrid(map: WorldMap): Grid {
  const grid = buildGrid(map.tiles);
  const set = (x: number, z: number, ch: TileChar) => {
    if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) return;
    grid.cells[z * grid.width + x] = ch;
  };

  for (const b of map.buildings) {
    for (let dz = 0; dz < b.d; dz += 1) {
      for (let dx = 0; dx < b.w; dx += 1) {
        set(b.x + dx, b.z + dz, '#');
      }
    }
  }

  for (const prop of map.props) {
    if (BLOCKING_PROPS.has(prop.kind)) set(prop.x, prop.z, 'T');
  }

  return grid;
}

export function tileAt(grid: Grid, x: number, z: number): TileChar | null {
  if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) return null;
  return grid.cells[z * grid.width + x];
}

export function isWalkable(grid: Grid, x: number, z: number): boolean {
  const ch = tileAt(grid, x, z);
  return ch !== null && TILE_SPECS[ch].walkable;
}

export function tileHeight(grid: Grid, x: number, z: number): number {
  const ch = tileAt(grid, x, z);
  return ch === null ? 0 : TILE_SPECS[ch].height;
}

export interface Point {
  x: number;
  z: number;
}

/** 8방향 이동 (대각선 포함). 거상 캐릭터도 8방향으로 걷는다. */
const NEIGHBORS: Array<[number, number, number]> = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** 옥타일 휴리스틱 (8방향 격자의 정확한 하한) */
function heuristic(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return (dx + dz) + (Math.SQRT2 - 2) * Math.min(dx, dz);
}

/**
 * A* 최단 경로.
 *
 * @returns 시작칸을 제외한 경로. 도달 불가면 빈 배열.
 *          목표칸이 막혀 있으면 목표에 가장 가까운 통행 가능칸까지 간다.
 */
export function findPath(grid: Grid, from: Point, to: Point): Point[] {
  const goal = isWalkable(grid, to.x, to.z) ? to : nearestWalkable(grid, to);
  if (!goal) return [];
  if (!isWalkable(grid, from.x, from.z)) return [];
  if (from.x === goal.x && from.z === goal.z) return [];

  const size = grid.width * grid.height;
  const idx = (x: number, z: number) => z * grid.width + x;
  const gScore = new Float64Array(size).fill(Infinity);
  const fScore = new Float64Array(size).fill(Infinity);
  const cameFrom = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);

  const start = idx(from.x, from.z);
  const target = idx(goal.x, goal.z);
  gScore[start] = 0;
  fScore[start] = heuristic(from.x, from.z, goal.x, goal.z);

  /** 작은 맵(최대 수천 칸)이므로 이진 힙 대신 선형 탐색으로 충분하다. */
  const open = new Set<number>([start]);

  while (open.size > 0) {
    let current = -1;
    let best = Infinity;
    for (const node of open) {
      if (fScore[node] < best) {
        best = fScore[node];
        current = node;
      }
    }
    if (current === target) break;
    open.delete(current);
    closed[current] = 1;

    const cx = current % grid.width;
    const cz = Math.floor(current / grid.width);

    for (const [dx, dz, cost] of NEIGHBORS) {
      const nx = cx + dx;
      const nz = cz + dz;
      if (!isWalkable(grid, nx, nz)) continue;
      // 대각선으로 건물 모서리를 뚫고 지나가지 않게 막는다.
      if (dx !== 0 && dz !== 0) {
        if (!isWalkable(grid, cx + dx, cz) || !isWalkable(grid, cx, cz + dz)) continue;
      }
      const n = idx(nx, nz);
      if (closed[n]) continue;
      // 계단/언덕은 오르내리는 데 힘이 더 든다.
      const climb = Math.abs(tileHeight(grid, nx, nz) - tileHeight(grid, cx, cz)) * 2;
      const tentative = gScore[current] + cost + climb;
      if (tentative < gScore[n]) {
        cameFrom[n] = current;
        gScore[n] = tentative;
        fScore[n] = tentative + heuristic(nx, nz, goal.x, goal.z);
        open.add(n);
      }
    }
  }

  if (cameFrom[target] === -1 && target !== start) return [];

  const path: Point[] = [];
  let node = target;
  while (node !== start && node !== -1) {
    path.push({ x: node % grid.width, z: Math.floor(node / grid.width) });
    node = cameFrom[node];
  }
  return path.reverse();
}

/** 목표칸이 막혀 있을 때, 가장 가까운 통행 가능칸을 너비 우선으로 찾는다. */
export function nearestWalkable(grid: Grid, to: Point, maxRadius = 8): Point | null {
  for (let r = 1; r <= maxRadius; r += 1) {
    for (let dz = -r; dz <= r; dz += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = to.x + dx;
        const z = to.z + dz;
        if (isWalkable(grid, x, z)) return { x, z };
      }
    }
  }
  return null;
}

/**
 * 맵 정합성 검사 — 콘텐츠 테스트에서 쓴다.
 * 건물·장식물·NPC·시작 지점이 맵 밖으로 나가거나 벽에 박혀 있지 않은지 본다.
 */
export function validateMap(map: WorldMap): string[] {
  const errors: string[] = [];
  let grid: Grid;
  try {
    grid = buildWorldGrid(map);
  } catch (error) {
    return [`[${map.id}] ${(error as Error).message}`];
  }

  if (!isWalkable(grid, map.spawn.x, map.spawn.z)) {
    errors.push(`[${map.id}] 시작 지점 (${map.spawn.x}, ${map.spawn.z})이 통행 불가 타일입니다.`);
  }

  for (const b of map.buildings) {
    if (b.x < 0 || b.z < 0 || b.x + b.w > grid.width || b.z + b.d > grid.height) {
      errors.push(`[${map.id}] 건물 ${b.id}가 맵 밖으로 나갑니다.`);
    }
  }

  for (const npc of map.npcs) {
    if (!isWalkable(grid, npc.x, npc.z)) {
      errors.push(
        `[${map.id}] NPC ${npc.figureId}가 통행 불가 타일 (${npc.x}, ${npc.z})에 서 있습니다. (건물·나무 발자국과 겹쳤는지 확인)`,
      );
      continue;
    }
    // NPC 에게 말을 걸려면 플레이어가 옆칸까지 갈 수 있어야 한다.
    const path = findPath(grid, map.spawn, { x: npc.x, z: npc.z });
    if (path.length === 0) {
      errors.push(`[${map.id}] NPC ${npc.figureId}에게 시작 지점에서 걸어갈 수 없습니다.`);
    }
  }

  for (const p of map.props) {
    if (p.x < 0 || p.z < 0 || p.x >= grid.width || p.z >= grid.height) {
      errors.push(`[${map.id}] 장식물 ${p.kind}가 맵 밖에 있습니다 (${p.x}, ${p.z}).`);
    }
  }

  return errors;
}
