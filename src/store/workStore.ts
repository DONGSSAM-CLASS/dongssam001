/**
 * 학생 탐색 기록(핀·루트) 상태.
 * - 세션이 있으면 Firestore `student_work/{sessionId}_{number}` 문서 1개에 배열로 저장(디바운스 1.5초).
 * - 세션이 없으면(자유 탐색) 브라우저 localStorage 에만 저장.
 */
import { create } from 'zustand';
import type { Pin, Route } from '@/types/firestore';
import { routeLengthKm } from '@/lib/history';

export interface PendingPin {
  lat: number;
  lon: number;
  year: number;
}

interface WorkState {
  /** null = 자유 탐색(로컬 저장) */
  sessionId: string | null;
  classId: string | null;
  number: number | null;
  uid: string | null;
  pins: Pin[];
  routes: Route[];
  pendingPin: PendingPin | null;
  /** 루트 작성 중 선택된 핀 id 순서 */
  draftRoute: string[];
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  lastSavedAt: number | null;
  error: string | null;

  reset: (ctx: { sessionId: string | null; classId: string | null; number: number | null; uid: string | null }) => void;
  setData: (pins: Pin[], routes: Route[]) => void;
  setPendingPin: (p: PendingPin | null) => void;
  addPin: (pin: Omit<Pin, 'id' | 'createdAt'>) => Pin;
  updatePin: (id: string, patch: Partial<Pin>) => void;
  removePin: (id: string) => void;
  toggleDraftPin: (id: string) => void;
  clearDraft: () => void;
  addRoute: (title: string, description: string) => Route | null;
  updateRoute: (id: string, patch: Partial<Route>) => void;
  removeRoute: (id: string) => void;
  setStatus: (s: Partial<Pick<WorkState, 'loading' | 'saving' | 'dirty' | 'lastSavedAt' | 'error'>>) => void;
}

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function routeKm(route: Pick<Route, 'pinIds'>, pins: Pin[]): number {
  const map = new Map(pins.map((p) => [p.id, p]));
  const pts = route.pinIds.map((id) => map.get(id)).filter(Boolean).map((p) => [p!.lat, p!.lon] as [number, number]);
  return Math.round(routeLengthKm(pts));
}

export const useWorkStore = create<WorkState>((set, get) => ({
  sessionId: null,
  classId: null,
  number: null,
  uid: null,
  pins: [],
  routes: [],
  pendingPin: null,
  draftRoute: [],
  loading: false,
  saving: false,
  dirty: false,
  lastSavedAt: null,
  error: null,

  reset: (ctx) => set({ ...ctx, pins: [], routes: [], pendingPin: null, draftRoute: [], dirty: false, error: null, lastSavedAt: null }),
  setData: (pins, routes) => set({ pins, routes, dirty: false }),
  setPendingPin: (pendingPin) => set({ pendingPin }),
  addPin: (pin) => {
    const p: Pin = { ...pin, id: newId(), createdAt: Date.now() };
    set((s) => ({ pins: [...s.pins, p], dirty: true, pendingPin: null }));
    return p;
  },
  updatePin: (id, patch) => set((s) => ({ pins: s.pins.map((p) => (p.id === id ? { ...p, ...patch } : p)), dirty: true })),
  removePin: (id) =>
    set((s) => ({
      pins: s.pins.filter((p) => p.id !== id),
      routes: s.routes.map((r) => ({ ...r, pinIds: r.pinIds.filter((x) => x !== id) })),
      draftRoute: s.draftRoute.filter((x) => x !== id),
      dirty: true,
    })),
  toggleDraftPin: (id) => set((s) => ({ draftRoute: s.draftRoute.includes(id) ? s.draftRoute.filter((x) => x !== id) : [...s.draftRoute, id] })),
  clearDraft: () => set({ draftRoute: [] }),
  addRoute: (title, description) => {
    const { draftRoute, pins } = get();
    if (draftRoute.length < 2) return null;
    const r: Route = { id: newId(), title: title.trim() || '이동 경로', description: description.trim(), pinIds: [...draftRoute], totalKm: routeKm({ pinIds: draftRoute }, pins), createdAt: Date.now() };
    set((s) => ({ routes: [...s.routes, r], draftRoute: [], dirty: true }));
    return r;
  },
  updateRoute: (id, patch) => set((s) => ({ routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch, totalKm: routeKm({ pinIds: patch.pinIds ?? r.pinIds }, s.pins) } : r)), dirty: true })),
  removeRoute: (id) => set((s) => ({ routes: s.routes.filter((r) => r.id !== id), dirty: true })),
  setStatus: (st) => set(st),
}));
