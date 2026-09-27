#!/usr/bin/env node
// front matter 값 안전하게 바꾸기 (YAML 직접 편집 실수 방지) — 에이전트·명령이 상태·검수 점수·승인을 기록할 때 쓴다.
//   node scripts/meta.js <글.md> key=value [key.sub=value ...]
//   예) node scripts/meta.js posts/2026-09-28/01-x.md status=reviewed review.score=86 "review.notes=도입 보강함" review.at=2026-09-28
//   값은 JSON 으로 해석 가능하면 JSON(true, 86, ["a"]), 아니면 문자열.
//   node scripts/meta.js <글.md> --get key     값 읽기

const { loadPost, updateMeta, parseArgs } = require('./lib/core');

const { pos, opt } = parseArgs(process.argv.slice(2));
const [file, ...pairs] = pos;
if (!file) {
  console.error('사용법: node scripts/meta.js <글.md> key=value ...');
  process.exit(1);
}
try {
  const post = loadPost(file);
  if (opt.get) {
    const v = String(opt.get).split('.').reduce((o, k) => (o == null ? o : o[k]), post.meta);
    console.log(typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v));
    process.exit(0);
  }
  const meta = JSON.parse(JSON.stringify(post.meta));
  for (const pair of pairs) {
    const i = pair.indexOf('=');
    if (i < 1) throw new Error(`key=value 형식이 아닙니다: ${pair}`);
    const keys = pair.slice(0, i).split('.');
    let val = pair.slice(i + 1);
    try {
      val = JSON.parse(val);
    } catch {}
    if (keys[0] === 'approved' && val === true && meta.status === 'held') throw new Error('보류(held) 글은 승인할 수 없습니다.');
    let o = meta;
    keys.slice(0, -1).forEach((k) => (o = o[k] = o[k] && typeof o[k] === 'object' ? o[k] : {}));
    o[keys[keys.length - 1]] = val;
  }
  updateMeta(post.file, meta);
  console.log(`✅ ${post.rel}: ${pairs.join(' ')}`);
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
