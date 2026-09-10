import { describe, expect, it } from 'vitest';
import { chapters, chaptersById, totalPoints } from './story';
import { figures } from './figures';

/**
 * 게임 콘텐츠 무결성 테스트.
 * 사료·난이도·정답 등 데이터가 빠짐없이 채워져 있는지 검증해, 수업 중 빈 화면이 나오지 않게 한다.
 */
describe('story 데이터 무결성', () => {
  it('챕터가 시대순으로 1..N 번호를 가지며 id 가 고유하다', () => {
    const ids = new Set(chapters.map((c) => c.id));
    expect(ids.size).toBe(chapters.length);
    chapters.forEach((c, i) => expect(c.order).toBe(i + 1));
  });

  it('플레이 분량(15~20분)에 맞는 챕터 수(6~9개)를 가진다', () => {
    expect(chapters.length).toBeGreaterThanOrEqual(6);
    expect(chapters.length).toBeLessThanOrEqual(9);
  });

  it('모든 수준별 텍스트(중/고)가 비어 있지 않다', () => {
    for (const c of chapters) {
      for (const leveled of [c.intro, c.missionObjective, c.quest.question, c.quest.explanation]) {
        expect(leveled.middle.trim().length).toBeGreaterThan(0);
        expect(leveled.high.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('퀘스트 정답이 보기 안에 존재하고, 유형별 정답 개수가 맞다', () => {
    for (const c of chapters) {
      const optionIds = new Set(c.quest.options.map((o) => o.id));
      expect(c.quest.options.length).toBeGreaterThanOrEqual(2);
      expect(c.quest.answer.length).toBeGreaterThanOrEqual(1);
      for (const a of c.quest.answer) expect(optionIds.has(a)).toBe(true);
      if (c.quest.kind === 'choice') expect(c.quest.answer.length).toBe(1);
      expect(c.quest.points).toBeGreaterThan(0);
    }
  });

  it('모든 사료가 원문·중고 해석본·APA 출처를 갖는다', () => {
    for (const c of chapters) {
      expect(c.sources.length).toBeGreaterThanOrEqual(1);
      for (const s of c.sources) {
        expect(s.original.trim().length).toBeGreaterThan(0);
        expect(s.interpretation.middle.trim().length).toBeGreaterThan(0);
        expect(s.interpretation.high.trim().length).toBeGreaterThan(0);
        // APA 출처: 저자/연도 형태 최소 확인
        expect(s.citationApa).toMatch(/\(\d{4}|n\.d\.\)/);
      }
    }
  });

  it('대사에 연결된 사료 id 와 등장인물 id 가 실제로 존재한다', () => {
    for (const c of chapters) {
      const srcIds = new Set(c.sources.map((s) => s.id));
      for (const d of c.dialogues) {
        expect(figures[d.figureId], `없는 인물: ${d.figureId}`).toBeTruthy();
        if (d.sourceId) expect(srcIds.has(d.sourceId), `없는 사료: ${d.sourceId}`).toBe(true);
      }
    }
  });

  it('chaptersById 와 totalPoints 가 일관된다', () => {
    expect(Object.keys(chaptersById).length).toBe(chapters.length);
    expect(totalPoints).toBe(chapters.reduce((s, c) => s + c.quest.points, 0));
  });

  it('첫 챕터 id 가 ch1-why-army 이다(게임 시작 지점)', () => {
    expect(chapters[0].id).toBe('ch1-why-army');
  });
});
