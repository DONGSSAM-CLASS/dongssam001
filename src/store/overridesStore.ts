import { create } from 'zustand';
import type { TeacherOverrideDoc } from '@/types/firestore';

interface OverridesState {
  /** 이 화면에 적용할 교사 수정본 (교사 본인 것 또는 소속 학급 담당 교사의 것) */
  overrides: (TeacherOverrideDoc & { id: string })[];
  loaded: boolean;
  set: (rows: (TeacherOverrideDoc & { id: string })[]) => void;
  reset: () => void;
}

export const useOverridesStore = create<OverridesState>((set) => ({
  overrides: [],
  loaded: false,
  set: (overrides) => set({ overrides, loaded: true }),
  reset: () => set({ overrides: [], loaded: false }),
}));
