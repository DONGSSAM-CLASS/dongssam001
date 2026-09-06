import type { Exam, Item, Unit } from '../types/schema';
import { flattenUnits, descendantIds, type FlatUnit } from './units';

export interface HeatRow {
  unit: Unit;
  /** 이 행이 속한 대단원(최상위 조상). 그룹 헤더 표시용. */
  top: Unit;
  /** 학년도별 출제 수 (schoolYears 와 같은 순서) */
  counts: number[];
  total: number;
}

/**
 * 히트맵 데이터: 소단원(리프)을 행으로, 학년도를 열로 하여 출제 수를 집계한다.
 * verifiedOnly=true 면 검수 완료 문항만 센다(학생 화면).
 */
export function buildHeatmap(
  units: Unit[],
  items: Item[],
  examById: Map<string, Exam>,
  schoolYears: number[],
  verifiedOnly: boolean,
): { rows: HeatRow[]; max: number; colTotals: number[] } {
  const flat: FlatUnit[] = flattenUnits(units);
  const leaves = flat.filter((f) => !f.unit.children?.length);

  const yearIndex = new Map(schoolYears.map((y, i) => [y, i]));
  const rows: HeatRow[] = [];
  let max = 0;
  const colTotals = schoolYears.map(() => 0);

  for (const leaf of leaves) {
    const targetIds = new Set(descendantIds(leaf.unit));
    const counts = schoolYears.map(() => 0);
    for (const it of items) {
      if (verifiedOnly && !it.verified) continue;
      if (!it.unitIds.some((u) => targetIds.has(u))) continue;
      const year = examById.get(it.examId)?.schoolYear;
      if (year == null) continue;
      const ci = yearIndex.get(year);
      if (ci == null) continue;
      counts[ci] += 1;
    }
    const total = counts.reduce((a, b) => a + b, 0);
    counts.forEach((c, i) => {
      colTotals[i] += c;
      if (c > max) max = c;
    });
    rows.push({ unit: leaf.unit, top: leaf.ancestors[0] ?? leaf.unit, counts, total });
  }

  return { rows, max, colTotals };
}

/** 출제 수(count)를 0~max 기준으로 색 농도 클래스(Tailwind)로 변환한다. */
export function heatColor(count: number, max: number): string {
  if (count <= 0) return 'bg-slate-50 text-slate-300';
  const ratio = max <= 1 ? 1 : count / max;
  if (ratio > 0.8) return 'bg-blue-700 text-white';
  if (ratio > 0.6) return 'bg-blue-600 text-white';
  if (ratio > 0.4) return 'bg-blue-500 text-white';
  if (ratio > 0.2) return 'bg-blue-300 text-blue-900';
  return 'bg-blue-100 text-blue-900';
}
