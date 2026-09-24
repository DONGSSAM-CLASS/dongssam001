// SUPERSTAR KART — GPT Image 에셋 일괄 생성 스크립트
// 사용법:
//   cd tools && npm install
//   export OPENAI_API_KEY=sk-...
//   node generate-images.mjs                 # 없는 파일만 전부 생성
//   node generate-images.mjs --only char_sejong   # id 접두어로 골라서 생성
//   node generate-images.mjs --force --only tex_  # 이미 있어도 다시 생성
//   node generate-images.mjs --dry           # 무엇을 만들지 목록만 출력
// 주의: 모델 이름·파라미터는 사용 중인 OpenAI API 문서와 맞는지 먼저 확인하세요.
import OpenAI, { toFile } from 'openai';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(await fs.readFile(path.join(ROOT, 'assets/prompts.json'), 'utf8'));
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : '';
const force = args.includes('--force'), dry = args.includes('--dry');
const model = process.env.IMAGE_MODEL || spec.model;
const client = dry ? null : new OpenAI();

// 같은 캐릭터의 초상화가 있으면 참조 이미지로 넣어 얼굴·의상을 일정하게 유지한다
function refFor(item) {
  const m = item.id.match(/^char_(\w+?)_(fullbody|turnaround|driving)$/);
  if (!m) return null;
  const p = path.join(ROOT, `assets/ui/portraits/${m[1]}.png`);
  return existsSync(p) ? p : null;
}

let made = 0, skipped = 0, failed = 0;
for (const item of spec.items) {
  if (only && !item.id.startsWith(only)) continue;
  const out = path.join(ROOT, item.file);
  if (existsSync(out) && !force) { skipped++; continue; }
  const ref = refFor(item);
  console.log(`${dry ? '[dry] ' : ''}${item.id} -> ${item.file}${ref ? ' (ref: portrait)' : ''}`);
  if (dry) continue;
  try {
    const params = { model, prompt: item.prompt, size: item.size, quality: 'high', background: item.background };
    const res = ref
      ? await client.images.edit({ ...params, image: await toFile(await fs.readFile(ref), 'ref.png', { type: 'image/png' }) })
      : await client.images.generate(params);
    const b64 = res.data[0].b64_json;
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, Buffer.from(b64, 'base64'));
    made++;
  } catch (e) {
    failed++;
    console.error(`  실패: ${item.id} — ${e.message}`);
  }
}
console.log(`완료: 생성 ${made}, 건너뜀 ${skipped}, 실패 ${failed}`);
