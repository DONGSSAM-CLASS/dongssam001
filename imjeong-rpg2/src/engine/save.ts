import type { MapId, SaveState } from '../types';
import { INITIAL_RESOURCES } from './rules';

/**
 * 진행 저장 — 브라우저 localStorage 하나만 쓴다. (1탄과 같은 원칙)
 * 이름·이메일을 받지 않는다. 학생이 편지 끝에 적을 「부름말」도 이 기기 안에만 둔다.
 * 1탄과 저장 키가 달라 두 게임의 기록이 섞이지 않는다.
 */

const KEY = 'imjeong-rpg2:save:v1';
export const SAVE_VERSION = 1;
const MAP_IDS: MapId[] = ['memorial', 'assembly', 'hafei', 'madang', 'chongqing', 'seoul'];

export function emptySave(): SaveState {
  return {
    version: SAVE_VERSION,
    level: 'middle',
    nickname: '',
    act: 0,
    map: 'memorial',
    resources: { ...INITIAL_RESOURCES },
    completed: {},
    missed: [],
    relics: [],
    badges: [],
    points: 0,
    pointsEarned: 0,
    donations: {},
    letters: [],
    seenActs: [],
    prologueDone: false,
    notes: {},
    prequelPlayed: null,
    recall: [],
    savedAt: Date.now(),
  };
}

export function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    if (parsed.version !== SAVE_VERSION) return null;
    const base = emptySave();
    return {
      ...base,
      ...parsed,
      resources: { ...base.resources, ...(parsed.resources ?? {}) },
      completed: parsed.completed ?? {},
      missed: parsed.missed ?? [],
      relics: parsed.relics ?? [],
      badges: parsed.badges ?? [],
      donations: parsed.donations ?? {},
      letters: parsed.letters ?? [],
      seenActs: parsed.seenActs ?? [],
      notes: parsed.notes ?? {},
      recall: parsed.recall ?? [],
      map: MAP_IDS.includes(parsed.map as MapId) ? (parsed.map as MapId) : base.map,
    };
  } catch {
    return null;
  }
}

export function writeSave(state: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    /* 시크릿 모드 등 — 게임은 계속된다 */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
