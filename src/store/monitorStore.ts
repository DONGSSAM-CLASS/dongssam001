import { create } from 'zustand';
import type { StudentWorkDoc } from '@/types/firestore';

interface MonitorState {
  /** 세션의 모든 학생 기록 (교사 화면에서만 채워진다) */
  works: (StudentWorkDoc & { id: string })[];
  /** null = 전체 보기, 숫자 = 그 번호 학생만 보기 */
  onlyNumber: number | null;
  showClassWork: boolean;
  setWorks: (works: (StudentWorkDoc & { id: string })[]) => void;
  setOnlyNumber: (n: number | null) => void;
  setShowClassWork: (v: boolean) => void;
  reset: () => void;
}

export const useMonitorStore = create<MonitorState>((set) => ({
  works: [],
  onlyNumber: null,
  showClassWork: true,
  setWorks: (works) => set({ works }),
  setOnlyNumber: (onlyNumber) => set({ onlyNumber }),
  setShowClassWork: (showClassWork) => set({ showClassWork }),
  reset: () => set({ works: [], onlyNumber: null, showClassWork: true }),
}));
