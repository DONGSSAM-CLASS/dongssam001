/**
 * 기본 역사 데이터(정적 JSON) + 교사 수정본(teacher_overrides) 병합.
 * 기본 데이터는 그대로 두고, 교사 수정본은 그 교사의 학급에서만 적용된다.
 */
import { useMemo } from 'react';
import { dataset } from '@/data';
import { useOverridesStore } from '@/store/overridesStore';
import type { Figure, HistoryDataset, Place, Polity } from '@/types/history';
import type { TeacherOverrideDoc } from '@/types/firestore';

export interface MergedDataset {
  polities: Polity[];
  figures: Figure[];
  places: Place[];
  polityById: Map<string, Polity>;
  figureById: Map<string, Figure>;
  placeById: Map<string, Place>;
  /** 교사가 고치거나 추가한 항목 id (UI 에서 표시용) */
  changedIds: Set<string>;
}

function apply<T extends { id: string }>(base: T[], overrides: (TeacherOverrideDoc & { id: string })[], kind: string, changed: Set<string>): T[] {
  const mine = overrides.filter((o) => o.kind === kind);
  if (mine.length === 0) return base;
  const hidden = new Set(mine.filter((o) => o.op === 'hide').map((o) => o.targetId));
  const edits = new Map(mine.filter((o) => o.op === 'edit').map((o) => [o.targetId, o.data]));
  const adds = mine.filter((o) => o.op === 'add');
  const out = base
    .filter((it) => !hidden.has(it.id))
    .map((it) => {
      const patch = edits.get(it.id);
      if (!patch) return it;
      changed.add(it.id);
      return { ...it, ...(patch as Partial<T>) };
    });
  for (const a of adds) {
    changed.add(a.targetId);
    out.push({ ...(a.data as unknown as T), id: a.targetId });
  }
  for (const h of hidden) changed.add(h);
  return out;
}

export function mergeDataset(overrides: (TeacherOverrideDoc & { id: string })[]): MergedDataset {
  const changedIds = new Set<string>();
  const polities = apply<Polity>(dataset.polities, overrides, 'polity', changedIds);
  const figures = apply<Figure>(dataset.figures, overrides, 'figure', changedIds);
  const places = apply<Place>(dataset.places, overrides, 'place', changedIds);
  return {
    polities,
    figures,
    places,
    polityById: new Map(polities.map((p) => [p.id, p])),
    figureById: new Map(figures.map((f) => [f.id, f])),
    placeById: new Map(places.map((p) => [p.id, p])),
    changedIds,
  };
}

/** 화면에서 쓰는 병합 데이터 (교사 수정본이 없으면 기본 데이터 그대로) */
export function useMergedDataset(): MergedDataset {
  const overrides = useOverridesStore((s) => s.overrides);
  return useMemo(() => mergeDataset(overrides), [overrides]);
}

/** 사건·교역로·성취기준은 교사 수정 대상이 아니다 */
export const staticParts: Pick<HistoryDataset, 'events' | 'routes' | 'achievement_standards'> = {
  events: dataset.events,
  routes: dataset.routes,
  achievement_standards: dataset.achievement_standards,
};
