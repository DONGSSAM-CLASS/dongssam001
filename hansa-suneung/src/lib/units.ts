import type { Curriculum, Unit } from '../types/schema';

/** 트리를 평탄화하며 각 노드에 부모 경로를 계산한다. */
export interface FlatUnit {
  unit: Unit;
  /** 루트 → 현재 노드까지의 조상 목록(자기 자신 제외) */
  ancestors: Unit[];
}

export function flattenUnits(units: Unit[], ancestors: Unit[] = []): FlatUnit[] {
  const out: FlatUnit[] = [];
  for (const u of units) {
    out.push({ unit: u, ancestors });
    if (u.children?.length) {
      out.push(...flattenUnits(u.children, [...ancestors, u]));
    }
  }
  return out;
}

export function buildUnitIndex(curriculum: Curriculum) {
  const flat = flattenUnits(curriculum.units);
  const byId = new Map<string, FlatUnit>();
  for (const f of flat) byId.set(f.unit.id, f);
  return { flat, byId };
}

/** 특정 단원과 그 하위 소단원들의 id 전체(자기 자신 포함) */
export function descendantIds(unit: Unit): string[] {
  const ids = [unit.id];
  if (unit.children?.length) {
    for (const c of unit.children) ids.push(...descendantIds(c));
  }
  return ids;
}

/** 대단원 → 중단원 → 소단원 경로 문자열 (예: "조선 … > 조선 후기의 변동 > 수취 체제의 개편") */
export function unitPath(byId: Map<string, FlatUnit>, unitId: string): string {
  const f = byId.get(unitId);
  if (!f) return unitId;
  return [...f.ancestors, f.unit].map((u) => u.title).join(' › ');
}

/** 소단원(리프) 목록 — 히트맵 행 등에 사용 */
export function leafUnits(units: Unit[]): Unit[] {
  const flat = flattenUnits(units);
  return flat.filter((f) => !f.unit.children?.length).map((f) => f.unit);
}
