import { describe, expect, it } from 'vitest';
import { dataset, polityById, figureById } from '@/data';
import { polityActiveIn } from '@/lib/history';

describe('dataset coverage (요구사항 6장 최소 분량)', () => {
  it('meets minimum counts', () => {
    expect(dataset.polities.length).toBeGreaterThanOrEqual(120);
    expect(dataset.figures.length).toBeGreaterThanOrEqual(150);
    expect(dataset.places.length).toBeGreaterThanOrEqual(80);
    expect(dataset.events.length).toBeGreaterThanOrEqual(60);
    expect(dataset.achievement_standards).toHaveLength(65);
  });
  it('every figure polity_id and standard reference resolves', () => {
    for (const f of dataset.figures) if (f.polity_id) expect(polityById.has(f.polity_id), f.id).toBe(true);
    for (const s of dataset.achievement_standards) {
      for (const p of s.related_polities) expect(polityById.has(p), `${s.code} ${p}`).toBe(true);
      for (const fg of s.related_figures) expect(figureById.has(fg), `${s.code} ${fg}`).toBe(true);
    }
  });
  it('every region has at least one polity in each era after 500 BC', () => {
    const eras: [number, number][] = [[-500, 500], [500, 1000], [1000, 1500], [1500, 1800], [1800, 2000]];
    for (const region of ['east_asia', 'south_asia', 'west_asia', 'europe', 'africa', 'americas']) {
      for (const [a, b] of eras) {
        const n = dataset.polities.filter((p) => p.region === region && p.start_year <= b && p.end_year >= a).length;
        expect(n, `${region} ${a}~${b}`).toBeGreaterThan(0);
      }
    }
  });
  it('1200 shows the classic contemporaries', () => {
    const ids = dataset.polities.filter((p) => polityActiveIn(p, 1200)).map((p) => p.id);
    for (const id of ['goryeo', 'southern_song', 'jin_jurchen', 'kamakura', 'ayyubid', 'hre', 'byzantine', 'khmer_empire']) expect(ids).toContain(id);
  });
});
