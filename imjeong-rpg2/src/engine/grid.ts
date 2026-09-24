import type { FurnitureSpec, PropKind, TileChar, WorldMap } from '../types';

/**
 * 타일 격자 · 충돌 · 길찾기 (순수 함수 — 단위 테스트 대상).
 *
 * 1인칭으로 걷는 2탄에서 격자는 두 가지 일을 한다.
 *  (1) 충돌 — 벽·가구·나무를 뚫고 걸어가지 않게 막는다.
 *  (2) 길찾기 — 「데려다 주기」를 누르거나 멀리 있는 사람을 누르면 그 앞까지 자동으로 걷는다.
 *      (중학교 1학년이 1인칭 조작에 서툴러도 끝까지 진행할 수 있어야 한다.)
 */

export interface TileSpec {
  walkable: boolean;
  /** 실내 바닥인지 — 천장을 덮을지 정한다 */
  indoor: boolean;
  /** 벽처럼 높이 세우는 타일인지 */
  wall: boolean;
}

export const TILE_SPECS: Record<TileChar, TileSpec> = {
  '.': { walkable: true, indoor: false, wall: false },
  ',': { walkable: true, indoor: false, wall: false },
  '=': { walkable: true, indoor: false, wall: false },
  S: { walkable: true, indoor: false, wall: false },
  '^': { walkable: true, indoor: false, wall: false },
  '+': { walkable: true, indoor: true, wall: false },
  C: { walkable: true, indoor: true, wall: false },
  M: { walkable: true, indoor: true, wall: false },
  D: { walkable: true, indoor: true, wall: false },
  W: { walkable: false, indoor: false, wall: true },
  B: { walkable: false, indoor: false, wall: true },
  K: { walkable: false, indoor: false, wall: true },
  '~': { walkable: false, indoor: false, wall: false },
  T: { walkable: false, indoor: false, wall: false },
  x: { walkable: false, indoor: false, wall: false },
};

export interface Grid {
  width: number;
  height: number;
  cells: TileChar[];
  /** 가구·NPC 처럼 타일 위에 놓여 길을 막는 것 */
  blocked: Uint8Array;
}

export interface Point {
  x: number;
  z: number;
}

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
  return { width, height, cells, blocked: new Uint8Array(width * height) };
}

/** 부피가 있어 길을 막는 바깥 장식물 */
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
 * 가구가 차지하는 칸.
 * 의자·화분·등잔·액자처럼 작거나 벽에 붙은 것은 길을 막지 않는다.
 * (1인칭에서 의자에 자꾸 걸리면 조작이 답답해진다.)
 */
export function furnitureFootprint(f: FurnitureSpec): Point[] {
  const cells: Point[] = [];
  const rect = (w: number, d: number) => {
    const turned = Math.abs(Math.sin(f.rot ?? 0)) > 0.5;
    const ww = turned ? d : w;
    const dd = turned ? w : d;
    for (let dz = 0; dz < dd; dz += 1) for (let dx = 0; dx < ww; dx += 1) cells.push({ x: f.x + dx, z: f.z + dz });
  };
  switch (f.kind) {
    case 'long-table':
      rect(f.w ?? 4, 2);
      break;
    case 'podium':
      rect(3, 2);
      break;
    case 'office-desk':
    case 'bookshelf':
      rect(2, 1);
      break;
    case 'press':
      rect(2, 2);
      break;
    case 'bench-long':
      rect(f.w ?? 3, 1);
      break;
    case 'safe':
    case 'display-case':
    case 'stove':
    case 'flag-stand':
    case 'honor-plaque':
      rect(1, 1);
      break;
    default:
      break;
  }
  return cells;
}

/** 맵 전체로부터 플레이용 격자를 만든다 (건물·장식물·가구의 발자국을 막는다). */
export function buildWorldGrid(map: WorldMap): Grid {
  const grid = buildGrid(map.tiles);
  const block = (x: number, z: number) => {
    if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) return;
    grid.blocked[z * grid.width + x] = 1;
  };
  for (const b of map.buildings) {
    for (let dz = 0; dz < b.d; dz += 1) for (let dx = 0; dx < b.w; dx += 1) block(b.x + dx, b.z + dz);
  }
  for (const p of map.props) if (BLOCKING_PROPS.has(p.kind)) block(p.x, p.z);
  for (const f of map.furniture) for (const c of furnitureFootprint(f)) block(c.x, c.z);
  return grid;
}

