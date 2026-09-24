import { quests, acts, MAX_ACT } from './quests';
import { figures } from './figures';
import { maps, MAP_ORDER } from './maps';
import { relics } from './relics';
import { honorees } from './honorees';
import { blueprint } from './blueprint';
import { timeline } from './timeline';
import { glossary } from './glossary';
import { validateMap } from '../engine/grid';
import { actFromProgress, isUnlocked, nextQuest } from '../engine/rules';
import { ACT_MAP, availableQuestFor } from '../store/gameStore';
import { notePrompts } from './notes';
import { journeyRecall, prequelActs, prequelLinks, prologueRecall } from './prequel';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * 콘텐츠 무결성 — 「수업 자료로 쓸 수 있는가」를 코드로 강제한다. (1탄과 같은 원칙)
 */

describe('퀘스트', () => {
  it('스물다섯 개이고 id 가 겹치지 않는다', () => {
    expect(quests.length).toBe(25);
    expect(new Set(quests.map((q) => q.id)).size).toBe(quests.length);
  });

  it.each(quests.map((q) => [q.id, q]))('%s — 사료가 1개 이상이고 모두 APA 출처가 있다', (_id, q) => {
    expect(q.sources.length).toBeGreaterThan(0);
    for (const s of q.sources) {
      expect(s.citationApa.trim().length).toBeGreaterThan(10);
      expect(s.original.trim().length).toBeGreaterThan(5);
      expect(s.interpretation.middle.trim()).not.toBe('');
      expect(s.interpretation.high.trim()).not.toBe('');
    }
  });

  it.each(quests.map((q) => [q.id, q]))('%s — 정답은 선택지 안에 있고, 정답만 historical 이다', (_id, q) => {
    const ids = q.choices.map((c) => c.id);
    for (const a of q.answer) expect(ids).toContain(a);
    if (q.kind === 'order') {
      expect(q.answer.length).toBe(q.choices.length);
      expect(q.choices.every((c) => c.historical)).toBe(true);
      // 화면은 order 선택지를 적힌 순서대로 보여 주므로, 정답 순서와 같으면 안 된다
      expect(q.choices.map((c) => c.id)).not.toEqual(q.answer);
    } else {
      for (const c of q.choices) expect(c.historical).toBe(q.answer.includes(c.id));
      if (q.kind === 'choice') expect(q.answer.length).toBe(1);
      else expect(q.answer.length).toBeGreaterThan(1);
    }
  });

  it.each(quests.map((q) => [q.id, q]))('%s — 수준별 문장이 비어 있지 않다', (_id, q) => {
    for (const t of [q.briefing, q.question, q.debrief, ...q.choices.map((c) => c.outcome)]) {
      expect(t.middle.trim()).not.toBe('');
      expect(t.high.trim()).not.toBe('');
    }
  });

  it('주는 사람이 실제로 그 장소에 서 있다', () => {
    for (const q of quests) {
      expect(figures[q.giver], q.id).toBeDefined();
      expect(maps[q.map].npcs.some((n) => n.figureId === q.giver), `${q.id} → ${q.giver} @ ${q.map}`).toBe(true);
    }
  });

  it('막과 장소가 맞는다', () => {
    for (const q of quests) expect(ACT_MAP[q.act], q.id).toBe(q.map);
  });

  it('이설이 있는 사건에는 「확인할 점」이 붙어 있다', () => {
    for (const id of ['q-name', 'q-unify-order', 'q-impeach', 'q-bond', 'q-1948', 'q-legitimacy']) {
      expect(quests.find((q) => q.id === id)?.caveat, id).toBeTruthy();
    }
  });

  it('선행 퀘스트는 존재하고 같은 막이거나 앞선 막이다', () => {
    for (const q of quests) {
      for (const r of q.requires ?? []) {
        const req = quests.find((x) => x.id === r);
        expect(req, `${q.id} → ${r}`).toBeDefined();
        expect(req!.act).toBeLessThanOrEqual(q.act);
      }
    }
  });

  it('처음부터 순서대로 따라가면 끝까지 풀 수 있다', () => {
    const completed: Record<string, boolean> = {};
    let guard = 0;
    for (;;) {
      const act = actFromProgress(quests, completed, MAX_ACT);
      const next = nextQuest(quests, completed);
      if (!next) break;
      expect(isUnlocked(next, completed)).toBe(true);
      expect(next.act, `${next.id}은 지금 막(${act})에서 받을 수 없다`).toBeLessThanOrEqual(act);
      // 그 사람에게 말을 걸면 이 퀘스트(또는 같은 사람의 다른 풀 수 있는 퀘스트)가 나온다
      const offered = availableQuestFor(next.giver, next.map, completed, act);
      expect(offered, next.id).not.toBeNull();
      completed[offered!.id] = true;
      guard += 1;
      expect(guard).toBeLessThan(100);
    }
    expect(Object.keys(completed).length).toBe(quests.length);
    expect(actFromProgress(quests, completed, MAX_ACT)).toBe(MAX_ACT + 1);
  });

  it('막 정보가 막마다 있다', () => {
    for (let a = 1; a <= MAX_ACT; a += 1) expect(acts.find((x) => x.act === a)).toBeDefined();
  });

  it('설계도 칸이 모두 어떤 퀘스트로든 세워진다', () => {
    const used = new Set(quests.map((q) => q.blueprint));
    for (const p of blueprint) expect(used.has(p.key), p.key).toBe(true);
    for (const k of used) expect(blueprint.some((p) => p.key === k), k).toBe(true);
  });
});

