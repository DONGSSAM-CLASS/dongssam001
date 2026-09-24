import * as THREE from 'three';

/**
 * 절차적 텍스처 — 캔버스로 그려서 타일링한다.
 *
 * 외부 이미지 파일을 쓰지 않는 이유:
 *  1) 학교 네트워크에서 수십 MB 짜리 텍스처를 내려받지 않아도 된다.
 *  2) 저작권 문제가 생기지 않는다.
 *  3) 색조를 코드로 조절해 맵마다 분위기를 바꿀 수 있다.
 *
 * 단색 면을 쓰면 아무리 조명을 잘 줘도 종이 모형처럼 보인다.
 * 흙·잔디·기와·벽돌의 결을 넣어야 비로소 「게임 화면」이 된다.
 */

/* ───────────────────────── 난수 (결정적) ───────────────────────── */

function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

/* ───────────────────────── 공통 유틸 ───────────────────────── */

const cache = new Map<string, THREE.Texture>();

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D 컨텍스트를 만들 수 없습니다.');
  return [canvas, ctx];
}

function finish(canvas: HTMLCanvasElement, repeat: number, key: string): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

/** 부드러운 얼룩 — 모든 자연 재질의 바탕이 된다. */
function splotches(
  ctx: CanvasRenderingContext2D,
  size: number,
  rng: () => number,
  colors: string[],
  count: number,
  radius: [number, number],
  alpha = 0.5,
) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const r = radius[0] + rng() * (radius[1] - radius[0]);
    const color = colors[Math.floor(rng() * colors.length)];
    // 가장자리를 넘어가는 얼룩은 반대편에도 그려 이음매를 없앤다.
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        if (Math.abs(x + dx - size / 2) > size || Math.abs(y + dy - size / 2) > size) continue;
        const gradient = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** 자잘한 점 — 모래알·자갈 */
