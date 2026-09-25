#!/usr/bin/env node
// 사진 개인정보 모자이크 — 원본은 절대 덮어쓰지 않고 input/photos/_mosaic/ 에 처리본을 만든다.
//
// 사용: node scripts/mosaic.js drafts/<이름>.mosaic.json
//
// spec 형식 (좌표는 EXIF 회전 보정 후 "보이는 화면" 기준 0~1 상대값, 상하좌우 15% 여유를 포함해서 적는다):
// {
//   "items": [
//     { "file": "input/photos/03.jpg",
//       "regions": [ { "x": 0.62, "y": 0.18, "w": 0.14, "h": 0.2, "reason": "학생 얼굴" } ] }
//   ],
//   "blockRatio": 0.1      // (선택) 모자이크 칸 크기 = 영역 긴 변 × 비율. 기본 0.1 (최소 12px)
// }
//
// 구현 함정(실측):
//  1) 좌표는 반드시 EXIF 회전 보정 후 기준 → sharp().rotate() 로 먼저 회전을 픽셀에 굽고 그 크기로 계산한다.
//  2) sharp 는 한 파이프라인에 resize 가 1회만 적용된다 → 축소 → 버퍼 → 확대(nearest) 를 2단계로 분리한다.
// 처리본은 메타데이터(EXIF·GPS)를 제거한 채 저장된다.

const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib/naver');

function loadSharp() {
  try {
    return require('sharp');
  } catch (e) {
    throw new Error('sharp 가 설치되지 않았습니다. 먼저 `npm install` 을 실행하세요.');
  }
}

const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const clamp01 = (v) => Math.min(1, Math.max(0, Number(v) || 0));

async function mosaicOne(sharp, item, blockRatio) {
  const src = abs(item.file);
  if (!fs.existsSync(src)) throw new Error(`사진이 없습니다: ${item.file}`);
  const outDir = path.join(path.dirname(src), '_mosaic');
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, path.basename(src));
  if (path.resolve(out) === path.resolve(src)) throw new Error('원본 덮어쓰기 방지: 출력 경로가 원본과 같습니다.');

  // 1) EXIF 회전 보정을 픽셀에 굽는다 → 이후 좌표는 "보이는 화면" 기준
  const { data: rotated, info } = await sharp(src).rotate().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  const composites = [];
  for (const r of item.regions || []) {
    const x0 = clamp01(r.x);
    const y0 = clamp01(r.y);
    const x1 = clamp01(x0 + (Number(r.w) || 0));
    const y1 = clamp01(y0 + (Number(r.h) || 0));
    const left = Math.floor(x0 * W);
    const top = Math.floor(y0 * H);
    const width = Math.max(1, Math.min(W - left, Math.ceil((x1 - x0) * W)));
    const height = Math.max(1, Math.min(H - top, Math.ceil((y1 - y0) * H)));
    if (width < 2 || height < 2) continue;

    const cell = Math.max(12, Math.round(Math.max(width, height) * blockRatio));
    const smallW = Math.max(1, Math.round(width / cell));
    const smallH = Math.max(1, Math.round(height / cell));
    // 2) 축소 → 버퍼 (1단계)
    const small = await sharp(rotated).extract({ left, top, width, height }).resize(smallW, smallH, { fit: 'fill' }).toBuffer();
    // 3) 확대(nearest) → 버퍼 (2단계)
    const pixelated = await sharp(small).resize(width, height, { fit: 'fill', kernel: 'nearest' }).toBuffer();
    composites.push({ input: pixelated, left, top });
  }

  let pipeline = sharp(rotated).composite(composites);
  const ext = path.extname(src).toLowerCase();
  if (ext === '.png') pipeline = pipeline.png();
  else if (ext === '.webp') pipeline = pipeline.webp({ quality: 90 });
  else pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
  await pipeline.toFile(out); // withMetadata() 를 쓰지 않으므로 EXIF·GPS 제거됨
  return { out, regions: composites.length, width: W, height: H };
}

async function main() {
  const specPath = process.argv[2];
  if (!specPath) {
    console.error('사용법: node scripts/mosaic.js <spec.json>');
    process.exit(1);
  }
  const sharp = loadSharp();
  const spec = JSON.parse(fs.readFileSync(abs(specPath), 'utf8'));
  const blockRatio = Number(spec.blockRatio) > 0 ? Number(spec.blockRatio) : 0.1;
  const items = spec.items || [];
  if (!items.length) throw new Error('spec.items 가 비어 있습니다.');

  let total = 0;
  for (const item of items) {
    const r = await mosaicOne(sharp, item, blockRatio);
    total += r.regions;
    const reasons = (item.regions || []).map((x) => x.reason).filter(Boolean).join(', ');
    console.log(`✓ ${item.file} → ${path.relative(ROOT, r.out)} (${r.regions}개 영역${reasons ? `: ${reasons}` : ''}, ${r.width}×${r.height})`);
  }
  console.log(`\n모자이크 완료: 사진 ${items.length}장 · 영역 ${total}개`);
  console.log('👉 처리본을 Read 로 열어 실제로 가려졌는지 반드시 확인하고, 덜 가려졌으면 좌표를 키워 재실행하세요.');
  console.log('👉 초안에는 처리본 경로(input/photos/_mosaic/...)를 사용하세요.');
}

main().catch((e) => {
  console.error(`❌ ${e.message}`);
  process.exit(1);
});
