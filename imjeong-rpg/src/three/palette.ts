import * as THREE from 'three';

/**
 * 공용 재질·색.
 *
 * 거상의 화면은 채도가 낮고 따뜻한 흙빛이 바탕이다. 여기서도 원색을 피하고
 * 흙·기와·나무·회벽의 색조로 맞춰, 3D 로 만들어도 옛 그림처럼 보이게 한다.
 */

/** 재질을 색마다 한 번만 만들어 재사용한다 (드로우콜·메모리 절약) */
const lambertCache = new Map<string, THREE.MeshLambertMaterial>();

export function lambert(color: string, opts?: { flat?: boolean; transparent?: boolean; opacity?: number }): THREE.MeshLambertMaterial {
  const key = `${color}|${opts?.flat ?? true}|${opts?.opacity ?? 1}`;
  const cached = lambertCache.get(key);
  if (cached) return cached;
  const material = new THREE.MeshLambertMaterial({
    color: new THREE.Color(color),
    flatShading: opts?.flat ?? true,
    transparent: opts?.transparent ?? (opts?.opacity ?? 1) < 1,
    opacity: opts?.opacity ?? 1,
  });
  lambertCache.set(key, material);
  return material;
}

/** 캐시된 재질을 모두 해제한다 (맵 전환·언마운트 시) */
export function disposePalette(): void {
  lambertCache.forEach((m) => m.dispose());
  lambertCache.clear();
}

/** 색을 조금 어둡게/밝게 */
export function shade(color: string, amount: number): string {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amount)));
  return `#${c.getHexString()}`;
}

export const COLORS = {
  roofTile: '#4a5058',
  roofTileWarm: '#5a5147',
  woodBeam: '#6b5741',
  woodLight: '#8c7454',
  plaster: '#d9d2c2',
  stone: '#b9b4a8',
  brickGrey: '#8f8a80',
  redLacquer: '#8d3b3b',
  taegeukRed: '#cd2e3a',
  taegeukBlue: '#0047a0',
  leaf: '#4f6b3a',
  leafWarm: '#6b7a3e',
  pine: '#3f5a38',
  trunk: '#5a4632',
  canvasTent: '#c9c2ad',
  metal: '#6d7278',
  lampGlow: '#e8c98a',
} as const;

/**
 * 태극기 텍스처를 캔버스로 그린다.
 *
 * ⚠ 이 도안은 오늘날의 대한민국 국기 제작법을 단순화한 것이다.
 *   임시정부 시기의 태극기는 4괘의 배치와 태극의 형태가 지금과 다른 실물이
 *   여럿 남아 있으므로, 수업에서 「당시 태극기가 이렇게 생겼다」고 단정하지 말 것.
 */
export function taegeukTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = Math.round(size * (2 / 3));
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const r = h / 4;

  // 태극 — 위쪽 붉은색, 아래쪽 푸른색이 S 곡선으로 맞물린다.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = COLORS.taegeukRed;
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.arc(r / 2, 0, r / 2, 0, Math.PI, true);
  ctx.arc(-r / 2, 0, r / 2, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = COLORS.taegeukBlue;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.arc(-r / 2, 0, r / 2, Math.PI, 0, true);
  ctx.arc(r / 2, 0, r / 2, Math.PI, 0);
  ctx.fill();
  ctx.restore();

  // 4괘 — 깃대 쪽 위부터 시계 반대 방향으로 건(乾)·리(離)·곤(坤)·감(坎)
  // true = 이어진 막대, false = 끊어진 막대
  const trigrams: Array<{ dx: number; dy: number; rot: number; bars: boolean[] }> = [
    { dx: -1, dy: -1, rot: Math.PI / 4 + Math.PI / 2, bars: [true, true, true] }, // 건 ☰
    { dx: -1, dy: 1, rot: -Math.PI / 4 - Math.PI / 2, bars: [true, false, true] }, // 리 ☲
    { dx: 1, dy: 1, rot: Math.PI / 4 + Math.PI / 2, bars: [false, false, false] }, // 곤 ☷
    { dx: 1, dy: -1, rot: -Math.PI / 4 - Math.PI / 2, bars: [false, true, false] }, // 감 ☵
  ];
  const barW = r * 1.5;
  const barH = r * 0.22;
  const gap = r * 0.12;
  ctx.fillStyle = '#111111';
  for (const t of trigrams) {
    ctx.save();
    ctx.translate(cx + t.dx * r * 2.1, cy + t.dy * r * 1.25);
    ctx.rotate(t.rot);
    t.bars.forEach((solid, i) => {
      const y = (i - 1) * (barH + gap) - barH / 2;
      if (solid) {
        ctx.fillRect(-barW / 2, y, barW, barH);
      } else {
        const half = barW / 2 - gap / 2;
        ctx.fillRect(-barW / 2, y, half, barH);
        ctx.fillRect(gap / 2, y, half, barH);
      }
    });
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
