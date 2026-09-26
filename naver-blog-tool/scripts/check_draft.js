#!/usr/bin/env node
// 초안 JSON 자동 점검 (브라우저 없이 실행) — /write 검수 보고에 이 결과를 그대로 포함한다.
// 사용: node scripts/check_draft.js drafts/20260925-example.json [--no-files]

const { loadDraft, checkDraft } = require('./lib/draft');

function main() {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('사용법: node scripts/check_draft.js <초안.json> [--no-files]');
    process.exit(1);
  }
  const draft = loadDraft(file);
  const { errors, warnings, info, stats } = checkDraft(draft, { requireFiles: !args.includes('--no-files') });

  console.log(`\n===== 초안 점검: ${file} =====`);
  console.log(`제목: ${draft.title} (${String(draft.title || '').length}자)`);
  if (stats.mainKeyword) {
    const m = stats.mainKeyword;
    console.log(`메인 키워드 "${m.keyword}": 본문 ${m.looseInBody}회 (띄어쓰기 동일 ${m.exactInBody}회)`);
  }
  if (stats.chars) console.log(`본문 글자 수: 공백 제외 ${stats.chars.noSpace}자 / 공백 포함 ${stats.chars.withSpace}자`);
  console.log(`사진 ${stats.images ?? 0}장 · 인용구 ${stats.quotes ?? 0}개 · 소제목 ${stats.subtitles ?? 0}개 · 최대 텍스트 연속 ${stats.maxTextRun ?? 0}자`);
  if (stats.captions) console.log(`캡션 ${stats.captions.captioned}개 (키워드 포함 ${stats.captions.withKeyword}개)`);
  if (stats.facts) console.log(`사실 검증 ${stats.facts.verified}/${stats.facts.total}건 · 본문 숫자 ${stats.numbers.total}개 (미등록 ${stats.numbers.unregistered}개) · 기준일 ${draft.basisDate || '없음'}`);
  if (draft.shotList && draft.shotList.length) console.log(`캡처 목록(shotList) ${draft.shotList.length}장 — 사용자가 준비해야 함`);
  console.log(`태그 ${(draft.tags || []).length}개 · 지도 ${draft.place ? '있음' : '없음'} · 동영상 ${draft.video ? '있음' : '없음'} · 협찬 ${draft.sponsored === true ? '예' : draft.sponsored === false ? '아니오' : '미정'}`);

  const print = (label, arr) => {
    if (!arr.length) return;
    console.log(`\n${label}`);
    arr.forEach((m) => console.log(`  - ${m}`));
  };
  print('❌ 오류 (반드시 수정):', errors);
  print('⚠️ 경고 (공식 기준 미달):', warnings);
  print('ℹ️ 참고:', info);
  console.log(errors.length ? '\n결과: 수정 필요' : warnings.length ? '\n결과: 통과(경고 있음)' : '\n결과: 통과');
  process.exit(errors.length ? 1 : 0);
}

try {
  main();
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
