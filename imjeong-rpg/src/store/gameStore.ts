import { create } from 'zustand';
import type { Level, MapId, Quest, ResourceDelta, Resources, SaveState } from '../types';
import { figures } from '../data/figures';
import { quests } from '../data/quests';
import { getMap } from '../data/maps';
import { applyDelta, isUnlocked, resolveQuest } from '../engine/rules';
import { clearSave, emptySave, loadSave, writeSave } from '../engine/save';

/** 화면 오른쪽에 열리는 패널 */
export type PanelKind = 'quests' | 'party' | 'timeline' | 'atlas' | 'items' | 'help' | null;

export interface DialogueState {
  figureId: string;
  /** 이 인물이 줄 수 있는 퀘스트 */
  questId: string | null;
}

/** 퀘스트 풀이 화면 상태 */
export interface QuestAttempt {
  questId: string;
  picked: string[];
  submitted: boolean;
  correct: boolean;
  gained: ResourceDelta;
}

export interface GameState extends SaveState {
  /** 화면 상태 (저장하지 않는다) */
  dialogue: DialogueState | null;
  attempt: QuestAttempt | null;
  panel: PanelKind;
  /** 최근 활동 기록 — 화면 아래 흐르는 로그 */
  log: string[];
  /** 게임을 시작했는지 (인트로 화면을 지났는지) */
  started: boolean;
  /** 첫 조작 안내를 보여 줄지 */
  showTutorial: boolean;

  setLevel(level: Level): void;
  start(level: Level): void;
  travel(map: MapId): void;
  openDialogue(figureId: string): void;
  closeDialogue(): void;
  openQuest(questId: string): void;
  pick(choiceId: string): void;
  submit(): void;
  closeQuest(): void;
  recruit(figureId: string): void;
  retryQuest(): void;
  setPanel(panel: PanelKind): void;
  closeTutorial(): void;
  openTutorial(): void;
  pushLog(message: string): void;
  resetGame(): void;
  hydrate(): void;
}

/** 저장할 항목만 골라낸다 */
function toSave(state: GameState): SaveState {
  return {
    version: state.version,
    level: state.level,
    act: state.act,
    map: state.map,
    resources: state.resources,
    completed: state.completed,
    party: state.party,
    items: state.items,
    badges: state.badges,
    savedAt: Date.now(),
  };
}

/** 지금 이 인물에게 받을 수 있는 퀘스트를 고른다 */
export function availableQuestFor(
  figureId: string,
  mapId: MapId,
  completed: Record<string, boolean>,
): Quest | null {
  const candidates = quests.filter(
    (q) => q.giver === figureId && q.map === mapId && !(q.id in completed) && isUnlocked(q, completed),
  );
  return candidates.sort((a, b) => a.act - b.act)[0] ?? null;
}

/** 완료한 퀘스트 수로 현재 막을 계산한다 */
function actFromProgress(completed: Record<string, boolean>): number {
  const done = new Set(Object.keys(completed));
  // 어떤 막의 퀘스트를 모두 풀면 다음 막이 열린다.
  let act = 1;
  for (let a = 1; a <= 6; a += 1) {
    const inAct = quests.filter((q) => q.act === a);
    if (inAct.length > 0 && inAct.every((q) => done.has(q.id))) act = a + 1;
  }
  return Math.min(6, act);
}

