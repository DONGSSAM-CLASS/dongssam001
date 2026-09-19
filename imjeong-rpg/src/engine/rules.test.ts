import { describe, expect, it } from 'vitest';
import type { Quest, Resources } from '../types';
import {
  INITIAL_RESOURCES,
  applyDelta,
  canAfford,
  gradeQuest,
  heatLevel,
  isUnlocked,
  mergeDelta,
  partyBonus,
  progressPercent,
  resolveQuest,
  scaleDelta,
  stableShuffle,
} from './rules';

/** 규칙을 시험하기 위한 가상의 퀘스트 (역사 콘텐츠가 아니다) */
function makeQuest(overrides: Partial<Quest> = {}): Quest {
  const leveled = { middle: '가상의 문제입니다.', high: '규칙 시험용 가상 문제다.' };
  return {
    id: 'test-quest',
    act: 1,
    map: 'shanghai',
    giver: 'kimgu',
    track: 'unity',
    title: '시험용',
    dateLabel: '1919. 1. 1.',
    briefing: leveled,
    kind: 'choice',
    question: leveled,
    choices: [
      { id: 'a', label: 'ㄱ', historical: true, outcome: leveled, delta: { unity: 2 } },
      { id: 'b', label: 'ㄴ', historical: false, outcome: leveled, delta: { unity: -2 } },
    ],
    answer: ['a'],
    debrief: leveled,
    sources: [],
    reward: { funds: 100, prestige: 10 },
    badge: { icon: '★', label: '시험' },
    curriculum: '시험용',
    ...overrides,
  };
}

describe('자원 계산', () => {
  it('증감을 적용해도 원본을 바꾸지 않는다', () => {
    const before: Resources = { ...INITIAL_RESOURCES };
    const after = applyDelta(before, { funds: 100 });
    expect(before.funds).toBe(INITIAL_RESOURCES.funds);
    expect(after.funds).toBe(INITIAL_RESOURCES.funds + 100);
  });

  it('0~100 범위 자원은 범위를 벗어나지 않는다', () => {
    const high = applyDelta(INITIAL_RESOURCES, { prestige: 999, unity: 999, heat: 999 });
    expect(high.prestige).toBe(100);
    expect(high.unity).toBe(100);
    expect(high.heat).toBe(100);
    const low = applyDelta(INITIAL_RESOURCES, { prestige: -999, unity: -999, heat: -999 });
    expect(low.prestige).toBe(0);
    expect(low.unity).toBe(0);
    expect(low.heat).toBe(0);
  });

  it('돈·요원·군사력은 0 아래로 내려가지 않는다', () => {
    const drained = applyDelta(INITIAL_RESOURCES, { funds: -99999, agents: -50, forces: -50 });
    expect(drained.funds).toBe(0);
    expect(drained.agents).toBe(0);
    expect(drained.forces).toBe(0);
  });

  it('증감을 합치고 배율을 적용한다', () => {
    expect(mergeDelta({ funds: 10 }, { funds: 5, unity: 2 })).toEqual({ funds: 15, unity: 2 });
    expect(scaleDelta({ funds: 10, unity: 3 }, 0.5)).toEqual({ funds: 5, unity: 2 });
  });

  it('동지 보정을 모두 더한다', () => {
    expect(partyBonus([{ forces: 4 }, undefined, { forces: 3, unity: 5 }])).toEqual({
      forces: 7,
      unity: 5,
    });
  });
});

describe('자원 조건', () => {
  it('조건이 없으면 언제나 고를 수 있다', () => {
    expect(canAfford(INITIAL_RESOURCES, undefined)).toBe(true);
  });

  it('모자라면 고를 수 없다', () => {
    expect(canAfford(INITIAL_RESOURCES, { funds: 999999 })).toBe(false);
    expect(canAfford(INITIAL_RESOURCES, { funds: 100 })).toBe(true);
  });

  it('일제 감시는 「이 값 이하」라는 상한 조건으로 읽는다', () => {
    const watched = applyDelta(INITIAL_RESOURCES, { heat: 50 });
    expect(canAfford(watched, { heat: 80 })).toBe(true);
    expect(canAfford(watched, { heat: 10 })).toBe(false);
  });
});

