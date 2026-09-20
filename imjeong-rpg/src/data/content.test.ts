import { describe, expect, it } from 'vitest';
import { acts, quests } from './quests';
import { figures, recruitableFigures } from './figures';
import { worldMaps } from './maps';
import { timeline, timelineSorted } from './timeline';
import { items } from './items';
import { glossary, glossaryTerms } from './glossary';
import { gradeQuest, isUnlocked, resolveQuest, INITIAL_RESOURCES } from '../engine/rules';

/**
 * 콘텐츠 무결성 테스트.
 *
 * 이 게임은 역사 수업 자료다. 「사료 없는 문제」나 「풀 수 없는 퀘스트」가
 * 배포본에 섞여 들어가면 수업이 망가진다. 그래서 다음을 기계로 강제한다.
 *  · 모든 퀘스트에 사료와 출처가 있는가
 *  · 정답이 선택지 안에 있는가
 *  · 선행 조건을 따라가면 끝까지 진행할 수 있는가
 *  · 수준별 문장이 둘 다 채워져 있는가
 */

describe('퀘스트 구조', () => {
  it('퀘스트 id 가 중복되지 않는다', () => {
    const ids = quests.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 퀘스트에 사료가 1개 이상 있고, 각 사료에 APA 출처가 있다', () => {
    for (const quest of quests) {
      expect(quest.sources.length, `${quest.id} 에 사료 없음`).toBeGreaterThan(0);
      for (const source of quest.sources) {
        expect(source.citationApa.trim().length, `${quest.id}/${source.id} 출처 비어 있음`).toBeGreaterThan(10);
        expect(source.original.trim().length, `${quest.id}/${source.id} 원문 비어 있음`).toBeGreaterThan(10);
        expect(source.interpretation.middle.trim().length).toBeGreaterThan(10);
        expect(source.interpretation.high.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('정답이 모두 선택지 안에 있다', () => {
    for (const quest of quests) {
      const ids = new Set(quest.choices.map((c) => c.id));
      for (const answer of quest.answer) {
        expect(ids.has(answer), `${quest.id} 의 정답 ${answer} 가 선택지에 없음`).toBe(true);
      }
    }
  });

  it('선택지 종류에 맞는 정답 개수를 가진다', () => {
    for (const quest of quests) {
      if (quest.kind === 'choice') {
        expect(quest.answer.length, `${quest.id}`).toBe(1);
      } else if (quest.kind === 'multi') {
        expect(quest.answer.length, `${quest.id}`).toBeGreaterThan(1);
      } else {
        // 순서 맞추기는 모든 선택지를 쓴다
        expect(quest.answer.length, `${quest.id}`).toBe(quest.choices.length);
      }
    }
  });

  it('historical 로 표시한 선택지와 정답이 어긋나지 않는다', () => {
    for (const quest of quests) {
      if (quest.kind === 'order') continue;
      for (const choice of quest.choices) {
        const isAnswer = quest.answer.includes(choice.id);
        expect(
          choice.historical,
          `${quest.id}/${choice.id}: 정답 여부(${isAnswer})와 historical(${choice.historical}) 불일치`,
        ).toBe(isAnswer);
      }
    }
  });

  it('중·고 수준 문장이 모두 채워져 있고 서로 다르다', () => {
    for (const quest of quests) {
      for (const [name, text] of [
        ['briefing', quest.briefing],
        ['question', quest.question],
        ['debrief', quest.debrief],
      ] as const) {
        expect(text.middle.trim().length, `${quest.id}.${name}.middle`).toBeGreaterThan(10);
        expect(text.high.trim().length, `${quest.id}.${name}.high`).toBeGreaterThan(10);
      }
    }
  });

  it('퀘스트를 주는 인물이 해당 맵에 실제로 서 있다', () => {
    for (const quest of quests) {
      const map = worldMaps.find((m) => m.id === quest.map);
      expect(map, `${quest.id} 의 맵 ${quest.map} 없음`).toBeDefined();
      const present = map!.npcs.some((n) => n.figureId === quest.giver);
      expect(present, `${quest.id}: ${quest.giver} 가 ${quest.map} 에 없음`).toBe(true);
    }
  });

  it('선행 퀘스트가 실제로 존재하고 앞선 막에 있다', () => {
    const byId = new Map(quests.map((q) => [q.id, q]));
    for (const quest of quests) {
      for (const req of quest.requires ?? []) {
        const prev = byId.get(req);
        expect(prev, `${quest.id} 의 선행 ${req} 없음`).toBeDefined();
        expect(prev!.act, `${quest.id} 가 뒤의 막을 선행으로 둠`).toBeLessThanOrEqual(quest.act);
      }
    }
  });

  it('막 번호가 1~6 범위이고 모든 막에 퀘스트가 있다', () => {
    for (const quest of quests) {
      expect(quest.act).toBeGreaterThanOrEqual(1);
      expect(quest.act).toBeLessThanOrEqual(6);
    }
    for (const act of acts) {
      expect(quests.some((q) => q.act === act.act), `제${act.act}막에 퀘스트 없음`).toBe(true);
    }
  });

  it('교육과정 연계 문구가 비어 있지 않다', () => {
    for (const quest of quests) {
      expect(quest.curriculum.trim().length, quest.id).toBeGreaterThan(5);
    }
  });
});

describe('진행 가능성', () => {
  it('선행 조건을 따라가면 모든 퀘스트를 풀 수 있다 (막힘 없음)', () => {
    const completed: Record<string, boolean> = {};
    let guard = 0;
    while (Object.keys(completed).length < quests.length && guard < quests.length + 5) {
      guard += 1;
      const open = quests.filter((q) => !(q.id in completed) && isUnlocked(q, completed));
      expect(open.length, '더 이상 열리는 퀘스트가 없는데 남은 퀘스트가 있다').toBeGreaterThan(0);
      for (const quest of open) completed[quest.id] = true;
    }
    expect(Object.keys(completed).length).toBe(quests.length);
  });

  it('첫 퀘스트는 선행 조건 없이 바로 열린다', () => {
    const openAtStart = quests.filter((q) => isUnlocked(q, {}));
    expect(openAtStart.length).toBeGreaterThan(0);
  });

  it('정답을 고르면 모든 퀘스트가 정답 처리된다', () => {
    for (const quest of quests) {
      expect(gradeQuest(quest, quest.answer), quest.id).toBe(true);
    }
  });

  it('정답과 오답이 올바르게 갈린다', () => {
    for (const quest of quests) {
      const wrongPick = quest.choices.find((c) => !quest.answer.includes(c.id));
      if (!wrongPick) continue;
      const right = resolveQuest(quest, quest.answer, { ...INITIAL_RESOURCES });
      const wrong = resolveQuest(quest, [wrongPick.id], { ...INITIAL_RESOURCES });
      expect(right.correct, quest.id).toBe(true);
      expect(wrong.correct, quest.id).toBe(false);
    }
  });


  it('자원 조건이 붙은 선택지는 시작 자원으로도 고를 수 있거나, 대안이 있다', () => {
    for (const quest of quests) {
      const affordable = quest.choices.filter((c) => !c.requires);
      expect(affordable.length, `${quest.id}: 조건 없는 선택지가 하나도 없다`).toBeGreaterThan(0);
    }
  });
});

describe('인물 · 연표 · 아이템 · 낱말', () => {
  it('인물의 id 와 키가 일치한다', () => {
    for (const [key, figure] of Object.entries(figures)) {
      expect(figure.id, `키 ${key}`).toBe(key);
    }
  });

  it('모든 인물에 근거(sourceNote)와 수준별 소개가 있다', () => {
    for (const figure of Object.values(figures)) {
      if (figure.id === 'player') continue;
      expect(figure.sourceNote.trim().length, figure.id).toBeGreaterThan(10);
      expect(figure.bio.middle.trim().length, figure.id).toBeGreaterThan(10);
      expect(figure.bio.high.trim().length, figure.id).toBeGreaterThan(10);
    }
  });

  it('모든 인물의 차림새에 근거가 적혀 있다', () => {
    for (const figure of Object.values(figures)) {
      const app = figure.appearance;
      expect(app, figure.id).toBeDefined();
      expect(app.note.trim().length, `${figure.id} 의 복장 근거가 비어 있음`).toBeGreaterThan(10);
      // 색은 모두 6자리 16진수여야 한다 (오타가 나면 three 가 조용히 검게 칠한다)
      for (const key of ['coat', 'trim', 'lower'] as const) {
        expect(app[key], `${figure.id}.${key}`).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });

  it('여성 인물은 여성 한복이나 군복을 입는다', () => {
    // 1920~40년대 여성이 남성용 두루마기나 양복을 입은 모습으로 그려지면 시대 오인을 부른다.
    for (const id of ['jeongjeonghwa', 'bangsunhui']) {
      expect(figures[id].appearance.garment, id).toBe('hanbok-woman');
    }
    for (const id of ['ogwangsim', 'jibokyeong']) {
      expect(figures[id].appearance.garment, id).toBe('uniform');
    }
  });

  it('광복군 인물은 군복과 군모 차림이다', () => {
    for (const id of ['jicheongcheon', 'ibeomseok', 'kimhakgyu', 'hanjiseong', 'jangjunha']) {
      expect(figures[id].appearance.garment, id).toBe('uniform');
      expect(figures[id].appearance.headwear, id).toBe('military-cap');
    }
  });

  it('영입 가능한 인물은 보정치를 가진다', () => {
    for (const figure of recruitableFigures) {
      expect(figure.bonus, `${figure.id} 에 bonus 없음`).toBeDefined();
    }
  });

  it('연표가 날짜순으로 정렬되고 근거를 가진다', () => {
    for (let i = 1; i < timelineSorted.length; i += 1) {
      expect(timelineSorted[i].date >= timelineSorted[i - 1].date).toBe(true);
    }
    for (const entry of timeline) {
      expect(entry.sourceNote.trim().length, entry.title).toBeGreaterThan(5);
      expect(entry.date).toMatch(/^\d{4}(-\d{2}-\d{2})?$/);
    }
  });

  it('아이템의 id 와 키가 일치하고 근거가 있다', () => {
    for (const [key, item] of Object.entries(items)) {
      expect(item.id).toBe(key);
      expect(item.sourceNote.trim().length, key).toBeGreaterThan(5);
    }
  });

  it('낱말 풀이가 중복되지 않고 긴 말부터 정렬된다', () => {
    const terms = glossary.map((g) => g.term);
    expect(new Set(terms).size).toBe(terms.length);
    for (let i = 1; i < glossaryTerms.length; i += 1) {
      expect(glossaryTerms[i].key.length <= glossaryTerms[i - 1].key.length).toBe(true);
    }
  });
});

describe('역사 서술의 안전장치', () => {
  it('일자에 이설이 있는 사건은 caveat 로 밝힌다', () => {
    // 수립일(4/11 vs 4/13), 대일 선전 성명서(12/9 vs 12/10), 훙커우 의거 관련 일화는
    // 자료마다 표기가 갈린다. 해당 퀘스트에 확인 안내가 붙어 있어야 한다.
    const mustHaveCaveat = ['q-founding', 'q-declaration-war', 'q-hongkou', 'q-cairo', 'q-mandate-dispute'];
    for (const id of mustHaveCaveat) {
      const quest = quests.find((q) => q.id === id);
      expect(quest, id).toBeDefined();
      expect(quest!.caveat, `${id} 에 확인 안내(caveat) 없음`).toBeTruthy();
    }
  });

  it('사료에 판본·소장처 확인 안내(note)가 대부분 붙어 있다', () => {
    const all = quests.flatMap((q) => q.sources);
    const withNote = all.filter((s) => (s.note ?? '').trim().length > 5);
    expect(withNote.length / all.length).toBeGreaterThan(0.8);
  });

  it('맵마다 재구성임을 밝히는 historicalNote 가 있다', () => {
    for (const map of worldMaps) {
      expect(map.historicalNote.trim().length, map.id).toBeGreaterThan(20);
    }
  });
});
