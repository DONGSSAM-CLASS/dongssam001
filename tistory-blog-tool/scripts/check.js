#!/usr/bin/env node
// 품질 게이트 실행 (브라우저 없이). 검수 보고에 이 결과를 그대로 포함한다.
// 사용: node scripts/check.js [날짜|글.md ...] [--json] [--quiet]
//   인자 없으면 오늘 날짜 폴더 전체. 날짜를 주면 그날 묶음 점검(하루 한도·다양성)도 함께.
// 종료 코드: 오류가 하나라도 있으면 1

const { loadConfig, loadPost, loadAllPosts, loadExisting, parseArgs, resolveTargets, today } = require('./lib/core');
const { checkPost, checkBatch } = require('./lib/checks');

function main() {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const allPosts = loadAllPosts();
  const existing = loadExisting();
  const files = resolveTargets(pos);
  if (!files.length) {
    console.error(`점검할 글이 없습니다 (${pos.join(' ') || today()}).`);
    process.exit(1);
  }
  const results = [];
  let errorCount = 0;
  for (const f of files) {
    let post;
    try {
      post = loadPost(f);
    } catch (e) {
      results.push({ file: f, errors: [e.message], warnings: [], info: [], stats: {} });
      errorCount++;
      continue;
    }
    const r = checkPost(post, { config, allPosts, existing });
    errorCount += r.errors.length;
    results.push({ file: post.rel, title: post.meta.title, errors: r.errors, warnings: r.warnings, info: r.info, stats: r.stats });
  }
  const dates = [...new Set(pos.filter((p) => /^\d{4}-\d{2}-\d{2}$/.test(p)))];
  if (!pos.length) dates.push(today());
  const batches = dates.map((d) => ({ date: d, ...checkBatch(loadAllPosts({ date: d }), config) }));
  batches.forEach((b) => (errorCount += b.errors.length));

  if (opt.json) {
    console.log(JSON.stringify({ results, batches, errorCount }, null, 2));
    process.exit(errorCount ? 1 : 0);
  }
  for (const r of results) {
    const s = r.stats || {};
    console.log(`\n===== ${r.file} =====`);
    if (r.title) console.log(`제목: ${r.title} (${r.title.length}자)`);
    if (s.chars != null) {
      const kw = s.keyword ? ` · 키워드 "${s.keyword.keyword}" ${s.keyword.count}회(${s.keyword.density}%)` : '';
      console.log(`본문 ${s.chars}자 · 소제목 ${s.h2} · 사진 ${s.images} · 표 ${s.tables} · 상자 ${s.callouts}${kw}`);
      console.log(`최대 유사도 ${s.maxSimilarity ? `${s.maxSimilarity.score}${s.maxSimilarity.with ? ` (${s.maxSimilarity.with})` : ''}` : '-'} · AI 상투어 ${s.aiPhrases} · 링크 외부 ${s.links ? s.links.external : 0}/내부 ${s.links ? s.links.internal : 0}${s.facts ? ` · 사실 검증 ${s.facts.verified}/${s.facts.total} · 미등록 숫자 ${s.numbers.unregistered}` : ''} · 게이트 점수 ${s.gateScore ?? '-'}`);
    }
    if (!opt.quiet) {
      r.errors.forEach((m) => console.log(`  ❌ ${m}`));
      r.warnings.forEach((m) => console.log(`  ⚠️ ${m}`));
      r.info.forEach((m) => console.log(`  ℹ️ ${m}`));
    } else console.log(`  ❌ ${r.errors.length} · ⚠️ ${r.warnings.length}`);
    console.log(r.errors.length ? '  → 수정 필요' : r.warnings.length ? '  → 통과(경고 있음)' : '  → 통과');
  }
  for (const b of batches) {
    console.log(`\n===== ${b.date} 묶음 점검: ${b.count}/${b.quota}개 =====`);
    b.errors.forEach((m) => console.log(`  ❌ ${m}`));
    b.warnings.forEach((m) => console.log(`  ⚠️ ${m}`));
    if (!b.errors.length && !b.warnings.length) console.log('  → 통과');
  }
  console.log(errorCount ? `\n결과: 오류 ${errorCount}개 — 업로드 불가` : '\n결과: 오류 없음');
  process.exit(errorCount ? 1 : 0);
}

try {
  main();
} catch (e) {
  console.error(`❌ ${e.stack || e.message}`);
  process.exit(1);
}

