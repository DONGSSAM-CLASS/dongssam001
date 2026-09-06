import type { Exam, Item, Unit } from '../types/schema';
import { flattenUnits, descendantIds, unitPath, buildUnitIndex, type FlatUnit } from './units';
import type { Curriculum } from '../types/schema';

export interface UnitFreq {
  unit: Unit;
  top: Unit;
  path: string;
  freq: number;
}

/** 소단원(리프)별 출제 빈도(검수 완료 문항 수)를 계산해 빈도 내림차순으로 반환. */
export function leafFrequencies(
  curriculum: Curriculum,
  items: Item[],
  verifiedOnly = true,
): UnitFreq[] {
  const { byId } = buildUnitIndex(curriculum);
  const flat: FlatUnit[] = flattenUnits(curriculum.units);
  const leaves = flat.filter((f) => !f.unit.children?.length);
  const out: UnitFreq[] = leaves.map((leaf) => {
    const ids = new Set(descendantIds(leaf.unit));
    const freq = items.filter(
      (it) => (!verifiedOnly || it.verified) && it.unitIds.some((u) => ids.has(u)),
    ).length;
    return {
      unit: leaf.unit,
      top: leaf.ancestors[0] ?? leaf.unit,
      path: unitPath(byId, leaf.unit.id),
      freq,
    };
  });
  return out.sort((a, b) => b.freq - a.freq);
}

/** 학년도별 특정 회차 존재 여부와 무관하게, exam 배열에서 학년도 목록 */
export function yearsOf(exams: Exam[]): number[] {
  return Array.from(new Set(exams.map((e) => e.schoolYear))).sort((a, b) => a - b);
}
