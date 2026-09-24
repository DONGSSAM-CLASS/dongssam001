import type { TileChar } from '../types';

/**
 * 도면 그리기 도구.
 *
 * 1탄은 파이썬 생성기로 지도 문자열을 만들었다. 2탄은 방·복도·문이 많은 실내가 중심이라
 * 「방을 그리고 → 문을 내고 → 창을 낸다」는 식으로 **건축 도면처럼** 짜는 편이 읽기 쉽다.
 * 이 도구가 만든 문자열이 곧 지도(`WorldMap.tiles`)가 된다.
 */
export class Plan {
  readonly width: number;
  readonly height: number;
  private readonly cells: TileChar[];

  constructor(width: number, height: number, fill: TileChar = 'x') {
    this.width = width;
    this.height = height;
    this.cells = new Array<TileChar>(width * height).fill(fill);
  }

  set(x: number, z: number, ch: TileChar): this {
    if (x < 0 || z < 0 || x >= this.width || z >= this.height) {
      throw new Error(`도면 밖 좌표 (${x}, ${z})`);
    }
    this.cells[z * this.width + x] = ch;
    return this;
  }

  get(x: number, z: number): TileChar {
    return this.cells[z * this.width + x];
  }

  /** 사각형을 한 글자로 채운다 */
  fill(x: number, z: number, w: number, d: number, ch: TileChar): this {
    for (let dz = 0; dz < d; dz += 1) for (let dx = 0; dx < w; dx += 1) this.set(x + dx, z + dz, ch);
    return this;
  }

  /**
   * 방 — (x, z)부터 w×d 크기. 테두리는 벽, 안은 바닥.
   * 이웃한 방과 벽을 한 줄 공유하려면 좌표를 한 칸 겹쳐 그리면 된다.
   */
  room(x: number, z: number, w: number, d: number, floor: TileChar = '+', wall: TileChar = 'W'): this {
    for (let dz = 0; dz < d; dz += 1) {
      for (let dx = 0; dx < w; dx += 1) {
        const edge = dx === 0 || dz === 0 || dx === w - 1 || dz === d - 1;
        this.set(x + dx, z + dz, edge ? wall : floor);
      }
    }
    return this;
  }

  /** 벽에 문을 낸다 */
  door(x: number, z: number): this {
    return this.set(x, z, 'D');
  }

  /** 벽에 창을 낸다 (여러 칸) */
  windows(points: Array<[number, number]>): this {
    for (const [x, z] of points) this.set(x, z, 'K');
    return this;
  }

  /** 가로로 늘어선 벽의 x0..x1 사이에 step 칸마다 창을 낸다 */
  windowRow(z: number, x0: number, x1: number, step = 3): this {
    for (let x = x0; x <= x1; x += step) this.set(x, z, 'K');
    return this;
  }

  /** 세로로 늘어선 벽에 창을 낸다 */
  windowCol(x: number, z0: number, z1: number, step = 3): this {
    for (let z = z0; z <= z1; z += step) this.set(x, z, 'K');
    return this;
  }

  rows(): string[] {
    const out: string[] = [];
    for (let z = 0; z < this.height; z += 1) out.push(this.cells.slice(z * this.width, (z + 1) * this.width).join(''));
    return out;
  }
}
