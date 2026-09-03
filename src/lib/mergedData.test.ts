import { describe, expect, it } from 'vitest';
import { dataset } from '@/data';
import { mergeDataset } from './mergedData';
import type { TeacherOverrideDoc } from '@/types/firestore';

const o = (kind: string, targetId: string, op: string, data: Record<string, unknown> = {}) =>
  ({ id: `t_${kind}_${targetId}`, teacherId: 't', kind, targetId, op, data, updatedAt: null }) as unknown as TeacherOverrideDoc & { id: string };

describe('mergeDataset', () => {
  it('returns the base dataset when there are no overrides', () => {
    const m = mergeDataset([]);
    expect(m.polities).toHaveLength(dataset.polities.length);
    expect(m.changedIds.size).toBe(0);
  });

  it('hides, edits and adds without touching the base data', () => {
    const m = mergeDataset([
      o('polity', 'goryeo', 'edit', { summary_ko: '교사 수정본' }),
      o('polity', 'joseon', 'hide'),
      o('figure', 'my_local_hero', 'add', { name_ko: '우리 고장 인물', name_en: 'Local', birth_year: 1500, death_year: 1560, is_approximate: false, polity_id: null, activity_location: [37, 127], activity_years: [1520, 1560], one_liner_ko: '지역 인물', textbook_appearance: [], achievement_standards: [], sources: [], note: '' }),
    ]);
    expect(m.polityById.get('goryeo')!.summary_ko).toBe('교사 수정본');
    expect(m.polityById.has('joseon')).toBe(false);
    expect(m.figureById.get('my_local_hero')!.name_ko).toBe('우리 고장 인물');
    expect(m.changedIds.has('goryeo')).toBe(true);
    // 기본 데이터는 그대로
    expect(dataset.polities.find((p) => p.id === 'goryeo')!.summary_ko).not.toBe('교사 수정본');
    expect(dataset.polities.some((p) => p.id === 'joseon')).toBe(true);
  });
});