export function tileAt(grid: Grid, x: number, z: number): TileChar | null {
  if (x < 0 || z < 0 || x >= grid.width || z >= grid.height) return null;
  return grid.cells[z * grid.width + x];
}

export function isWalkable(grid: Grid, x: number, z: number): boolean {
  const ch = tileAt(grid, x, z);
  if (ch === null || !TILE_SPECS[ch].walkable) return false;
  return grid.blocked[z * grid.width + x] === 0;
}

/* ───────────────────────── 충돌 ───────────────────────── */

/**
 * 원(플레이어)을 격자에 맞춰 밀어낸다.
 * 벽에 부딪혔을 때 멈추지 않고 벽을 따라 미끄러지도록 x·z 를 따로 푼다.
 * (1인칭 게임에서 벽에 비스듬히 닿으면 미끄러져야 답답하지 않다.)
 */
export function moveWithCollision(
  grid: Grid,
  from: { x: number; z: number },
  dx: number,
  dz: number,
  radius = 0.28,
): { x: number; z: number } {
  let x = from.x;
  let z = from.z;
  // 한 번에 크게 움직이면 얇은 벽을 뚫는다 — 잘게 나눠 움직인다.
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.2));
  for (let i = 0; i < steps; i += 1) {
    const nx = x + dx / steps;
    if (!circleHits(grid, nx, z, radius)) x = nx;
    const nz = z + dz / steps;
    if (!circleHits(grid, x, nz, radius)) z = nz;
  }
  return { x, z };
}

export function circleHits(grid: Grid, cx: number, cz: number, r: number): boolean {
  const minX = Math.floor(cx - r);
  const maxX = Math.floor(cx + r);
  const minZ = Math.floor(cz - r);
  const maxZ = Math.floor(cz + r);
  for (let z = minZ; z <= maxZ; z += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (isWalkable(grid, x, z)) continue;
      // 원과 칸(사각형)의 가장 가까운 점까지의 거리
      const px = Math.max(x, Math.min(cx, x + 1));
      const pz = Math.max(z, Math.min(cz, z + 1));
      if ((px - cx) ** 2 + (pz - cz) ** 2 < r * r) return true;
    }
  }
  return false;
}

/* ───────────────────────── 길찾기 ───────────────────────── */

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

function heuristic(ax: number, az: number, bx: number, bz: number): number {
  const dx = Math.abs(ax - bx);
  const dz = Math.abs(az - bz);
  return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz);
}

/** A* 최단 경로. 시작칸을 뺀 경로를 돌려준다. 목표가 막혀 있으면 가장 가까운 빈칸으로 간다. */
export function findPath(grid: Grid, from: Point, to: Point): Point[] {
  const goal = isWalkable(grid, to.x, to.z) ? to : nearestWalkable(grid, to, 8, from);
  if (!goal) return [];
  const start0 = isWalkable(grid, from.x, from.z) ? from : nearestWalkable(grid, from, 2);
  if (!start0) return [];
  if (start0.x === goal.x && start0.z === goal.z) return [];

  const size = grid.width * grid.height;
  const idx = (x: number, z: number) => z * grid.width + x;
  const gScore = new Float64Array(size).fill(Infinity);
  const fScore = new Float64Array(size).fill(Infinity);
  const cameFrom = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const start = idx(start0.x, start0.z);
  const target = idx(goal.x, goal.z);
  gScore[start] = 0;
  fScore[start] = heuristic(start0.x, start0.z, goal.x, goal.z);
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
      if (dx !== 0 && dz !== 0 && (!isWalkable(grid, cx + dx, cz) || !isWalkable(grid, cx, cz + dz))) continue;
      const n = idx(nx, nz);
      if (closed[n]) continue;
      const tentative = gScore[current] + cost;
      if (tentative < gScore[n]) {
        cameFrom[n] = current;
        gScore[n] = tentative;
        fScore[n] = tentative + heuristic(nx, nz, goal.x, goal.z);
        open.add(n);
      }
    }
  }

  if (cameFrom[target] === -1) return [];
  const path: Point[] = [];
  let node = target;
  while (node !== start && node !== -1) {
    path.push({ x: node % grid.width, z: Math.floor(node / grid.width) });
    node = cameFrom[node];
  }
  return path.reverse();
}

