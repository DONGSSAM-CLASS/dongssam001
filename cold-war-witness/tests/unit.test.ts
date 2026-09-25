/**
 * 화면 밖 계산 함수 단위 테스트 — npm test
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeChoiceStats, percent, statsKey, totalOf } from '../src/lib/stats';
import { buildCsv, csvCell } from '../src/lib/csv';
import { answeredCount, chapterStatus, countChars, nextStep, reflectionReady, sceneNoOf, stepLabel } from '../src/lib/progress';
import { generateClassCode, isValidClassCode, normalizeClassCode } from '../src/lib/code';
import { isValidPin, randomPin, sha256Hex, studentDocId } from '../src/lib/hash';
import { ALL_ANSWER_IDS, ALL_SCENE_IDS, CHAPTERS } from '../src/data/scenarios';
import { CORE_VALUES, PRINCIPLES } from '../src/data/principles';
import { FACTS } from '../src/data/facts';
import {
  AI_LOG_FIELDS,
  ALL_CHECK_IDS,
  ALL_FORMAT_IDS,
  ALL_ROLE_IDS,
  ALL_STAGE_IDS,
  MAX_CUTS,
  MAX_GROUP_MEMBERS,
  MAX_GROUPS,
  PLAN_FIELDS,
  PLAN_LIMITS,
  RUBRIC,
} from '../src/data/project';
import { EMOTIONS } from '../src/data/emotions';
import { STEPS } from '../src/lib/progress';
import { CLASS_CODE_ALPHABET, LIMITS } from '../src/config';
import type { StudentDoc } from '../src/types/db';

const base: Pick<StudentDoc, 'number' | 'nickname' | 'groupNo' | 'progress' | 'choices' | 'emotions' | 'answers' | 'cards' | 'declaration'> = {
  number: 1,
  nickname: '파란연필',
  groupNo: 0,
  progress: {},
  choices: {},
  emotions: {},
  answers: {},
  cards: [],
  declaration: null,
};

describe('선택 분포', () => {
  it('장면별로 센다 (없는 장면 id 는 무시)', () => {
    const s = computeChoiceStats([
      { choices: { 'ch1-s1': 'a', 'ch1-s2': 'b' } },
      { choices: { 'ch1-s1': 'a' } },
      { choices: { 'ch1-s1': 'c', 'zz-s1': 'a' } as Record<string, 'a' | 'b' | 'c'> },
    ]);
    expect(s['ch1-s1']).toEqual({ a: 2, c: 1 });
    expect(s['ch1-s2']).toEqual({ b: 1 });
    expect(s['zz-s1']).toBeUndefined();
    expect(totalOf(s['ch1-s1'])).toBe(3);
    expect(percent(2, 3)).toBe(67);
    expect(percent(0, 0)).toBe(0);
  });
  it('같은 값이면 키 순서와 상관없이 같은 비교 문자열', () => {
    expect(statsKey({ 'ch1-s2': { b: 1 }, 'ch1-s1': { a: 2 } })).toBe(statsKey({ 'ch1-s1': { a: 2 }, 'ch1-s2': { b: 1 } }));
  });
});

describe('CSV', () => {
  it('엑셀 수식 주입을 막고 따옴표를 이스케이프한다', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('-1')).toBe(`"'-1"`);
    expect(csvCell('안녕, "친구"')).toBe(`"안녕, ""친구"""`);
    expect(csvCell(null)).toBe('""');
  });
  it('BOM 으로 시작하고 번호순으로 정렬하며 선택지 문장을 적는다', () => {
    const csv = buildCsv([
      { ...base, number: 9, nickname: '구번' },
      { ...base, number: 2, nickname: '이번', choices: { 'ch1-s1': 'a' }, emotions: { 'ch1-s1': 'calm' }, answers: { 'ch1-q1': '답' } },
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    const lines = csv.slice(1).split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[1].startsWith('"2","이번"')).toBe(true);
    expect(lines[1]).toContain('"평온"');
    expect(lines[1]).toContain(CHAPTERS[0].scenes[0].choices[0].label);
    expect(lines[2].startsWith('"9","구번"')).toBe(true);
  });
});

describe('진행 단계', () => {
  it('다음 단계, 장면 번호, 이름표', () => {
    expect(nextStep('intro')).toBe('s1');
    expect(nextStep('s5')).toBe('reflect');
    expect(nextStep('done')).toBe('done');
    expect(sceneNoOf('s3')).toBe(3);
    expect(sceneNoOf('reflect')).toBeNull();
    expect(stepLabel(undefined)).toBe('시작 전');
    expect(stepLabel('s2')).toBe('장면 2');
    expect(stepLabel('done')).toBe('완료');
    expect(chapterStatus({ progress: { ch1: 'done' } }, 'ch1')).toBe('done');
    expect(chapterStatus({ progress: { ch1: 's2' } }, 'ch1')).toBe('inProgress');
    expect(chapterStatus({ progress: {} }, 'ch2')).toBe('notStarted');
  });
  it('글자 수: 공백만 채워서는 넘길 수 없다', () => {
    expect(countChars('   ')).toBe(0);
    expect(countChars('가 나      다')).toBe(5);
  });
  it('성찰 준비: 최소 글자 수를 넘긴 답이 최소 개수 이상', () => {
    const ch2 = CHAPTERS[1];
    const long = '가'.repeat(30);
    expect(answeredCount(ch2, { 'ch2-q1': long, 'ch2-q2': '짧음' })).toBe(1);
    expect(reflectionReady(ch2, { 'ch2-q1': long, 'ch2-q2': '짧음' })).toBe(false);
    expect(reflectionReady(ch2, { 'ch2-q1': long, 'ch2-q3': long })).toBe(true);
  });
});

describe('학급 코드 · PIN', () => {
  it('코드는 6자, 헷갈리는 글자 없음', () => {
    for (let i = 0; i < 200; i++) {
      const c = generateClassCode();
      expect(isValidClassCode(c)).toBe(true);
      expect(c).not.toMatch(/[01OIL]/);
    }
    expect(normalizeClassCode(' k7m-pq2 ')).toBe('K7MPQ2');
    expect(isValidClassCode('K7MPQ')).toBe(false);
    expect(isValidClassCode('K7MPQO')).toBe(false);
  });
  it('PIN: 숫자 4개, 임시 PIN 형식', () => {
    expect(isValidPin('0123')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12a4')).toBe(false);
    for (let i = 0; i < 50; i++) expect(isValidPin(randomPin())).toBe(true);
  });
  it('학생 문서 id: SHA-256 64자, 학급·번호·PIN 이 하나라도 다르면 달라진다', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const a = await studentDocId('c1', 7, '2580');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await studentDocId('c1', 7, '2580')).toBe(a);
    expect(await studentDocId('c2', 7, '2580')).not.toBe(a);
    expect(await studentDocId('c1', 8, '2580')).not.toBe(a);
    expect(await studentDocId('c1', 7, '2581')).not.toBe(a);
  });
});

describe('보안 규칙과 앱 데이터가 같은 값을 쓰는지', () => {
  const rules = readFileSync('firestore.rules', 'utf8');
  const listIn = (fn: string) => {
    const m = new RegExp(`function ${fn}\\(\\) \\{\\s*return \\[([^\\]]*)\\]`).exec(rules);
    if (!m) throw new Error(fn);
    return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  };
  it('장면·답변·단계·감정·원칙 id', () => {
    expect(listIn('sceneIds')).toEqual(ALL_SCENE_IDS);
    expect(listIn('answerIds')).toEqual(ALL_ANSWER_IDS);
    expect(listIn('stepIds')).toEqual(STEPS);
    expect(listIn('emotionIds')).toEqual(EMOTIONS.map((e) => e.id));
    expect(listIn('principleIds')).toEqual(PRINCIPLES.map((p) => p.id));
  });
  it('모둠 프로젝트 id (사실 카드·세부 항목·가치·역할·형식·단계·점검 문항·칸)', () => {
    expect(listIn('factIds')).toEqual(FACTS.map((f) => f.id));
    expect(listIn('aspectTags')).toEqual(PRINCIPLES.flatMap((p) => p.aspects.map((a) => a.tag)));
    expect(listIn('valueIds')).toEqual(CORE_VALUES.map((v) => v.id));
    expect(listIn('roleIds')).toEqual(ALL_ROLE_IDS);
    expect(listIn('formatIds')).toEqual(ALL_FORMAT_IDS);
    expect(listIn('stageIds')).toEqual(ALL_STAGE_IDS);
    expect(listIn('checkIds')).toEqual(ALL_CHECK_IDS);
    expect(listIn('cutIds')).toEqual(Array.from({ length: MAX_CUTS }, (_, i) => `c${i + 1}`));
    expect(listIn('planKeys').slice(0, PLAN_FIELDS.length)).toEqual(PLAN_FIELDS.map((f) => f.id));
    expect(listIn('groupKeys')).toContain('submission');
  });
  it('모둠 프로젝트 길이·개수 제한', () => {
    for (const f of PLAN_FIELDS) expect(rules).toContain(`strLen(a.${f.id}, 0, ${f.max})`);
    for (const f of AI_LOG_FIELDS) expect(rules).toContain(`strLen(l.${f.id}, 0, ${f.max})`);
    expect(rules).toContain(`a.factIds.size() <= ${PLAN_LIMITS.facts}`);
    expect(rules).toContain(`a.principleIds.size() <= ${PLAN_LIMITS.principles}`);
    expect(rules).toContain(`a.aspectTags.size() <= ${PLAN_LIMITS.aspects}`);
    expect(rules).toContain(`a.valueIds.size() <= ${PLAN_LIMITS.values}`);
    expect(rules).toContain(`a.members.size() <= ${MAX_GROUP_MEMBERS}`);
    expect(rules).toContain(`d.no <= ${MAX_GROUPS}`);
    expect(rules).toContain(`d.groupCount <= ${MAX_GROUPS}`);
    expect(rules).toContain(`scores.keys().hasOnly([${RUBRIC.map((r) => `'${r.id}'`).join(', ')}])`);
  });
  it('길이 제한', () => {
    expect(rules).toContain(`a[k].size() <= ${LIMITS.answer}`);
    expect(rules).toContain(`strLen(d.nickname, 1, ${LIMITS.nickname})`);
    expect(rules).toContain(`strLen(d.keep, 1, ${LIMITS.declarationKeep})`);
    expect(rules).toContain(`strLen(d.era, 1, ${LIMITS.declarationEra})`);
    expect(rules).toContain(`strLen(d.lesson, 1, ${LIMITS.declarationLesson})`);
    expect(rules).toContain(`strLen(d.free, 0, ${LIMITS.declarationFree})`);
    expect(rules).toContain(`d.number <= ${LIMITS.studentNumberMax}`);
    expect(rules).toContain(`strLen(request.resource.data.name, 1, ${LIMITS.className})`);
  });
  it('학급 코드 글자 모음', () => {
    const re = /^[A-HJKMNP-Z2-9]$/;
    for (const ch of CLASS_CODE_ALPHABET) expect(re.test(ch), ch).toBe(true);
    expect(CLASS_CODE_ALPHABET).toHaveLength(31);
  });
});

describe('조사 고르기', async () => {
  const { eulReul, declarationSentence } = await import('../src/lib/josa');
  it('받침 있으면 을, 없으면 를, 한글이 아니면 을(를)', () => {
    expect(eulReul('프라이버시 보호')).toBe('를');
    expect(eulReul('투명성')).toBe('을');
    expect(eulReul('것 ')).toBe('을');
    expect(eulReul('AI')).toBe('을(를)');
    expect(declarationSentence({ keep: '투명성', era: '쿠바 미사일 위기', lesson: '숨긴 사실이 불안을 키운다는 것' })).toBe(
      '나는 AI를 사용할 때 투명성을 지키겠습니다. 왜냐하면 냉전 시대의 쿠바 미사일 위기에서 숨긴 사실이 불안을 키운다는 것을 배웠기 때문입니다.',
    );
  });
});

describe('모둠 프로젝트 계산', async () => {
  const P = await import('../src/lib/project');
  const { buildGroupCsv } = await import('../src/lib/csv');
  const emptyPlan = () => ({
    ...(Object.fromEntries(PLAN_FIELDS.map((f) => [f.id, ''])) as Record<(typeof PLAN_FIELDS)[number]['id'], string>),
    format: null,
    formatOther: '',
    factIds: [] as string[],
    principleIds: [] as never[],
    aspectTags: [] as string[],
    valueIds: [] as never[],
  });

  it('활동은 정해진 차시부터 열리고, 지난 차시 활동은 계속 열려 있다', () => {
    expect(P.isActivityOpen('guide', 1)).toBe(true);
    expect(P.isActivityOpen('plan', 1)).toBe(false);
    expect(P.isActivityOpen('plan', 2)).toBe(true);
    expect(P.isActivityOpen('plan', 6)).toBe(true);
    expect(P.isActivityOpen('submit', 4)).toBe(false);
    expect(P.isActivityOpen('declare', 6)).toBe(true);
  });

  it('동료 검토 상대: 다음 모둠, 마지막 모둠은 1모둠', () => {
    expect(P.reviewTarget(1, 4)).toBe(2);
    expect(P.reviewTarget(4, 4)).toBe(1);
    expect(P.reviewTarget(1, 1)).toBeNull();
    expect(P.reviewTarget(0, 4)).toBeNull();
    expect(P.reviewTarget(5, 4)).toBeNull();
  });

  it('기획서 빠진 곳 찾기', () => {
    const plan = emptyPlan();
    expect(P.planMissing(plan).length).toBe(PLAN_FIELDS.length + 3);
    const full = {
      ...plan,
      ...Object.fromEntries(PLAN_FIELDS.map((f) => [f.id, '가'.repeat(f.min)])),
      format: 'other' as const,
      formatOther: '',
      factIds: ['c1-files'],
      principleIds: ['privacy' as const],
    };
    expect(P.planMissing(full)).toEqual(['기타 형식 이름']);
    expect(P.planMissing({ ...full, formatOther: '보드게임' })).toEqual([]);
  });

  it('점검표 개수 · AI 표기 문구 추천 · 제출 링크 검사', () => {
    expect(P.checksDone({ hc1: true, hc2: false }).done).toBe(1);
    expect(P.checksDone(Object.fromEntries(ALL_CHECK_IDS.map((id) => [id, true]))).all).toBe(true);
    expect(P.suggestAiLabel({ tools: '없음' })).toContain('사용하지 않고');
    expect(P.suggestAiLabel({ tools: '이미지 생성 AI' })).toBe('이 작품은 이미지 생성 AI를 활용해 만들었고, 모둠이 직접 검토하고 고쳤습니다.');
    expect(P.isValidWorkUrl('https://padlet.com/abc')).toBe(true);
    expect(P.isValidWorkUrl('http://padlet.com/abc')).toBe(false);
    expect(P.isValidWorkUrl('https://a b.com')).toBe(false);
    expect(P.isValidWorkUrl('javascript:alert(1)')).toBe(false);
  });

  it('역할 빈자리 · 평균 별점', () => {
    expect(P.missingRoles({ '3': { nickname: 'a', roles: ['leader', 'creator'] } })).toEqual(['historian', 'ethicist', 'presenter']);
    const avg = P.averageScores([
      { scores: { ethics: 3, history: 2, creative: 1, delivery: 3 } },
      { scores: { ethics: 2, history: 2, creative: 2, delivery: 2 } },
    ]);
    expect(avg).toEqual({ ethics: 2.5, history: 2, creative: 1.5, delivery: 2.5, count: 2 });
    expect(P.averageScores([]).count).toBe(0);
  });

  it('모둠별 CSV: 머리글, 한 모둠 한 줄, 수식 막기', () => {
    const g = {
      no: 2,
      name: '=파란',
      caseId: 'ch1' as const,
      pledge: '',
      members: { '7': { nickname: '연필', roles: ['leader' as const] } },
      plan: { ...emptyPlan(), title: '누가 내 하루를' },
      planChecks: {},
      finalChecks: {},
      planStatus: 'approved' as const,
      teacherComment: '',
      storyboard: { c2: '둘', c1: '하나' },
      stage: 'done' as const,
      aiLog: { tools: '', where: '', human: '', label: '' },
      sources: '',
      submission: null,
      createdAt: null as never,
      updatedAt: null as never,
    };
    const csv = buildGroupCsv([g], [
      { kind: 'final', toGroup: 2, scores: { ethics: 3, history: 3, creative: 3, delivery: 3 }, praise: '좋아요', suggest: '', authorNumber: 9, updatedAt: null as never },
    ]);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('"모둠 이름"');
    expect(lines[1]).toContain(`"'=파란"`);
    expect(lines[1]).toContain('"7 연필: 모둠장"');
    expect(lines[1]).toContain('"1: 하나\n2: 둘"');
    expect(lines[1]).toContain('"승인"');
  });
});
