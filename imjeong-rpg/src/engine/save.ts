import type { MapId, SaveState } from '../types';
import { INITIAL_RESOURCES } from './rules';

/**
 * 진행 상황 저장 — 브라우저의 localStorage 하나만 쓴다.
 *
 * 학교 수업에서 계정을 만들게 하면 개인정보 수집 문제가 생긴다.
 * 이 게임은 이름·이메일을 받지 않고, 진행 기록을 그 컴퓨터 안에만 둔다.
 * (학급 단위로 기록을 모으고 싶다면 Firestore 연동을 나중에 얹을 수 있다.)
 */

const KEY = 'imjeong-rpg:save:v1';
export const SAVE_VERSION = 1;

export function emptySave(): SaveState {
  return {
    version: SAVE_VERSION,
    level: 'middle',
    act: 1,
    map: 'shanghai',
    resources: { ...INITIAL_RESOURCES },
    completed: {},
    party: [],
    items: [],
    badges: [],
    savedAt: Date.now(),
  };
}

export function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    if (parsed.version !== SAVE_VERSION) return null;
    // 저장 파일이 손상되었을 때 게임이 아예 안 열리는 일이 없도록 기본값으로 메운다.
    const base = emptySave();
    return {
      ...base,
      ...parsed,
      resources: { ...base.resources, ...(parsed.resources ?? {}) },
      completed: parsed.completed ?? {},
      party: parsed.party ?? [],
      items: parsed.items ?? [],
      badges: parsed.badges ?? [],
      map: (parsed.map ?? base.map) as MapId,
    };
  } catch {
    return null;
  }
}

export function writeSave(state: SaveState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    // 시크릿 모드나 저장 공간 제한이면 조용히 넘어간다 — 게임은 계속되어야 한다.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
