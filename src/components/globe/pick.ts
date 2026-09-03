import { angularDistance, pointInPolygon, polygonAreaDeg2 } from '@/lib/geo';
import type { LatLon, Polity } from '@/types/history';

const DEFAULT_RADIUS_KM = 300;
const EARTH_R = 6371.0088;

/** 클릭 지점에 있는 정치체 — 여러 개가 겹치면 면적이 가장 작은 것(내포된 나라) 우선 */
export function pickPolityAt(point: LatLon, polities: Polity[]): Polity | null {
  let best: { p: Polity; area: number } | null = null;
  for (const p of polities) {
    let hit = false;
    let area = Infinity;
    if (p.area_polygon.length >= 3) {
      hit = pointInPolygon(point, p.area_polygon);
      area = polygonAreaDeg2(p.area_polygon);
    } else {
      const rKm = p.radius_km ?? DEFAULT_RADIUS_KM;
      hit = angularDistance(point, p.centroid) * EARTH_R <= rKm;
      area = Math.PI * (rKm / 111) ** 2;
    }
    if (hit && (!best || area < best.area)) best = { p, area };
  }
  return best?.p ?? null;
}
