/**
 * 성취기준 트리 구성과 수업 설계 자동 추천 (순수 함수).
 * 원문 65개는 src/data/achievement_standards.json 에 그대로 있으며 여기서 수정하지 않는다.
 */
import { dataset, standardByCode } from '@/data';
import type { AchievementStandard, Subject } from '@/types/history';

export type SchoolLevel = '중학교' | '고등학교';

/** 중학교 「역사」는 고시상 단일 과목이며 ①/② 는 교과서 분책 관행에 따른 태그 → UI 에서 한 묶음으로 보여준다 */
export const SUBJECT_GROUPS: { level: SchoolLevel; label: string; subjects: Subject[] }[] = [
  { level: '중학교', label: '역사 (중학교)', subjects: ['역사①', '역사②'] },
  { level: '고등학교', label: '세계사', subjects: ['세계사'] },
  { level: '고등학교', label: '동아시아 역사 기행', subjects: ['동아시아 역사 기행'] },
];

export const SUBJECT_SUBLABEL: Record<Subject, string> = {
  '역사①': '세계사 영역 (단원 1~7)',
  '역사②': '한국사 영역 (단원 8~13)',
  세계사: '',
  '동아시아 역사 기행': '',
};

export interface UnitGroup {
  subject: Subject;
  unit: string;
  standards: AchievementStandard[];
}

/** 과목별 → 단원별로 묶은 목록 (원문 순서 유지) */
export function unitsOf(subjects: Subject[]): UnitGroup[] {
  const out: UnitGroup[] = [];
  for (const subject of subjects) {
    for (const s of dataset.achievement_standards) {
      if (s.subject !== subject) continue;
      const last = out[out.length - 1];
      if (last && last.subject === subject && last.unit === s.unit) last.standards.push(s);
      else out.push({ subject, unit: s.unit, standards: [s] });
    }
  }
  return out;
}

export interface Recommendation {
  /** 선택한 성취기준들의 연대 범위 합집합. 모두 null 이면 null */
  yearRange: [number, number] | null;
  polityIds: string[];
  figureIds: string[];
  /** 연대 범위가 지정되지 않은(시대에 묶이지 않는) 성취기준 */
  withoutRange: string[];
}

/** 선택한 성취기준으로 연대 범위·왕조·인물을 추천한다 */
export function recommendFromStandards(codes: string[]): Recommendation {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  const polities = new Set<string>();
  const figures = new Set<string>();
  const withoutRange: string[] = [];
  for (const code of codes) {
    const s = standardByCode.get(code);
    if (!s) continue;
    if (s.suggested_year_range) {
      min = Math.min(min, s.suggested_year_range[0]);
      max = Math.max(max, s.suggested_year_range[1]);
    } else {
      withoutRange.push(code);
    }
    for (const p of s.related_polities) polities.add(p);
    for (const f of s.related_figures) figures.add(f);
  }
  return {
    yearRange: Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null,
    polityIds: [...polities],
    figureIds: [...figures],
    withoutRange,
  };
}

/** 연대 범위의 가운데(수업 시작 연대 기본값) */
export function midYear(range: [number, number]): number {
  return Math.round((range[0] + range[1]) / 2);
}
