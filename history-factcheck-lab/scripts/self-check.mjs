#!/usr/bin/env node
/**
 * 순수 로직 자체 점검 (의존성 없이 node로 바로 실행).
 *   npm run check
 *
 * 브라우저 UI 없이도 채점기·저장 코드·케이스 데이터가 규칙대로 동작하는지 확인한다.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { gradeCitation, composeFromTarget, FIELD_ORDER } from '../src/lib/apa.js';
import { exportCode, importCode, checksum6, emptyProgress } from '../src/lib/storage.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'src', 'data');

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    const problem = fn();
    if (problem) failures.push(`${name}: ${problem}`);
    else passed += 1;
  } catch (err) {
    failures.push(`${name}: 예외 — ${err.message}`);
  }
}

/* ---------- APA 채점기 ---------- */

const TARGET = {
  author: '국사편찬위원회',
  year: 'n.d.',
  title: '발해의 건국',
  container: '우리역사넷',
  url: 'https://contents.history.go.kr/front/hm/view.do?levelId=hm_030_0010',
};

const PERFECT = {
  author: '국사편찬위원회.',
  year: '(n.d.).',
  title: '발해의 건국.',
  container: '우리역사넷.',
  url: 'https://contents.history.go.kr/front/hm/view.do?levelId=hm_030_0010',
};

check('완벽한 입력은 100점', () => {
  const r = gradeCitation(PERFECT, TARGET);
  return r.total === 100 ? null : `${r.total}점이 나옴`;
});

check('빈 입력은 0점', () => {
  const r = gradeCitation({ author: '', year: '', title: '', container: '', url: '' }, TARGET);
  return r.total === 0 ? null : `${r.total}점이 나옴`;
});

check('연도 괄호 누락은 5점 감점 + 안내 문구', () => {
  const r = gradeCitation({ ...PERFECT, year: 'n.d.' }, TARGET);
  if (r.total !== 95) return `${r.total}점이 나옴 (95점이어야 함)`;
  return r.perField.year.punctuation.message?.includes('괄호')
    ? null
    : '괄호 안내 문구가 없음';
});

check('URL 끝 마침표는 5점 감점 + 안내 문구', () => {
  const r = gradeCitation({ ...PERFECT, url: `${TARGET.url}.` }, TARGET);
  if (r.total !== 95) return `${r.total}점이 나옴 (95점이어야 함)`;
  return r.perField.url.punctuation.message?.includes('마침표') ? null : '마침표 안내 문구가 없음';
});

check('항목 뒤 마침표 누락은 5점 감점', () => {
  const r = gradeCitation({ ...PERFECT, title: '발해의 건국' }, TARGET);
  return r.total === 95 ? null : `${r.total}점이 나옴 (95점이어야 함)`;
});

check('URL 도메인만 맞으면 부분 점수', () => {
  const r = gradeCitation(
    { ...PERFECT, url: 'https://contents.history.go.kr/front/hm/view.do?levelId=WRONG' },
    TARGET,
  );
  const pts = r.perField.url.points;
  return pts > 0 && pts < 20 ? null : `URL 점수가 ${pts}`;
});

check('완전히 틀린 URL은 0점', () => {
  const r = gradeCitation({ ...PERFECT, url: 'https://example.com/whatever' }, TARGET);
  return r.perField.url.points === 0 ? null : `URL 점수가 ${r.perField.url.points}`;
});

check('각 항목 만점은 20점, 합계 상한은 100점', () => {
  const r = gradeCitation(PERFECT, TARGET);
  const bad = FIELD_ORDER.filter((k) => r.perField[k].points > 20);
  return bad.length === 0 && r.total <= 100 ? null : `상한 초과: ${bad.join(', ')}`;
});

check('점수는 음수가 되지 않는다', () => {
  const r = gradeCitation(
    { author: 'x', year: 'y', title: 'z', container: 'w', url: 'v.' },
    TARGET,
  );
  const negative = FIELD_ORDER.filter((k) => r.perField[k].points < 0);
  return negative.length === 0 ? null : `음수 점수: ${negative.join(', ')}`;
});

check('정답 예시 조합이 양식에 맞는다', () => {
  const composed = composeFromTarget(TARGET);
  return composed === `국사편찬위원회. (n.d.). 발해의 건국. 우리역사넷. ${TARGET.url}`
    ? null
    : `조합 결과: ${composed}`;
});

/* ---------- 이어받기 코드 ---------- */

