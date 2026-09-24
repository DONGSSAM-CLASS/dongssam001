import { create } from 'zustand';

/**
 * 화면 설정 — 게임 기록과 따로, 이 기기에만 저장한다.
 *
 * 1인칭은 멀미가 나거나 조작이 버거운 학생이 있다. 교실에서 바로 고칠 수 있게 한다.
 */
export interface Settings {
  /** 글자 크게 */
  largeText: boolean;
  /** 걸을 때 화면이 위아래로 흔들리는 효과 */
  headBob: boolean;
  /** 둘러보기 감도 (0.5 ~ 1.8) */
  lookSpeed: number;
  /** 효과음 */
  sound: boolean;
  /** 이름표·말풍선을 늘 보이기 (저시력 학생) */
  alwaysLabels: boolean;
}

const KEY = 'imjeong-rpg2:settings';
const DEFAULTS: Settings = { largeText: false, headBob: true, lookSpeed: 1, sound: true, alwaysLabels: false };

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export const useSettings = create<Settings & { set(patch: Partial<Settings>): void }>((set, get) => ({
  ...load(),
  set(patch) {
    set(patch);
    const { set: _omit, ...rest } = { ...get(), ...patch };
    void _omit;
    try {
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      /* 무시 */
    }
  },
}));
