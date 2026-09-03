import { describe, expect, it } from 'vitest';
import { dataset } from '@/data';
import { recommendFromStandards, unitsOf } from './standards';

describe('standards', () => {
  it('groups every standard into subject/unit without losing any', () => {
    const groups = unitsOf(['역사①', '역사②', '세계사', '동아시아 역사 기행']);
    const total = groups.reduce((n, g) => n + g.standards.length, 0);
    expect(total).toBe(dataset.achievement_standards.length);
    expect(groups.every((g) => g.unit.startsWith('('))).toBe(true);
  });

  it('recommends a merged year range and related ids', () => {
    const r = recommendFromStandards(['[9역10-01]', '[9역10-02]']);
    expect(r.yearRange).not.toBeNull();
    expect(r.yearRange![0]).toBeLessThanOrEqual(918);
    expect(r.yearRange![1]).toBeGreaterThanOrEqual(1270);
    expect(r.polityIds).toContain('goryeo');
    expect(r.figureIds).toContain('wang_geon');
  });

  it('reports standards that are not tied to a period', () => {
    const r = recommendFromStandards(['[9역01-01]', '[12동역01-01]']);
    expect(r.yearRange).toBeNull();
    expect(r.withoutRange).toEqual(['[9역01-01]', '[12동역01-01]']);
  });
});
