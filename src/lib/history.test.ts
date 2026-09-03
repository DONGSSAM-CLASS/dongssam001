import { describe, expect, it } from 'vitest';
import { dataset } from '@/data';
import {
  figureActiveIn,
  formatYear,
  haversineKm,
  parseYearInput,
  placeNameIn,
  polityActiveIn,
  routeLengthKm,
  simplifyPath,
  travelDays,
} from './history';

describe('year helpers', () => {
  it('formats BC/AD years', () => {
    expect(formatYear(-221)).toBe('기원전 221년');
    expect(formatYear(1453)).toBe('1453년');
  });
  it('parses year input', () => {
    expect(parseYearInput('-221')).toBe(-221);
    expect(parseYearInput('기원전 221')).toBe(-221);
    expect(parseYearInput('BC 221년')).toBe(-221);
    expect(parseYearInput('1453')).toBe(1453);
    expect(parseYearInput('서기 918년')).toBe(918);
    expect(parseYearInput('abc')).toBeNull();
  });
});

describe('dataset filtering', () => {
  const goryeo = dataset.polities.find((p) => p.id === 'goryeo')!;
  const genghis = dataset.figures.find((f) => f.id === 'genghis_khan')!;
  const constantinople = dataset.places.find((p) => p.id === 'constantinople')!;

  it('filters polities by year', () => {
    expect(polityActiveIn(goryeo, 1200)).toBe(true);
    expect(polityActiveIn(goryeo, 1400)).toBe(false);
  });
  it('shows figures only while alive and active', () => {
    expect(figureActiveIn(genghis, 1200)).toBe(false); // 생존했지만 활동 연대 이전
    expect(figureActiveIn(genghis, 1210)).toBe(true);
    expect(figureActiveIn(genghis, 1230)).toBe(false);
  });
  it('resolves era-specific place names', () => {
    expect(placeNameIn(constantinople, -400)).toBe('비잔티움');
    expect(placeNameIn(constantinople, 1453)).toBe('콘스탄티노폴리스');
    expect(placeNameIn(constantinople, 1990)).toBe('이스탄불');
  });
  it('ships exactly 65 achievement standards', () => {
    expect(dataset.achievement_standards).toHaveLength(65);
  });
});

describe('geo', () => {
  it('computes great-circle distance (개경–하카타 ≈ 600km)', () => {
    const km = haversineKm([37.97, 126.55], [33.59, 130.4]);
    expect(km).toBeGreaterThan(580);
    expect(km).toBeLessThan(620);
  });
  it('sums route length and converts to travel days', () => {
    const km = routeLengthKm([
      [37.97, 126.55],
      [33.59, 130.4],
      [35.0, 135.75],
    ]);
    expect(km).toBeGreaterThan(1000);
    const d = travelDays(600, { walkKmPerDay: 30, horseKmPerDay: 60, sailKmPerDay: 120 });
    expect(d).toEqual({ walk: 20, horse: 10, sail: 5 });
  });
  it('simplifies a polyline with Douglas–Peucker', () => {
    const line: [number, number][] = [
      [0, 0],
      [0.01, 1],
      [0, 2],
      [3, 3],
      [0, 4],
    ];
    const simplified = simplifyPath(line, 0.1);
    expect(simplified).toEqual([
      [0, 0],
      [0, 2],
      [3, 3],
      [0, 4],
    ]);
  });
});