check('진행 상황 코드 왕복 (한글 포함)', () => {
  const progress = {
    ...emptyProgress(),
    name: '홍길동',
    cases: { 'kr-balhae-ruling-class': { step5: { narrative: '발해는 『구당서』에 따르면…' } } },
  };
  const { code, verifyNumber } = exportCode(progress);
  const back = importCode(code);
  if (!back.ok) return back.message;
  if (back.progress.name !== '홍길동') return '이름이 보존되지 않음';
  if (back.progress.cases['kr-balhae-ruling-class'].step5.narrative !== '발해는 『구당서』에 따르면…')
    return '서사가 보존되지 않음';
  return back.verifyNumber === verifyNumber ? null : '확인 번호가 일치하지 않음';
});

check('6자리 숫자만 넣으면 안내 문구를 돌려준다', () => {
  const r = importCode('123456');
  return !r.ok && r.message.includes('6자리') ? null : '안내가 나오지 않음';
});

check('망가진 코드는 조용히 실패한다', () => {
  const r = importCode('%%%not-base64%%%');
  return !r.ok ? null : '실패해야 하는데 성공함';
});

check('확인 번호는 항상 6자리', () => {
  const samples = ['a', '', '가나다라마바사', 'x'.repeat(5000)];
  const bad = samples.filter((s) => !/^\d{6}$/.test(checksum6(s)));
  return bad.length === 0 ? null : `${bad.length}건이 6자리가 아님`;
});

/* ---------- 케이스 데이터 무결성 ---------- */

const caseFiles = readdirSync(DATA).filter((f) => f.startsWith('cases.') && f.endsWith('.json'));
const allCases = caseFiles.flatMap((f) => JSON.parse(readFileSync(join(DATA, f), 'utf8')));

