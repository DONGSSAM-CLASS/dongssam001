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
import { PRINCIPLES } from '../src/data/principles';
import { EMOTIONS } from '../src/data/emotions';
import { STEPS } from '../src/lib/progress';
import { CLASS_CODE_ALPHABET, LIMITS } from '../src/config';
import type { StudentDoc } from '../src/types/db';

const base: Pick<StudentDoc, 'number' | 'nickname' | 'progress' | 'choices' | 'emotions' | 'answers' | 'cards' | 'declaration'> = {
  number: 1,
  nickname: '파란연필',
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