/** 막힌 칸 가까이의 빈칸. `prefer` 가 있으면 같은 거리 중 그쪽에 가까운 칸을 고른다. */
export function nearestWalkable(grid: Grid, to: Point, maxRadius = 8, prefer?: Point): Point | null {
  for (let r = 1; r <= maxRadius; r += 1) {
    let best: Point | null = null;
    let bestD = Infinity;
    for (let dz = -r; dz <= r; dz += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = to.x + dx;
        const z = to.z + dz;
        if (!isWalkable(grid, x, z)) continue;
        const d = prefer ? Math.hypot(prefer.x - x, prefer.z - z) : Math.hypot(dx, dz);
        if (d < bestD) {
          bestD = d;
          best = { x, z };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/**
 * NPC 앞까지 가는 길 — NPC 가 서 있는 칸은 막혀 있으므로 그 옆칸을 목표로 한다.
 */
export function pathToNpc(grid: Grid, from: Point, npc: Point): Point[] {
  const goal = nearestWalkable(grid, npc, 3, from);
  if (!goal) return [];
  return findPath(grid, from, goal);
}

/* ───────────────────────── 맵 검사 ───────────────────────── */

/** 맵 정합성 검사 — 콘텐츠 테스트에서 쓴다. */
export function validateMap(map: WorldMap): string[] {
  const errors: string[] = [];
  let grid: Grid;
  try {
    grid = buildWorldGrid(map);
  } catch (error) {
    return [`[${map.id}] ${(error as Error).message}`];
  }
  const spawn = { x: Math.floor(map.spawn.x), z: Math.floor(map.spawn.z) };
  if (!isWalkable(grid, spawn.x, spawn.z)) {
    errors.push(`[${map.id}] 시작 지점 (${spawn.x}, ${spawn.z})이 막혀 있습니다.`);
  }
  for (const b of map.buildings) {
    if (b.x < 0 || b.z < 0 || b.x + b.w > grid.width || b.z + b.d > grid.height) {
      errors.push(`[${map.id}] 건물 ${b.id}가 맵 밖으로 나갑니다.`);
    }
  }
  const npcCells = new Set<string>();
  for (const npc of map.npcs) {
    npcCells.add(`${npc.x},${npc.z}`);
    if (!isWalkable(grid, npc.x, npc.z)) {
      errors.push(`[${map.id}] NPC ${npc.figureId}가 막힌 칸 (${npc.x}, ${npc.z})에 서 있습니다.`);
      continue;
    }
    if (findPath(grid, spawn, { x: npc.x, z: npc.z }).length === 0) {
      errors.push(`[${map.id}] NPC ${npc.figureId}에게 걸어갈 수 없습니다.`);
    }
  }
  for (const relic of map.relics) {
    if (!isWalkable(grid, relic.x, relic.z)) {
      errors.push(`[${map.id}] 기록 조각 ${relic.relicId}가 막힌 칸 (${relic.x}, ${relic.z})에 있습니다.`);
    } else if (findPath(grid, spawn, relic).length === 0 && !(spawn.x === relic.x && spawn.z === relic.z)) {
      errors.push(`[${map.id}] 기록 조각 ${relic.relicId}에 걸어갈 수 없습니다.`);
    } else if (npcCells.has(`${relic.x},${relic.z}`)) {
      errors.push(`[${map.id}] 기록 조각 ${relic.relicId}가 NPC 와 겹칩니다.`);
    }
  }
  for (const f of map.furniture) {
    if (f.kind === 'honor-plaque' && !f.figureId) errors.push(`[${map.id}] 명패에 figureId 가 없습니다.`);
    for (const c of furnitureFootprint(f)) {
      if (c.x < 0 || c.z < 0 || c.x >= grid.width || c.z >= grid.height) {
        errors.push(`[${map.id}] 가구 ${f.kind}가 맵 밖에 있습니다.`);
        break;
      }
      const ch = tileAt(grid, c.x, c.z);
      if (ch && TILE_SPECS[ch].wall) {
        errors.push(`[${map.id}] 가구 ${f.kind}(${f.x},${f.z})가 벽 (${c.x},${c.z})에 박혀 있습니다.`);
        break;
      }
    }
  }
  return errors;
}
