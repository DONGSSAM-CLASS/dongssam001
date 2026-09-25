/**
 * 학급 선택 분포 계산 (교사 화면에서 계산 → public/stats 로 공개)
 */
import type { ChoiceId, StudentDoc } from '../types/db';
import { ALL_SCENE_IDS } from '../data/scenarios';

export type ChoiceStats = Record<string, Partial<Record<ChoiceId, number>>>;

export function computeChoiceStats(students: Pick<StudentDoc, 'choices'>[]): ChoiceStats {
  const stats: ChoiceStats = {};
  for (const s of students) {
    for (const [sceneId, choice] of Object.entries(s.choices ?? {})) {
      if (!ALL_SCENE_IDS.includes(sceneId)) continue;
      const row = (stats[sceneId] ??= {});
      row[choice] = (row[choice] ?? 0) + 1;
    }
  }
  return stats;
}

/** 비교용 문자열 (키 순서와 상관없이 같은 값이면 같은 문자열) */
export function statsKey(stats: ChoiceStats): string {
  return JSON.stringify(
    Object.keys(stats)
      .sort()
      .map((k) => [k, ['a', 'b', 'c'].map((c) => stats[k][c as ChoiceId] ?? 0)]),
  );
}

export function totalOf(row: Partial<Record<ChoiceId, number>> | undefined): number {
  if (!row) return 0;
  return (row.a ?? 0) + (row.b ?? 0) + (row.c ?? 0);
}

/** 반올림한 비율(%) */
export function percent(n: number, total: number): number {
  return total === 0 ? 0 : Math.round((n / total) * 100);
}
