import { create } from 'zustand';
import type { Level, MapId, Quest, ResourceDelta, SaveState } from '../types';
import { MAX_ACT, getQuest, quests } from '../data/quests';
import { getRelic, relics as relicTable } from '../data/relics';
import { NOTE_MIN } from '../data/notes';
import { sfx } from '../ui/sound';
import { decodeProgress, encodeProgress } from '../engine/progressCode';
import { figures } from '../data/figures';
import {
  POINTS,
  actFromProgress,
  applyDelta,
  canDonate,
  computePointsEarned,
  isActComplete,
  isUnlocked,
  resolveQuest,
  upsertLetter,
} from '../engine/rules';
import { clearSave, emptySave, loadSave, writeSave } from '../engine/save';

/**
 * 게임 상태 (zustand). 1탄과 같은 구조를 따르되,
 * 2탄에서는 보훈 포인트·기부·편지·막 전환·프롤로그가 더해졌다.
 */

export type PanelKind = 'quests' | 'blueprint' | 'timeline' | 'atlas' | 'relics' | 'notes' | 'settings' | 'help' | null;

export interface DialogueState {
  figureId: string;
  questId: string | null;
}

export interface QuestAttempt {
  questId: string;
  picked: string[];
  submitted: boolean;
  correct: boolean;
  gained: ResourceDelta;
  points: number;
}

/** 막마다 쓰는 장소 */
export const ACT_MAP: Record<number, MapId> = {
  1: 'assembly',
  2: 'hafei',
  3: 'madang',
  4: 'chongqing',
  5: 'seoul',
  6: 'memorial',
};

export const TOTAL_QUESTS = quests.length;

export interface GameState extends SaveState {
  dialogue: DialogueState | null;
  attempt: QuestAttempt | null;
  panel: PanelKind;
  log: string[];
  started: boolean;
  showTutorial: boolean;
  /** 막 전환 화면 */
  actCard: number | null;
  /** 방금 주운 기록 조각 */
  relicCard: string | null;
  /** 열어 본 공훈 명패 */
  plaque: string | null;
  /** 감사 증서(엔딩) 화면 */
  ending: boolean;
  /** 잠깐 떴다 사라지는 알림 */
  toast: { text: string; id: number } | null;
  /** 생각 노트 쓰기 창 (막 번호) */
  noteCard: number | null;
  /** 1탄 돌아보기 창 */
  recapOpen: boolean;

  start(level: Level, nickname: string, prequelPlayed: 'yes' | 'no' | null): void;
  restoreFromCode(code: string, nickname: string): boolean;
  openNote(act: number): void;
  closeNote(): void;
  writeNote(act: number, text: string): void;
  setRecap(open: boolean): void;
  answerRecall(id: string, correct: boolean): void;
  hydrate(): void;
  setLevel(level: Level): void;
  travel(map: MapId): void;
  openDialogue(figureId: string): void;
  closeDialogue(): void;
  finishPrologue(): void;
  openQuest(questId: string): void;
  pick(choiceId: string): void;
  submit(): void;
  retryQuest(): void;
  closeQuest(): void;
  collectRelic(relicId: string): void;
  closeRelic(): void;
  openPlaque(figureId: string): void;
  closePlaque(): void;
  donate(figureId: string, amount: number): boolean;
  writeLetter(figureId: string, body: string): void;
  setPanel(panel: PanelKind): void;
  closeActCard(): void;
  openTutorial(): void;
  closeTutorial(): void;
  setEnding(open: boolean): void;
  pushLog(message: string): void;
  notify(text: string): void;
  resetGame(): void;
}

function toSave(state: GameState): SaveState {
  return {
    version: state.version,
    level: state.level,
    nickname: state.nickname,
    act: state.act,
    map: state.map,
    resources: state.resources,
    completed: state.completed,
    missed: state.missed,
    relics: state.relics,
    badges: state.badges,
    points: state.points,
    pointsEarned: state.pointsEarned,
    donations: state.donations,
    letters: state.letters,
    seenActs: state.seenActs,
    prologueDone: state.prologueDone,
    notes: state.notes,
    prequelPlayed: state.prequelPlayed,
    recall: state.recall,
    savedAt: Date.now(),
  };
}