describe('장소', () => {
  it.each(MAP_ORDER.map((id) => [id]))('%s — 벽·가구·인물·기록 조각 배치가 올바르다', (id) => {
    expect(validateMap(maps[id])).toEqual([]);
  });

  it('시간의 문이 모든 장소에 하나씩 있다', () => {
    for (const id of MAP_ORDER) expect(maps[id].portals.length, id).toBe(1);
  });

  it('등장인물은 모두 인물 사전에 있다', () => {
    for (const id of MAP_ORDER) for (const n of maps[id].npcs) expect(figures[n.figureId], `${id}:${n.figureId}`).toBeDefined();
  });
});

describe('기록 조각', () => {
  it('정의된 조각은 모두 한 번씩 놓여 있고, 놓인 조각은 모두 정의되어 있다', () => {
    const placed = MAP_ORDER.flatMap((id) => maps[id].relics.map((r) => ({ ...r, map: id })));
    expect(new Set(placed.map((p) => p.relicId)).size).toBe(placed.length);
    for (const r of relics) {
      const p = placed.find((x) => x.relicId === r.id);
      expect(p, r.id).toBeDefined();
      expect(p!.map).toBe(r.map);
    }
    for (const p of placed) expect(relics.some((r) => r.id === p.relicId), p.relicId).toBe(true);
  });

  it('근거가 적혀 있다', () => {
    for (const r of relics) expect(r.sourceNote.trim().length, r.id).toBeGreaterThan(5);
  });
});

describe('보훈의 전당', () => {
  it('명패의 주인공은 모두 게임에서 만난 분이다', () => {
    const met = new Set(MAP_ORDER.filter((m) => m !== 'memorial').flatMap((m) => maps[m].npcs.map((n) => n.figureId)));
    for (const h of honorees.filter((x) => x.figureId !== 'unnamed')) expect(met.has(h.figureId), h.figureId).toBe(true);
  });

  it('명패와 유공자 정보가 하나씩 맞물린다', () => {
    const plaques = maps.memorial.furniture.filter((f) => f.kind === 'honor-plaque').map((f) => f.figureId);
    expect(new Set(plaques)).toEqual(new Set(honorees.map((h) => h.figureId)));
    for (const h of honorees) {
      expect(h.letterHints.length).toBeGreaterThan(1);
      expect(h.keywords.length, h.figureId).toBeGreaterThan(3);
      if (h.figureId !== 'unnamed') expect(h.sourceNote).toContain('공훈전자사료관');
    }
  });

  it('친일 행적이 있거나 평가가 크게 엇갈리는 인물은 명패에 없다', () => {
    for (const id of ['leegwangsu', 'leeseungman', 'leedonghwi']) {
      expect(honorees.some((h) => h.figureId === id)).toBe(false);
    }
  });
});

describe('인물·연표·낱말', () => {
  it('인물마다 차림새 근거가 있다', () => {
    for (const f of Object.values(figures)) expect(f.appearance.note.trim().length, f.id).toBeGreaterThan(5);
  });

  it('연표는 날짜순이다', () => {
    const dates = timeline.map((t) => t.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it('낱말 풀이가 겹치지 않는다', () => {
    const keys = glossary.flatMap((g) => [g.term, ...(g.aliases ?? [])]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('1탄과의 연결', () => {
  // 1탄의 퀘스트 파일을 직접 읽어, 2탄이 가리키는 1탄 장면 제목이 실제로 있는지 확인한다
  const prequelSource = readFileSync(fileURLToPath(new URL('../../../imjeong-rpg/src/data/quests.ts', import.meta.url)), 'utf8');
  const titles = [...prequelSource.matchAll(/title: '([^']+)'/g)].map((m) => m[1]);

  it('연결표의 퀘스트는 2탄에 있고, 가리키는 1탄 장면 제목은 1탄에 있다', () => {
    for (const [id, link] of Object.entries(prequelLinks)) {
      expect(quests.some((q) => q.id === id), id).toBe(true);
      const named = [...link.title.matchAll(/「([^」]+)」/g)].map((m) => m[1]);
      expect(named.length, id).toBeGreaterThan(0);
      for (const t of named) {
        if (t === '이어지는 법통') continue; // 1탄의 배지 이름
        expect(titles, `${id} → ${t}`).toContain(t);
      }
    }
  });

  it('기억 퀴즈가 가리키는 1탄 장면도 1탄에 있다', () => {
    for (const r of [...prologueRecall, journeyRecall]) {
      const t = r.from.match(/「([^」]+)」/)?.[1];
      expect(titles, r.id).toContain(t);
      expect(r.answer).toBeLessThan(r.choices.length);
    }
  });

  it('1탄 여섯 막 요약이 1탄의 막 제목과 같다', () => {
    for (const a of prequelActs) expect(prequelSource, a.title).toContain(a.title);
  });

  it('연결이 모든 막에 고루 있다', () => {
    const actsLinked = new Set(quests.filter((q) => prequelLinks[q.id]).map((q) => q.act));
    for (let a = 1; a <= MAX_ACT; a += 1) expect(actsLinked.has(a), `제${a}막`).toBe(true);
  });
});

describe('생각 노트', () => {
  it('여섯 막 모두에 질문이 있고, 재료와 글머리가 있다', () => {
    for (let a = 1; a <= MAX_ACT; a += 1) {
      const p = notePrompts.find((n) => n.act === a);
      expect(p, `제${a}막`).toBeDefined();
      expect(p!.starters.length).toBeGreaterThan(1);
      expect(p!.materials.length).toBeGreaterThan(1);
    }
  });
});