export const useGame = create<GameState>((set, get) => ({
  ...emptySave(),
  dialogue: null,
  attempt: null,
  panel: null,
  log: [],
  started: false,
  showTutorial: false,

  hydrate() {
    const saved = loadSave();
    if (saved) set({ ...saved, started: true, showTutorial: !tutorialSeen() });
  },

  setLevel(level) {
    set({ level });
    writeSave(toSave({ ...get(), level }));
  },

  start(level) {
    const fresh = emptySave();
    set({
      ...fresh,
      level,
      started: true,
      showTutorial: !tutorialSeen(),
      log: ['1919년 4월, 상하이 프랑스 조계에 도착했다.'],
    });
    writeSave({ ...fresh, level });
  },

  travel(map) {
    const { level } = get();
    const target = getMap(map);
    set((s) => ({
      map,
      panel: null,
      dialogue: null,
      attempt: null,
      log: [`${target.name}(으)로 이동했다. — ${target.period}`, ...s.log].slice(0, 40),
    }));
    writeSave(toSave({ ...get(), map, level }));
  },

  openDialogue(figureId) {
    const { map, completed } = get();
    const quest = availableQuestFor(figureId, map, completed);
    set({ dialogue: { figureId, questId: quest?.id ?? null }, panel: null });
  },

  closeDialogue() {
    set({ dialogue: null });
  },

  openQuest(questId) {
    set({ attempt: { questId, picked: [], submitted: false, correct: false, gained: {} } });
  },

  /**
   * 선택지를 고른다.
   *  - choice: 하나만 (다시 누르면 바꿈)
   *  - multi : 여러 개 (다시 누르면 해제)
   *  - order : 누른 순서대로 쌓임 (다시 누르면 뺌)
   */
  pick(choiceId) {
    const { attempt } = get();
    if (!attempt || attempt.submitted) return;
    const quest = quests.find((q) => q.id === attempt.questId);
    if (!quest) return;
    let picked: string[];
    if (quest.kind === 'choice') {
      picked = attempt.picked[0] === choiceId ? [] : [choiceId];
    } else {
      picked = attempt.picked.includes(choiceId)
        ? attempt.picked.filter((id) => id !== choiceId)
        : [...attempt.picked, choiceId];
    }
    set({ attempt: { ...attempt, picked } });
  },

  submit() {
    const state = get();
    const { attempt, resources } = state;
    if (!attempt || attempt.submitted) return;
    const quest = quests.find((q) => q.id === attempt.questId);
    if (!quest) return;

    const result = resolveQuest(quest, attempt.picked, resources);
    const completed = { ...state.completed, [quest.id]: result.correct };
    const badges = result.correct && !state.badges.includes(quest.badge.label)
      ? [...state.badges, quest.badge.label]
      : state.badges;
    const act = actFromProgress(completed);

    const verdict = result.correct ? '사료와 맞았다' : '사료와 어긋났다';
    const next: Partial<GameState> = {
      attempt: { ...attempt, submitted: true, correct: result.correct, gained: result.gained },
      resources: result.resources,
      completed,
      badges,
      act,
      log: [`[${quest.dateLabel}] ${quest.title} — ${verdict}.`, ...state.log].slice(0, 40),
    };
    set(next);
    writeSave(toSave({ ...get() }));
  },

  closeQuest() {
    set({ attempt: null, dialogue: null });
  },

  /**
   * 다시 풀기 — 틀렸을 때 같은 문제를 한 번 더 풀 수 있게 한다.
   * 이미 받은 보상과 기록은 그대로 두고, 맞히면 완료 표시만 정답으로 바꾼다.
   * (중학생이 한 번 틀렸다고 막히면 게임을 그만두게 된다.)
   */
  retryQuest() {
    const { attempt } = get();
    if (!attempt) return;
    set({ attempt: { ...attempt, picked: [], submitted: false, correct: false, gained: {} } });
  },

  recruit(figureId) {
    const state = get();
    if (state.party.includes(figureId)) return;
    const figure = figures[figureId];
    if (!figure?.recruitable) return;
    const bonus = figure.bonus ?? {};
    const resources: Resources = applyDelta(state.resources, bonus);
    set({
      party: [...state.party, figureId],
      resources,
      log: [`${figure.name}이(가) 동지로 합류했다.`, ...state.log].slice(0, 40),
    });
    writeSave(toSave({ ...get() }));
  },

  setPanel(panel) {
    set((s) => ({ panel: s.panel === panel ? null : panel }));
  },

  closeTutorial() {
    markTutorialSeen();
    set({ showTutorial: false });
  },

  openTutorial() {
    set({ showTutorial: true, panel: null });
  },

  pushLog(message) {
    set((s) => ({ log: [message, ...s.log].slice(0, 40) }));
  },

  resetGame() {
    clearSave();
    set({ ...emptySave(), dialogue: null, attempt: null, panel: null, log: [], started: false });
  },
}));

/* ── 조작 안내를 이미 봤는지 (기기마다 한 번만) ── */
const TUTORIAL_KEY = 'imjeong-rpg:tutorial-seen';

function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

function markTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    /* 시크릿 모드면 그냥 매번 보여 준다 */
  }
}

/** 전체 퀘스트 수 (진행률 계산용) */
export const TOTAL_QUESTS = quests.length;
