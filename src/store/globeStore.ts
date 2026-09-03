import { create } from 'zustand';
import type { LayerKey } from '@/types/firestore';
import type { Subject } from '@/types/history';
import { YEAR_MAX, YEAR_MIN } from '@/data';

export type YearStep = 100 | 10 | 1;
/** 지구본 클릭 도구: 선택 / 핀 찍기 / 거리 재기 */
export type GlobeTool = 'select' | 'pin' | 'measure';
export type SelectionKind = 'polity' | 'figure' | 'place' | 'event';
export interface Selection {
  kind: SelectionKind;
  id: string;
}
export interface FlyTarget {
  lat: number;
  lon: number;
  /** 카메라 거리(지구 반지름=1 기준). 생략 시 현재 거리 유지 */
  distance?: number;
  /** 같은 좌표로 연속 이동해도 애니메이션이 다시 실행되도록 하는 토큰 */
  token: number;
}

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  polities: true,
  figures: true,
  places: true,
  routes: false,
  modernBorders: false,
};

interface GlobeState {
  year: number;
  step: YearStep;
  layers: Record<LayerKey, boolean>;
  selection: Selection | null;
  showEnglish: boolean;
  textbookFilter: Subject | 'all';
  textbookOnly: boolean;
  listMode: boolean;
  fly: FlyTarget | null;
  /** 프레임레이트 확인용 */
  fps: number;
  tool: GlobeTool;
  /** 거리 재기 도구로 찍은 지점(최대 2개) */
  measurePoints: [number, number][];
  /** 세션에서 강조하는 국가·인물 id */
  highlightPolities: string[];
  highlightFigures: string[];

  setYear: (year: number) => void;
  shiftYear: (delta: number) => void;
  setStep: (step: YearStep) => void;
  toggleLayer: (key: LayerKey) => void;
  setLayers: (layers: Partial<Record<LayerKey, boolean>>) => void;
  select: (sel: Selection | null) => void;
  setShowEnglish: (v: boolean) => void;
  setTextbookFilter: (v: Subject | 'all') => void;
  setTextbookOnly: (v: boolean) => void;
  setListMode: (v: boolean) => void;
  flyTo: (lat: number, lon: number, distance?: number) => void;
  setFps: (fps: number) => void;
  setTool: (tool: GlobeTool) => void;
  addMeasurePoint: (p: [number, number]) => void;
  clearMeasure: () => void;
  setHighlights: (polities: string[], figures: string[]) => void;
}

export const clampYear = (y: number) => Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.round(y)));

export const useGlobeStore = create<GlobeState>((set, get) => ({
  year: 1200,
  step: 10,
  layers: { ...DEFAULT_LAYERS },
  selection: null,
  showEnglish: false,
  textbookFilter: 'all',
  textbookOnly: true,
  listMode: false,
  fly: null,
  fps: 0,
  tool: 'select',
  measurePoints: [],
  highlightPolities: [],
  highlightFigures: [],

  setYear: (year) => set({ year: clampYear(year) }),
  shiftYear: (delta) => set({ year: clampYear(get().year + delta) }),
  setStep: (step) => set({ step }),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLayers: (layers) => set((s) => ({ layers: { ...s.layers, ...layers } })),
  select: (selection) => set({ selection }),
  setShowEnglish: (showEnglish) => set({ showEnglish }),
  setTextbookFilter: (textbookFilter) => set({ textbookFilter }),
  setTextbookOnly: (textbookOnly) => set({ textbookOnly }),
  setListMode: (listMode) => set({ listMode }),
  flyTo: (lat, lon, distance) => set({ fly: { lat, lon, distance, token: Date.now() + Math.random() } }),
  setFps: (fps) => set({ fps }),
  setTool: (tool) => set({ tool, measurePoints: tool === 'measure' ? get().measurePoints : [] }),
  addMeasurePoint: (p) => set((s) => ({ measurePoints: s.measurePoints.length >= 2 ? [p] : [...s.measurePoints, p] })),
  clearMeasure: () => set({ measurePoints: [] }),
  setHighlights: (highlightPolities, highlightFigures) => set({ highlightPolities, highlightFigures }),
}));
