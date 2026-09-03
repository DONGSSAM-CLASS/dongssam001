import { describe, expect, it } from 'vitest';
import { generateWorksheet } from './worksheet';
import { DEFAULT_TRAVEL_RATES } from './history';

const input = {
  title: '고려의 성립과 변천',
  standards: ['[9역10-01]', '[9역10-02]'],
  yearRange: [892, 1270] as [number, number],
  focusYear: 1081,
  polityIds: ['goryeo', 'northern_song', 'liao'],
  figureIds: ['wang_geon', 'seo_hui'],
  rates: DEFAULT_TRAVEL_RATES,
};

describe('generateWorksheet', () => {
  it('creates every required section in order', () => {
    const items = generateWorksheet(input);
    expect(items.map((i) => i.kind)).toEqual(['objective', 'explore', 'compare_table', 'distance', 'route', 'essay', 'self_check']);
  });

  it('quotes the achievement standards verbatim in the objective', () => {
    const [obj] = generateWorksheet(input);
    expect(obj.prompt).toContain('[9역10-01]');
    expect(obj.prompt).toContain('후삼국 통일과 체제 정비 과정을 통해 고려 성립의 역사적 의미를 탐색한다.');
  });

  it('uses the focus year and only polities alive then', () => {
    const items = generateWorksheet(input);
    const explore = items.find((i) => i.kind === 'explore')!;
    expect(explore.prompt).toContain('1081년');
    const names = (explore.payload!.targets as { name: string }[]).map((t) => t.name);
    expect(names).toContain('고려');
    expect(names).toContain('요(거란)');
  });

  it('computes a distance answer for the teacher key', () => {
    const items = generateWorksheet(input);
    const dist = items.find((i) => i.kind === 'distance')!;
    const answer = dist.payload!.answer as { km: number; walkDays: number; sailDays: number };
    expect(answer.km).toBeGreaterThan(0);
    expect(answer.walkDays).toBe(Math.ceil(answer.km / 30));
    expect(answer.sailDays).toBe(Math.ceil(answer.km / 120));
  });

  it('falls back gracefully when nothing is highlighted', () => {
    const items = generateWorksheet({ ...input, standards: [], polityIds: [], figureIds: [] });
    expect(items).toHaveLength(7);
    expect(items[0].prompt.length).toBeGreaterThan(10);
    const cmp = items.find((i) => i.kind === 'compare_table')!;
    expect((cmp.payload!.rows as unknown[]).length).toBeGreaterThan(0);
  });
});

describe('newWorksheetItem', () => {
  it('gives every added item a unique id even right after regeneration', async () => {
    const { newWorksheetItem } = await import('./worksheet');
    const items = [...generateWorksheet(input), newWorksheetItem('essay'), newWorksheetItem('essay')];
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
  });
});
