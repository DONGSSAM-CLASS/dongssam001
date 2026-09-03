/**
 * 역사 데이터 필터링·지리 계산 순수 함수 (클라이언트 메모리에서 처리)
 */
import type { Figure, HistoricalEvent, LatLon, Place, Polity, Region } from '@/types/history';

export const REGION_LABELS: Record<Region, string> = {
  east_asia: '동아시아',
  southeast_asia: '동남아시아',
  central_asia: '중앙아시아·북방',
  south_asia: '남아시아',
  west_asia: '서아시아',
  europe: '유럽',
  africa: '아프리카',
  americas: '아메리카',
  oceania: '오세아니아',
};

/** 색약 대응 팔레트(Okabe–Ito 계열 기반, 문화권별 계열 통일) */
export const REGION_COLORS: Record<Region, string> = {
  east_asia: '#D55E00',
  southeast_asia: '#E69F00',
  central_asia: '#B8860B',
  south_asia: '#F0E442',
  west_asia: '#009E73',
  europe: '#0072B2',
  africa: '#CC79A7',
  americas: '#56B4E9',
  oceania: '#999999',
};

/** 연도 표기: -221 → "기원전 221년", 1453 → "1453년" */
export function formatYear(year: number): string {
  if (year < 0) return `기원전 ${Math.abs(year)}년`;
  if (year === 0) return '기원전 1년'; // 천문학적 0년은 사용하지 않음 — 0 입력은 기원전 1년으로 처리
  return `${year}년`;
}

/** "-221", "기원전 221", "BC 221", "1453" 등을 정수 연도로 파싱 */
export function parseYearInput(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const bc = /^(기원전|BC|B\.C\.|-)\s*(\d{1,4})\s*(년)?$/i.exec(s);
  if (bc) return -Number(bc[2]);
  const ad = /^(서기|AD|A\.D\.)?\s*(\d{1,4})\s*(년)?$/i.exec(s);
  if (ad) return Number(ad[2]);
  return null;
}

export function polityActiveIn(p: Polity, year: number): boolean {
  return p.start_year <= year && year <= p.end_year;
}

export function figureAliveIn(f: Figure, year: number): boolean {
  return f.birth_year <= year && year <= f.death_year;
}

/** 설정 연대에 "생존·활동 중"인 인물만 표시 */
export function figureActiveIn(f: Figure, year: number): boolean {
  const [from, to] = f.activity_years;
  return figureAliveIn(f, year) && from <= year && year <= to;
}

export function placeNameIn(place: Place, year: number): string {
  const era = place.era_names.find((e) => e.from <= year && year < e.to);
  return era ? era.name_ko : place.name_ko;
}

export function eventsBetween(events: HistoricalEvent[], from: number, to: number): HistoricalEvent[] {
  return events.filter((e) => e.year >= from && e.year <= to).sort((a, b) => a.year - b.year);
}

export function groupByRegion<T extends { region: Region }>(items: T[]): Map<Region, T[]> {
  const m = new Map<Region, T[]>();
  for (const it of items) {
    const arr = m.get(it.region) ?? [];
    arr.push(it);
    m.set(it.region, arr);
  }
  return m;
}

const EARTH_RADIUS_KM = 6371.0088;

/** 대권거리(Haversine), km */
export function haversineKm(a: LatLon, b: LatLon): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 여러 지점을 순서대로 잇는 경로의 총거리(km) */
export function routeLengthKm(points: LatLon[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

export interface TravelRates {
  walkKmPerDay: number;
  horseKmPerDay: number;
  sailKmPerDay: number;
}

/** 교사 설정 기본값 — 역사적 이동 기준(개략치). 교사가 학급 설정에서 바꿀 수 있다. */
export const DEFAULT_TRAVEL_RATES: TravelRates = { walkKmPerDay: 30, horseKmPerDay: 60, sailKmPerDay: 120 };

export function travelDays(km: number, rates: TravelRates = DEFAULT_TRAVEL_RATES) {
  return {
    walk: Math.ceil(km / rates.walkKmPerDay),
    horse: Math.ceil(km / rates.horseKmPerDay),
    sail: Math.ceil(km / rates.sailKmPerDay),
  };
}

/** Douglas–Peucker 폴리곤 단순화 (도 단위 허용 오차) */
export function simplifyPath(points: LatLon[], toleranceDeg = 0.25): LatLon[] {
  if (points.length <= 2) return points;
  const sqTol = toleranceDeg * toleranceDeg;
  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = keep[points.length - 1] = true;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxSq = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const sq = sqSegDist(points[i], points[first], points[last]);
      if (sq > maxSq) {
        maxSq = sq;
        index = i;
      }
    }
    if (maxSq > sqTol && index !== -1) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function sqSegDist(p: LatLon, a: LatLon, b: LatLon): number {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}