check('케이스 id가 중복되지 않는다', () => {
  const ids = allCases.map((c) => c.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  return dupes.length === 0 ? null : `중복: ${[...new Set(dupes)].join(', ')}`;
});

check('모든 케이스에 비문자 자료가 최소 1건 있다', () => {
  const missing = allCases.filter((c) => !c.sources.some((s) => s.nonText)).map((c) => c.id);
  return missing.length === 0 ? null : missing.join(', ');
});

check('문장의 checkWith가 실제 사료 id를 가리킨다', () => {
  const bad = [];
  allCases.forEach((c) => {
    const ids = new Set(c.sources.map((s) => s.id));
    c.aiResponse.sentences.forEach((s) => {
      (s.checkWith ?? []).forEach((ref) => {
        if (!ids.has(ref)) bad.push(`${c.id} 문장${s.no} → ${ref}`);
      });
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('apaTarget.sourceId가 실제 사료를 가리킨다', () => {
  const bad = allCases
    .filter((c) => !c.sources.some((s) => s.id === c.apaTarget.sourceId))
    .map((c) => c.id);
  return bad.length === 0 ? null : bad.join(', ');
});

check('apaTarget.correctFormat이 components와 어긋나지 않는다', () => {
  const bad = allCases
    .filter((c) => c.apaTarget.correctFormat !== composeFromTarget(c.apaTarget.components))
    .map((c) => `${c.id}\n    적힌 값:   ${c.apaTarget.correctFormat}\n    조합한 값: ${composeFromTarget(c.apaTarget.components)}`);
  return bad.length === 0 ? null : `\n  ${bad.join('\n  ')}`;
});

check('APA 정답을 그대로 입력하면 100점이 나온다', () => {
  const bad = [];
  allCases.forEach((c) => {
    const t = c.apaTarget.components;
    const perfect = {
      author: `${t.author}.`,
      year: /^\(.*\)$/.test(t.year) ? `${t.year}.` : `(${t.year}).`,
      title: `${t.title}.`,
      container: `${t.container}.`,
      url: t.url,
    };
    const r = gradeCitation(perfect, t);
    if (r.total !== 100) bad.push(`${c.id}(${r.total}점)`);
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('워크벤치 3단계가 모두 있고 객관식 2문항 + 단답 1문항 이상이다', () => {
  const bad = [];
  allCases.forEach((c) => {
    ['sourcing', 'contextualization', 'corroboration'].forEach((k) => {
      const stage = c.workbench?.[k];
      if (!stage) return bad.push(`${c.id}.${k} 없음`);
      const choices = stage.questions.filter((q) => q.type === 'choice').length;
      const shorts = stage.questions.filter((q) => q.type === 'short').length;
      if (choices < 2) bad.push(`${c.id}.${k} 객관식 ${choices}문항`);
      if (shorts < 1) bad.push(`${c.id}.${k} 단답 ${shorts}문항`);
      return null;
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('객관식 answerIndex가 보기 범위 안에 있다', () => {
  const bad = [];
  allCases.forEach((c) => {
    ['sourcing', 'contextualization', 'corroboration'].forEach((k) => {
      (c.workbench?.[k]?.questions ?? []).forEach((q) => {
        if (q.type !== 'choice') return;
        if (!Array.isArray(q.options) || q.options.length < 2) bad.push(`${c.id}/${q.id} 보기 부족`);
        else if (!(q.answerIndex >= 0 && q.answerIndex < q.options.length))
          bad.push(`${c.id}/${q.id} answerIndex=${q.answerIndex}`);
      });
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('모든 문항에 힌트와 해설이 있다', () => {
  const bad = [];
  allCases.forEach((c) => {
    ['sourcing', 'contextualization', 'corroboration'].forEach((k) => {
      (c.workbench?.[k]?.questions ?? []).forEach((q) => {
        if (!q.hint?.trim()) bad.push(`${c.id}/${q.id} 힌트 없음`);
        if (!q.explanation?.trim()) bad.push(`${c.id}/${q.id} 해설 없음`);
      });
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('단답형에 채점 키워드가 있고, 모두 2글자 이상이다', () => {
  // 채점기는 1글자 답안을 무효 처리하므로, 1글자 키워드는 영영 맞출 수 없고
  // '당' 같은 한 글자는 '당시'·'당연히'에도 걸려 지나치게 헐겁다.
  const bad = [];
  allCases.forEach((c) => {
    ['sourcing', 'contextualization', 'corroboration'].forEach((k) => {
      (c.workbench?.[k]?.questions ?? []).forEach((q) => {
        if (q.type !== 'short') return;
        if (!(q.acceptKeywords?.length > 0)) return bad.push(`${c.id}/${q.id} 키워드 없음`);
        const tooShort = q.acceptKeywords.filter((kw) => kw.trim().length < 2);
        if (tooShort.length) bad.push(`${c.id}/${q.id} 1글자 키워드 [${tooShort.join(', ')}]`);
        return null;
      });
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('오류를 심은 문장에는 errorType이, 정상 문장에는 없다', () => {
  const bad = [];
  allCases.forEach((c) => {
    c.aiResponse.sentences.forEach((s) => {
      if (s.verdict === 'supported' && s.errorType) bad.push(`${c.id} 문장${s.no}`);
      if ((s.verdict === 'false' || s.verdict === 'disputed') && !s.errorType)
        bad.push(`${c.id} 문장${s.no}`);
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('논쟁적 주제에는 해석이 둘 이상 병기되어 있다', () => {
  const bad = allCases
    .filter((c) => c.contested && !(c.interpretations?.length >= 2))
    .map((c) => c.id);
  return bad.length === 0 ? null : bad.join(', ');
});

check('url이 없는 사료는 수업용 가상 예시로 표시되어 있다', () => {
  const bad = [];
  allCases.forEach((c) => {
    c.sources.forEach((s) => {
      if (!s.url && !s.synthetic) bad.push(`${c.id}/${s.id}`);
      if (s.synthetic && s.url) bad.push(`${c.id}/${s.id} (가상인데 url이 있음)`);
      if (s.synthetic && s.reliability !== 'low') bad.push(`${c.id}/${s.id} (가상인데 신뢰도가 low가 아님)`);
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('모든 사료에 신뢰도 근거와 출처 확인 메모가 있다', () => {
  const bad = [];
  allCases.forEach((c) => {
    c.sources.forEach((s) => {
      if (!s.reliabilityWhy?.trim()) bad.push(`${c.id}/${s.id} 신뢰도 근거 없음`);
      const a = s.sourcingAnswer ?? {};
      if (!a.who || !a.when || !a.distanceFromEvent) bad.push(`${c.id}/${s.id} 출처 메모 불완전`);
    });
  });
  return bad.length === 0 ? null : bad.join(', ');
});

check('탐구 질문 보기에 좋은 질문과 그렇지 않은 질문이 함께 있다', () => {
  const bad = allCases
    .filter((c) => {
      const opts = c.questionStage?.options ?? [];
      return !opts.some((o) => o.good) || !opts.some((o) => !o.good) || opts.length < 4;
    })
    .map((c) => c.id);
  return bad.length === 0 ? null : bad.join(', ');
});

/* ---------- 결과 ---------- */

console.log(`\n자체 점검: ${passed}건 통과, ${failures.length}건 실패`);
if (failures.length) {
  console.log('\n실패 항목');
  failures.forEach((f) => console.log(`  ✗ ${f}`));
  process.exit(1);
}
console.log('모두 통과했습니다.\n');