/** 이 사람에게 지금 받을 수 있는 퀘스트 (같은 맵 · 선행 조건 충족 · 아직 못 푼 것) */
export function availableQuestFor(
  figureId: string,
  mapId: MapId,
  completed: Record<string, boolean>,
  act: number,
): Quest | null {
  return (
    quests.find(
      (q) =>
        q.giver === figureId &&
        q.map === mapId &&
        q.act <= act &&
        completed[q.id] !== true &&
        isUnlocked(q, completed),
    ) ?? null
  );
}

const TUTORIAL_KEY = 'imjeong-rpg2:tutorial-seen';
function tutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

let toastId = 0;

export const useGame = create<GameState>((set, get) => {
  const save = () => writeSave(toSave(get()));

  return {
    ...emptySave(),
    dialogue: null,
    attempt: null,
    panel: null,
    log: [],
    started: false,
    showTutorial: false,
    actCard: null,
    relicCard: null,
    plaque: null,
    ending: false,
    toast: null,
    noteCard: null,
    recapOpen: false,

    start(level, nickname, prequelPlayed) {
      const fresh = emptySave();
      set({
        ...fresh,
        level,
        prequelPlayed,
        nickname: nickname.trim().slice(0, 12),
        act: 1,
        started: true,
        showTutorial: !tutorialSeen(),
        log: ['보훈의 전당에 들어섰다. 해설사 선생님이 기다리고 있다.'],
        dialogue: null,
        attempt: null,
        panel: null,
        actCard: null,
        relicCard: null,
        plaque: null,
        ending: false,
      });
      save();
    },

    restoreFromCode(code, nickname) {
      const snap = decodeProgress(code, quests.map((q) => q.id), relicTable.map((r) => r.id));
      if (!snap) return false;
      const completed = Object.fromEntries(snap.completed.map((id) => [id, true]));
      const act = actFromProgress(quests, completed, MAX_ACT);
      const notes: Record<number, string> = {};
      for (const n of snap.notes) notes[n] = '(다른 기기에서 쓴 생각 노트 — 글은 옮겨 오지 않았어요)';
      const earned = computePointsEarned(quests, completed, snap.missed, snap.relics.length, snap.notes.length, MAX_ACT);
      const fresh = emptySave();
      // 지표는 맞힌 퀘스트의 보상으로 다시 쌓는다 (고른 선택지 기록은 코드에 없다)
      let resources = fresh.resources;
      for (const q of quests) if (completed[q.id]) resources = applyDelta(resources, q.reward);
      const map = act > MAX_ACT ? 'memorial' : ACT_MAP[act];
      set({
        ...fresh,
        level: snap.level,
        nickname: nickname.trim().slice(0, 12),
        prologueDone: snap.prologueDone || act > 1,
        completed,
        missed: snap.missed,
        relics: snap.relics,
        notes,
        act,
        map: snap.prologueDone ? map : 'memorial',
        seenActs: Array.from({ length: Math.min(act, MAX_ACT) }, (_, i) => i + 1),
        badges: quests.filter((q) => completed[q.id]).map((q) => q.badge.label),
        resources,
        points: earned,
        pointsEarned: earned,
        started: true,
        showTutorial: false,
        log: ['진행 코드로 기록을 이어 펼쳤다. (편지와 생각 노트의 글은 옮겨 오지 않는다)'],
      });
      save();
      return true;
    },

    openNote(act) {
      set({ noteCard: act, dialogue: null, panel: null });
    },

    closeNote() {
      set({ noteCard: null });
    },

    writeNote(act, text) {
      const s = get();
      const body = text.trim();
      if (body.replace(/\s+/g, '').length < NOTE_MIN) return;
      const first = !(act in s.notes);
      set({
        notes: { ...s.notes, [act]: body },
        noteCard: null,
        points: s.points + (first ? POINTS.note : 0),
        pointsEarned: s.pointsEarned + (first ? POINTS.note : 0),
      });
      get().pushLog(act === 6 ? '나의 보훈 다짐을 적었다.' : `생각 노트 ${act}을(를) 적었다.${first ? ` 보훈 포인트 +${POINTS.note}` : ''}`);
      if (first) sfx.relic();
      save();
    },

    setRecap(open) {
      set({ recapOpen: open, dialogue: null });
    },

    answerRecall(id, correct) {
      const s = get();
      if (!correct || s.recall.includes(id)) return;
      set({ recall: [...s.recall, id], points: s.points + POINTS.recall, pointsEarned: s.pointsEarned + POINTS.recall });
      get().pushLog(`1탄의 기억을 꺼냈다. 보훈 포인트 +${POINTS.recall}`);
      save();
    },

    hydrate() {
      const saved = loadSave();
      if (!saved) return;
      const act = actFromProgress(quests, saved.completed, MAX_ACT);
      set({ ...saved, act, started: true, showTutorial: false, log: ['지난 기록을 이어서 펼친다.'] });
    },

    setLevel(level) {
      set({ level });
      save();
    },

    travel(map) {
      const state = get();
      if (map === state.map) return;
      // 처음 가는 막의 장소라면 시대 전환 화면을 띄운다
      const actHere = Number(Object.keys(ACT_MAP).find((k) => ACT_MAP[Number(k)] === map && Number(k) === state.act) ?? 0);
      const showCard = actHere > 0 && !state.seenActs.includes(actHere);
      set({
        map,
        dialogue: null,
        attempt: null,
        panel: null,
        plaque: null,
        actCard: showCard ? actHere : null,
        seenActs: showCard ? [...state.seenActs, actHere] : state.seenActs,
      });
      get().pushLog(`시간의 문을 지나 ${mapLabel(map)}에 도착했다.`);
      sfx.portal();
      save();
    },

    openDialogue(figureId) {
      const s = get();
      const quest = availableQuestFor(figureId, s.map, s.completed, s.act);
      set({ dialogue: { figureId, questId: quest?.id ?? null }, panel: null });
    },

    closeDialogue() {
      set({ dialogue: null });
    },

    finishPrologue() {
      set({ prologueDone: true, dialogue: null });
      get().pushLog('시간의 문이 열렸다. 1919년 상하이로 가자.');
      get().notify('🚪 시간의 문이 열렸어요! 붉은 길 끝의 문으로 걸어가세요.');
      save();
    },

    openQuest(questId) {
      set({
        attempt: { questId, picked: [], submitted: false, correct: false, gained: {}, points: 0 },
        dialogue: null,
      });
    },

    pick(choiceId) {
      const a = get().attempt;
      if (!a || a.submitted) return;
      const quest = getQuest(a.questId);
      let picked: string[];
      if (quest.kind === 'choice') picked = [choiceId];
      else if (a.picked.includes(choiceId)) picked = a.picked.filter((id) => id !== choiceId);
      else picked = [...a.picked, choiceId];
      set({ attempt: { ...a, picked } });
    },

    submit() {
      const s = get();
      const a = s.attempt;
      if (!a || a.submitted) return;
      const quest = getQuest(a.questId);
      const missedBefore = s.missed.includes(quest.id);
      const result = resolveQuest(quest, a.picked, s.resources, missedBefore);

      const completed = result.correct ? { ...s.completed, [quest.id]: true } : s.completed;
      const missed = !result.correct && !missedBefore ? [...s.missed, quest.id] : s.missed;
      let points = s.points + result.points;
      let pointsEarned = s.pointsEarned + result.points;
      const badges =
        result.correct && !s.badges.includes(quest.badge.label) ? [...s.badges, quest.badge.label] : s.badges;

      const logs: string[] = [];
      if (result.correct) {
        logs.push(`「${quest.title}」을(를) 기록했다. 보훈 포인트 +${result.points}`);
        // 막을 모두 마쳤으면 보너스
        if (isActComplete(quests, completed, quest.act) && !isActComplete(quests, s.completed, quest.act)) {
          points += POINTS.actComplete;
          pointsEarned += POINTS.actComplete;
          logs.push(`제${quest.act}막의 기록을 모두 마쳤다! 보훈 포인트 +${POINTS.actComplete} · 시간의 문이 열렸다.`);
        }
      } else {
        logs.push(`「${quest.title}」 — 사료와 어긋났다. 해설을 읽고 다시 풀어 보자.`);
      }

      set({
        attempt: { ...a, submitted: true, correct: result.correct, gained: result.gained, points: result.points },
        resources: result.resources,
        completed,
        missed,
        points,
        pointsEarned,
        badges,
        act: actFromProgress(quests, completed, MAX_ACT),
      });
      for (const l of logs) get().pushLog(l);
      if (result.correct) sfx.correct();
      else sfx.wrong();
      save();
    },

    retryQuest() {
      const a = get().attempt;
      if (!a) return;
      set({ attempt: { questId: a.questId, picked: [], submitted: false, correct: false, gained: {}, points: 0 } });
    },

    closeQuest() {
      const a = get().attempt;
      set({ attempt: null });
      if (a?.submitted && a.correct) {
        const quest = getQuest(a.questId);
        if (isActComplete(quests, get().completed, quest.act)) {
          if (!(quest.act in get().notes)) set({ noteCard: quest.act });
          if (quest.act < MAX_ACT) get().notify('🚪 이 시대의 기록을 모두 마쳤어요. 시간의 문으로 가면 다음 시대로 건너갑니다.');
        }
      }
    },

    collectRelic(relicId) {
      const s = get();
      if (s.relics.includes(relicId)) return;
      const relic = getRelic(relicId);
      set({
        relics: [...s.relics, relicId],
        points: s.points + POINTS.relic,
        pointsEarned: s.pointsEarned + POINTS.relic,
        relicCard: relicId,
      });
      sfx.relic();
      get().pushLog(`기록 조각 「${relic?.name ?? relicId}」을(를) 주웠다. 보훈 포인트 +${POINTS.relic}`);
      save();
    },

    closeRelic() {
      set({ relicCard: null });
    },

    openPlaque(figureId) {
      set({ plaque: figureId, dialogue: null, panel: null });
    },

    closePlaque() {
      set({ plaque: null });
    },

    donate(figureId, amount) {
      const s = get();
      if (!canDonate(s.points, amount)) return false;
      set({
        points: s.points - amount,
        donations: { ...s.donations, [figureId]: (s.donations[figureId] ?? 0) + amount },
      });
      get().pushLog(`${figures[figureId]?.name ?? ''}께 보훈 포인트 ${amount}을(를) 기부하고 국화를 올렸다.`);
      sfx.honor();
      save();
      return true;
    },

    writeLetter(figureId, body) {
      const s = get();
      set({ letters: upsertLetter(s.letters, { figureId, body: body.trim(), writtenAt: Date.now() }) });
      get().pushLog(`${figures[figureId]?.name ?? ''}께 감사 편지를 올렸다.`);
      sfx.honor();
      save();
    },

    setPanel(panel) {
      set((s) => ({ panel: s.panel === panel ? null : panel }));
    },

    closeActCard() {
      set({ actCard: null });
    },

    openTutorial() {
      set({ showTutorial: true, panel: null });
    },

    closeTutorial() {
      try {
        localStorage.setItem(TUTORIAL_KEY, '1');
      } catch {
        /* 무시 */
      }
      set({ showTutorial: false });
    },

    setEnding(open) {
      set({ ending: open, plaque: null, dialogue: null, panel: null });
    },

    pushLog(message) {
      set((s) => ({ log: [message, ...s.log].slice(0, 30) }));
    },

    notify(text) {
      toastId += 1;
      const id = toastId;
      set({ toast: { text, id } });
      window.setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 4800);
    },

    resetGame() {
      clearSave();
      set({ ...emptySave(), started: false, dialogue: null, attempt: null, panel: null, ending: false, log: [] });
    },
  };
});

export function mapLabel(map: MapId): string {
  return {
    memorial: '보훈의 전당',
    assembly: '1919년 상하이 김신부로',
    hafei: '1919년 상하이 하비로',
    madang: '1920년대 상하이 마당로',
    chongqing: '1940년 충칭',
    seoul: '1945년 서울 경교장',
  }[map];
}

/** 지금 기록의 진행 코드 */
export function currentProgressCode(s: GameState): string {
  return encodeProgress(
    {
      level: s.level,
      prologueDone: s.prologueDone,
      completed: Object.keys(s.completed).filter((k) => s.completed[k]),
      missed: s.missed,
      relics: s.relics,
      notes: Object.keys(s.notes).map(Number),
    },
    quests.map((q) => q.id),
    relicTable.map((r) => r.id),
  );
}