describe('채점', () => {
  it('하나 고르기는 정확히 그 답이어야 한다', () => {
    const quest = makeQuest();
    expect(gradeQuest(quest, ['a'])).toBe(true);
    expect(gradeQuest(quest, ['b'])).toBe(false);
    expect(gradeQuest(quest, [])).toBe(false);
  });

  it('여러 개 고르기는 순서와 상관없이 집합이 같아야 한다', () => {
    const quest = makeQuest({ kind: 'multi', answer: ['a', 'b'] });
    expect(gradeQuest(quest, ['b', 'a'])).toBe(true);
    expect(gradeQuest(quest, ['a'])).toBe(false);
  });

  it('순서 맞추기는 순서까지 같아야 한다', () => {
    const quest = makeQuest({ kind: 'order', answer: ['a', 'b'] });
    expect(gradeQuest(quest, ['a', 'b'])).toBe(true);
    expect(gradeQuest(quest, ['b', 'a'])).toBe(false);
  });
});

describe('퀘스트 결과', () => {
  it('정답은 보상을 전부 주고, 오답은 절반만 주며 감시가 오른다', () => {
    const quest = makeQuest();
    const right = resolveQuest(quest, ['a'], { ...INITIAL_RESOURCES });
    const wrong = resolveQuest(quest, ['b'], { ...INITIAL_RESOURCES });

    expect(right.correct).toBe(true);
    expect(wrong.correct).toBe(false);
    // 보상: 정답 100 / 오답 50
    expect(right.resources.funds).toBe(INITIAL_RESOURCES.funds + 100);
    expect(wrong.resources.funds).toBe(INITIAL_RESOURCES.funds + 50);
    // 오답은 감시가 5 오른다
    expect(wrong.resources.heat).toBe(INITIAL_RESOURCES.heat + 5);
    expect(right.resources.heat).toBe(INITIAL_RESOURCES.heat);
  });

  it('오답이어도 게임이 끝나지 않는다 (자원이 음수가 되지 않는다)', () => {
    const quest = makeQuest({
      choices: [
        { id: 'a', label: 'ㄱ', historical: true, outcome: { middle: '', high: '' }, delta: {} },
        {
          id: 'b',
          label: 'ㄴ',
          historical: false,
          outcome: { middle: '', high: '' },
          delta: { funds: -99999, agents: -99 },
        },
      ],
    });
    const wrong = resolveQuest(quest, ['b'], { ...INITIAL_RESOURCES });
    expect(wrong.resources.funds).toBeGreaterThanOrEqual(0);
    expect(wrong.resources.agents).toBeGreaterThanOrEqual(0);
  });
});

describe('진행', () => {
  it('선행 퀘스트를 풀어야 열린다', () => {
    const quest = makeQuest({ requires: ['prev'] });
    expect(isUnlocked(quest, {})).toBe(false);
    expect(isUnlocked(quest, { prev: true })).toBe(true);
    // 틀렸더라도 「풀었다」면 다음이 열린다 — 막히면 수업이 끊기기 때문이다.
    expect(isUnlocked(quest, { prev: false })).toBe(true);
  });

  it('진행률을 백분율로 계산한다', () => {
    expect(progressPercent({}, 10)).toBe(0);
    expect(progressPercent({ a: true, b: false }, 10)).toBe(20);
    expect(progressPercent({}, 0)).toBe(0);
  });
});

describe('감시 단계', () => {
  it('수치에 따라 단계가 올라간다', () => {
    expect(heatLevel(0)).toBe('calm');
    expect(heatLevel(40)).toBe('watched');
    expect(heatLevel(70)).toBe('danger');
    expect(heatLevel(90)).toBe('critical');
  });
});

describe('선택지 섞기', () => {
  it('같은 씨앗이면 언제나 같은 순서가 나온다', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const first = stableShuffle(items, 'seed').map((i) => i.id);
    const second = stableShuffle(items, 'seed').map((i) => i.id);
    expect(first).toEqual(second);
    expect([...first].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('씨앗이 다르면 순서가 달라질 수 있다', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({ id: String(i) }));
    const a = stableShuffle(items, 'one').map((i) => i.id).join();
    const b = stableShuffle(items, 'two').map((i) => i.id).join();
    expect(a).not.toBe(b);
  });
});