function speckle(
  ctx: CanvasRenderingContext2D,
  size: number,
  rng: () => number,
  colors: string[],
  count: number,
  maxR = 1.6,
) {
  for (let i = 0; i < count; i += 1) {
    ctx.fillStyle = colors[Math.floor(rng() * colors.length)];
    ctx.beginPath();
    ctx.arc(rng() * size, rng() * size, 0.4 + rng() * maxR, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ───────────────────────── 지면 ───────────────────────── */

/** 흙길 — 마른 황토에 잔 자갈과 수레바퀴 자국 */
export function dirtTexture(): THREE.Texture {
  const key = 'dirt';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(1019);
  ctx.fillStyle = '#9c8a68';
  ctx.fillRect(0, 0, size, size);
  splotches(ctx, size, rng, ['#8b7a58', '#a8956d', '#b6a67c', '#7d6c46'], 40, [18, 52], 0.55);
  splotches(ctx, size, rng, ['#655843', '#6f6145'], 20, [10, 30], 0.34);
  speckle(ctx, size, rng, ['#5f5238', '#c9ba90', '#77683f', '#3f3728'], 1400, 1.8);
  // 바큇자국 — 가로로 흐릿한 줄
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = '#6d5f43';
  ctx.lineWidth = 5;
  for (let i = 0; i < 5; i += 1) {
    const y = rng() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + 8, size * 0.6, y - 8, size, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finish(canvas, 1, key);
}

/** 잔디 — 여러 겹의 초록과 풀잎 결 */
export function grassTexture(): THREE.Texture {
  const key = 'grass';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(419);
  ctx.fillStyle = '#5f8340';
  ctx.fillRect(0, 0, size, size);
  splotches(ctx, size, rng, ['#6f9149', '#54763a', '#7da356', '#4c6b34'], 44, [16, 46], 0.5);
  // 풀잎 — 짧은 선을 촘촘히
  for (let i = 0; i < 2600; i += 1) {
    const x = rng() * size;
    const y = rng() * size;
    const len = 2 + rng() * 4;
    const tilt = (rng() - 0.5) * 1.6;
    ctx.strokeStyle = ['#7fa85a', '#4f7034', '#8cb662', '#456129'][Math.floor(rng() * 4)];
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + tilt, y - len);
    ctx.stroke();
  }
  return finish(canvas, 1, key);
}

/** 돌바닥 — 크기가 제각각인 판석 */
export function stoneTexture(): THREE.Texture {
  const key = 'stone';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(777);
  ctx.fillStyle = '#6f6a60';
  ctx.fillRect(0, 0, size, size);
  const cell = 32;
  for (let gy = 0; gy < size / cell; gy += 1) {
    const offset = gy % 2 === 0 ? 0 : cell / 2;
    for (let gx = -1; gx < size / cell + 1; gx += 1) {
      const x = gx * cell + offset + 1.4;
      const y = gy * cell + 1.4;
      const w = cell - 2.8 - rng() * 2;
      const h = cell - 2.8 - rng() * 2;
      const tone = 150 + Math.floor(rng() * 40);
      ctx.fillStyle = `rgb(${tone}, ${tone - 6}, ${tone - 18})`;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 3);
      ctx.fill();
      // 돌 표면의 얼룩
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = rng() > 0.5 ? '#ffffff' : '#000000';
      ctx.beginPath();
      ctx.arc(x + w * rng(), y + h * rng(), 3 + rng() * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  speckle(ctx, size, rng, ['#5c574e', '#8e887c'], 500, 1.1);
  return finish(canvas, 1, key);
}

/** 포장도로 — 큰 판을 줄 맞춰 깐 근대 도로 */
export function pavementTexture(): THREE.Texture {
  const key = 'pavement';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(313);
  ctx.fillStyle = '#5f5a52';
  ctx.fillRect(0, 0, size, size);
  const cw = 64;
  const ch = 32;
  for (let gy = 0; gy < size / ch; gy += 1) {
    const offset = gy % 2 === 0 ? 0 : cw / 2;
    for (let gx = -1; gx < size / cw + 1; gx += 1) {
      const x = gx * cw + offset + 1.6;
      const y = gy * ch + 1.6;
      const tone = 134 + Math.floor(rng() * 26);
      ctx.fillStyle = `rgb(${tone}, ${tone - 3}, ${tone - 11})`;
      ctx.fillRect(x, y, cw - 3.2, ch - 3.2);
    }
  }
  splotches(ctx, size, rng, ['#4a463f', '#9a948a'], 18, [14, 40], 0.16);
  speckle(ctx, size, rng, ['#4d4941', '#85806f'], 420, 1);
  return finish(canvas, 1, key);
}

/** 실내 마루 — 나무 널 */
export function floorTexture(): THREE.Texture {
  const key = 'floor';
  const hit = cache.get(key);
  if (hit) return hit;
  return woodPlanks('floor', '#a07c4e', 7);
}

/** 물 — 잔물결 (셰이더 없이 텍스처로 처리하고, 메시는 천천히 흔든다) */
export function waterTexture(): THREE.Texture {
  const key = 'water';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(88);
  ctx.fillStyle = '#3a6580';
  ctx.fillRect(0, 0, size, size);
  splotches(ctx, size, rng, ['#2f5670', '#4a7994', '#27495f'], 30, [20, 60], 0.5);
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = '#a9cede';
  for (let i = 0; i < 90; i += 1) {
    const y = rng() * size;
    const x = rng() * size;
    const w = 8 + rng() * 26;
    ctx.lineWidth = 0.8 + rng();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w / 2, y - 2 - rng() * 2, x + w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finish(canvas, 1, key);
}

/* ───────────────────────── 건축 재료 ───────────────────────── */

/** 기와 — 반원통이 줄지어 겹친 지붕. 이 결이 있어야 동아시아 지붕처럼 보인다. */
export function roofTileTexture(base = '#4a5058'): THREE.Texture {
  const key = `roof:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(2020);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const rows = 8;
  const rowH = size / rows;
  for (let r = 0; r < rows; r += 1) {
    const y = r * rowH;
    // 암키와 골
    ctx.fillStyle = 'rgba(0,0,0,0.26)';
    ctx.fillRect(0, y, size, rowH * 0.22);
    // 수키와 — 가로로 늘어선 반원통
    const cols = 16;
    const colW = size / cols;
    for (let c = 0; c < cols; c += 1) {
      const x = c * colW;
      const gradient = ctx.createLinearGradient(x, 0, x + colW, 0);
      gradient.addColorStop(0, 'rgba(0,0,0,0.30)');
      gradient.addColorStop(0.42, 'rgba(255,255,255,0.13)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.30)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y + rowH * 0.22, colW, rowH * 0.78);
    }
    // 기와 끝의 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, y + rowH * 0.9, size, rowH * 0.1);
  }
  speckle(ctx, size, rng, ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.16)'], 500, 1.4);
  return finish(canvas, 1, key);
}

/** 벽돌 — 상하이 석고문 주택의 회색 벽돌 */
export function brickTexture(base = '#8f8a80'): THREE.Texture {
  const key = `brick:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(555);
  ctx.fillStyle = '#6c665d';
  ctx.fillRect(0, 0, size, size);
  const bw = 48;
  const bh = 16;
  const baseColor = new THREE.Color(base);
  for (let gy = 0; gy < size / bh; gy += 1) {
    const offset = gy % 2 === 0 ? 0 : bw / 2;
    for (let gx = -1; gx < size / bw + 1; gx += 1) {
      const x = gx * bw + offset + 1.4;
      const y = gy * bh + 1.4;
      // 벽돌마다 밝기를 크게 흩어야 멀리서도 벽돌로 보인다
      const jitter = 0.78 + rng() * 0.42;
      const c = baseColor.clone().multiplyScalar(jitter);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, bw - 2.8, bh - 2.8);
    }
  }
  splotches(ctx, size, rng, ['#ffffff', '#3a352e'], 16, [16, 44], 0.1);
  return finish(canvas, 1, key);
}

/** 회벽 — 먼지와 물때가 얼룩진 흰 벽 */
export function plasterTexture(base = '#d9d2c2'): THREE.Texture {
  const key = `plaster:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(1234);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  splotches(ctx, size, rng, ['#ffffff', '#b9b1a0', '#c9c0ad'], 30, [20, 60], 0.3);
  // 아래로 흘러내린 물때
  ctx.globalAlpha = 0.09;
  ctx.strokeStyle = '#6f6757';
  for (let i = 0; i < 26; i += 1) {
    const x = rng() * size;
    ctx.lineWidth = 1 + rng() * 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rng() - 0.5) * 6, size * (0.3 + rng() * 0.7));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, rng, ['rgba(0,0,0,0.05)'], 300, 1.2);
  return finish(canvas, 1, key);
}

/**
 * 실내 벽 — 2탄에서 더했다.
 * 1인칭으로 코앞에서 보면 회벽의 큰 얼룩이 지저분해 보인다.
 * 아주 고운 결과 은은한 세로 줄(1920년대 벽지 느낌)만 남긴 차분한 벽이다.
 */
export function interiorWallTexture(base = '#e6dccb'): THREE.Texture {
  const key = `iwall:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(4321);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  // 은은한 세로 줄무늬
  ctx.globalAlpha = 0.05;
  for (let x = 0; x < size; x += 16) {
    ctx.fillStyle = x % 32 === 0 ? '#ffffff' : '#8a7f6c';
    ctx.fillRect(x, 0, 6, size);
  }
  ctx.globalAlpha = 1;
  splotches(ctx, size, rng, ['#ffffff', '#cfc5b2'], 10, [40, 90], 0.08);
  speckle(ctx, size, rng, ['rgba(60,50,40,0.05)', 'rgba(255,255,255,0.08)'], 900, 0.9);
  return finish(canvas, 1, key);
}

/** 나무 판자 — 기둥·마루·난간 */
export function woodPlanks(key: string, base = '#8c7454', planks = 6): THREE.Texture {
  const cacheKey = `wood:${key}:${base}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(31337);
  const baseColor = new THREE.Color(base);
  const h = size / planks;
  for (let i = 0; i < planks; i += 1) {
    const jitter = 0.84 + rng() * 0.3;
    const c = baseColor.clone().multiplyScalar(jitter);
    ctx.fillStyle = `#${c.getHexString()}`;
    ctx.fillRect(0, i * h, size, h);
    // 나뭇결
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#000000';
    for (let g = 0; g < 9; g += 1) {
      const y = i * h + rng() * h;
      ctx.lineWidth = 0.6 + rng();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + (rng() - 0.5) * 4, size * 0.7, y + (rng() - 0.5) * 4, size, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // 판자 사이 틈
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.fillRect(0, i * h, size, 1.6);
  }
  return finish(canvas, 1, cacheKey);
}

/** 절단된 돌 — 서양식 관청의 석재 */
export function ashlarTexture(base = '#c6c2bb'): THREE.Texture {
  const key = `ashlar:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(909);
  ctx.fillStyle = '#9a958c';
  ctx.fillRect(0, 0, size, size);
  const bw = 64;
  const bh = 32;
  const baseColor = new THREE.Color(base);
  for (let gy = 0; gy < size / bh; gy += 1) {
    const offset = gy % 2 === 0 ? 0 : bw / 2;
    for (let gx = -1; gx < size / bw + 1; gx += 1) {
      const x = gx * bw + offset + 1.5;
      const y = gy * bh + 1.5;
      const c = baseColor.clone().multiplyScalar(0.9 + rng() * 0.2);
      ctx.fillStyle = `#${c.getHexString()}`;
      ctx.fillRect(x, y, bw - 3, bh - 3);
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, bw - 3, 3);
      ctx.globalAlpha = 1;
    }
  }
  speckle(ctx, size, rng, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.08)'], 400, 1.4);
  return finish(canvas, 1, key);
}

/** 캔버스 천 — 천막 */
export function canvasClothTexture(base = '#c9c2ad'): THREE.Texture {
  const key = `cloth:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(246);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < size; i += 3) {
    ctx.fillStyle = i % 6 === 0 ? '#000000' : '#ffffff';
    ctx.fillRect(i, 0, 1.4, size);
    ctx.fillRect(0, i, size, 1.4);
  }
  ctx.globalAlpha = 1;
  splotches(ctx, size, rng, ['#a89d85', '#e2dac6'], 14, [10, 30], 0.24);
  return finish(canvas, 1, key);
}

/** 나뭇잎 덩어리 — 수관에 입혀 뭉개진 단색을 피한다 */
export function foliageTexture(base = '#4f6b3a'): THREE.Texture {
  const key = `foliage:${base}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 256;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(6060);
  const baseColor = new THREE.Color(base);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i += 1) {
    const c = baseColor.clone().multiplyScalar(0.62 + rng() * 0.78);
    ctx.fillStyle = `#${c.getHexString()}`;
    const x = rng() * size;
    const y = rng() * size;
    const r = 3 + rng() * 9;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.55 + rng() * 0.5), rng() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(canvas, 1, key);
}

/** 풀 술 — 알파가 있는 십자 평면용 */
export function grassTuftTexture(): THREE.Texture {
  const key = 'tuft';
  const hit = cache.get(key);
  if (hit) return hit;
  const size = 128;
  const [canvas, ctx] = makeCanvas(size);
  const rng = makeRng(4242);
  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 26; i += 1) {
    const x = 18 + rng() * (size - 36);
    const len = size * (0.4 + rng() * 0.55);
    const tilt = (rng() - 0.5) * 34;
    const grad = ctx.createLinearGradient(x, size, x + tilt, size - len);
    grad.addColorStop(0, '#3f5c2c');
    grad.addColorStop(1, '#8fb45f');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2 + rng() * 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, size);
    ctx.quadraticCurveTo(x + tilt * 0.4, size - len * 0.55, x + tilt, size - len);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

/** 벚꽃 덩어리 */
export function blossomTexture(): THREE.Texture {
  return foliageTexture('#e8b6c6');
}

/** 만들어 둔 텍스처를 모두 해제한다 */
export function disposeTextures(): void {
  cache.forEach((t) => t.dispose());
  cache.clear();
}
