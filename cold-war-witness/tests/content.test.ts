/**
 * 콘텐츠 데이터 점검 — 교사가 src/data/ 의 문장을 고친 뒤 `npm test` 로 확인한다.
 * (역사적 사실 자체를 검증하지는 못한다. 구조와 연결만 확인한다.)
 */
import { describe, expect, it } from 'vitest';
import { CHAPTERS, ALL_ANSWER_IDS, ALL_SCENE_IDS } from '../src/data/scenarios';
import { FACTS } from '../src/data/facts';
import { CORE_VALUES, PRINCIPLES } from '../src/data/principles';
import { EMOTIONS } from '../src/data/emotions';
import { LESSON_PLANS, WORKSHEETS } from '../src/data/lessonMaterials';

const factIds = new Set(FACTS.map((f) => f.id));

/** 문장 수 세기: 문장 배열 한 칸 = 한 문장 */
describe('챕터와 장면', () => {
  it('챕터는 3개, 챕터마다 장면 5개', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual(['ch1', 'ch2', 'ch3']);
    for (const c of CHAPTERS) {
      expect(c.scenes.map((s) => s.no)).toEqual([1, 2, 3, 4, 5]);
      expect(c.scenes.map((s) => s.id)).toEqual([1, 2, 3, 4, 5].map((n) => `${c.id}-s${n}`));
      expect(c.scenes[4].epilogue).toBe(true);
    }
  });

  it('장면 본문은 3~5문장, 선택지는 2~3개', () => {
    for (const s of CHAPTERS.flatMap((c) => c.scenes)) {
      expect(s.body.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.body.length, s.id).toBeLessThanOrEqual(5);
      expect(s.choices.length, s.id).toBeGreaterThanOrEqual(2);
      expect(s.choices.length, s.id).toBeLessThanOrEqual(3);
      expect(s.choices.map((c) => c.id)).toEqual(['a', 'b', 'c'].slice(0, s.choices.length));
      for (const ch of s.choices) {
        expect(ch.label.trim(), s.id).not.toBe('');
        expect(ch.result.trim(), s.id).not.toBe('');
      }
    }
  });

  it('장면마다 사실 카드가 1장 이상 있고, 모두 같은 챕터의 카드다', () => {
    for (const c of CHAPTERS) {
      const ids = [...c.introFactIds, ...c.scenes.flatMap((s) => s.factIds), ...c.outroFactIds];
      for (const s of c.scenes) expect(s.factIds.length, s.id).toBeGreaterThan(0);
      for (const id of ids) {
        expect(factIds.has(id), id).toBe(true);
        expect(FACTS.find((f) => f.id === id)!.chapter, id).toBe(c.id);
      }
    }
  });

  it('모든 사실 카드가 어딘가에서 한 번 이상 쓰인다', () => {
    const used = new Set(
      CHAPTERS.flatMap((c) => [...c.introFactIds, ...c.scenes.flatMap((s) => s.factIds), ...c.outroFactIds]),
    );
    expect(FACTS.filter((f) => !used.has(f.id)).map((f) => f.id)).toEqual([]);
  });

  it('성찰 질문: id 형식, 최소 답변 수, 원칙 연결', () => {
    for (const c of CHAPTERS) {
      c.reflection.questions.forEach((q, i) => expect(q.id).toBe(`${c.id}-q${i + 1}`));
      expect(c.reflection.minAnswers).toBeGreaterThanOrEqual(1);
      expect(c.reflection.minAnswers).toBeLessThanOrEqual(c.reflection.questions.length);
      expect(c.reflection.minLength).toBe(30);
      expect(c.wrapupId).toBe(`${c.id}-wrap`);
      for (const q of c.reflection.questions) {
        for (const p of q.principleIds) expect(c.principleIds, q.id).toContain(p);
      }
    }
  });

  it('보안 규칙용 id 목록', () => {
    expect(ALL_SCENE_IDS).toHaveLength(15);
    expect(new Set(ALL_ANSWER_IDS).size).toBe(ALL_ANSWER_IDS.length);
  });
});

describe('사실 카드', () => {
  it('id 가 겹치지 않는다', () => {
    expect(factIds.size).toBe(FACTS.length);
  });

  it('출처: 기관명은 반드시, URL 은 https 이거나 비어 있으면 확인 필요 표시', () => {
    for (const f of FACTS) {
      expect(f.source.org.trim(), f.id).not.toBe('');
      if (f.source.url) expect(f.source.url, f.id).toMatch(/^https:\/\//);
      else expect(f.needsCheck, f.id).toBe(true);
    }
  });

  it('명세서가 지정한 표현을 지킨다', () => {
    const b59 = FACTS.find((f) => f.id === 'c3-b59')!;
    expect(b59.body).toContain('후일 증언에 따르면');
    const huac = FACTS.find((f) => f.id === 'c2-huac')!;
    expect(huac.body).toContain('매카시 상원의원이 아니라 하원');
    expect(FACTS.find((f) => f.id === 'c3-turkey')!.body).toContain('25년 넘게');
  });
});

describe('원칙·가치·감정', () => {
  it('7대 원칙, 3대 가치, 감정 5종', () => {
    expect(PRINCIPLES).toHaveLength(7);
    expect(CORE_VALUES).toHaveLength(3);
    expect(EMOTIONS.map((e) => e.label)).toEqual(['불안', '두려움', '분노', '망설임', '평온']);
  });

  it('챕터 원칙을 모두 모으면 7개 원칙이 한 번씩 나온다', () => {
    const all = CHAPTERS.flatMap((c) => c.principleIds);
    expect([...all].sort()).toEqual(PRINCIPLES.map((p) => p.id).sort());
    for (const p of PRINCIPLES) {
      expect(CHAPTERS.find((c) => c.principleIds.includes(p.id))!.id, p.id).toBe(p.chapter);
    }
  });
});

describe('수업 자료', () => {
  it('과정안·활동지 3차시, 과정안은 45분', () => {
    expect(LESSON_PLANS.map((l) => l.session)).toEqual([1, 2, 3]);
    expect(WORKSHEETS.map((w) => w.session)).toEqual([1, 2, 3]);
    for (const l of LESSON_PLANS) {
      expect(l.steps.reduce((sum, s) => sum + s.minutes, 0), `${l.session}차시`).toBe(45);
    }
  });
});
