/**
 * 지구본 좌표 변환·기하 유틸 (순수 함수)
 * 좌표 규약: [lat, lon] (도). Three.js 구면 반지름 R=1 기준.
 */
import type { LatLon } from '@/types/history';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

/** 위경도 → 구면 위 3D 좌표 (x,y,z). lon=0 이 +Z 를 향하고 y 가 북극. */
export function latLonToVec3(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = (90 - lat) * D2R;
  const theta = (lon + 180) * D2R;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export function vec3ToLatLon(x: number, y: number, z: number): LatLon {
  const r = Math.hypot(x, y, z) || 1;
  const lat = 90 - Math.acos(y / r) * R2D;
  let lon = Math.atan2(z, -x) * R2D - 180;
  if (lon < -180) lon += 360;
  if (lon > 180) lon -= 360;
  return [lat, lon];
}

/** 등장방형(equirectangular) 텍스처 픽셀 좌표 */
export function latLonToPixel(lat: number, lon: number, width: number, height: number): [number, number] {
  return [((lon + 180) / 360) * width, ((90 - lat) / 180) * height];
}

/** 폴리곤 내부 판정(ray casting). 경도 ±180 을 가로지르는 폴리곤은 지원하지 않음(데이터에서 회피). */
export function pointInPolygon(point: LatLon, polygon: LatLon[]): boolean {
  const [y, x] = point; // y=lat, x=lon
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** 대권거리 기반 원(지오데식 서클) 꼭짓점들 — radius_km 원을 폴리곤으로 근사 */
export function geodesicCircle(center: LatLon, radiusKm: number, segments = 48): LatLon[] {
  const R = 6371.0088;
  const d = radiusKm / R;
  const lat1 = center[0] * D2R;
  const lon1 = center[1] * D2R;
  const pts: LatLon[] = [];
  for (let i = 0; i < segments; i++) {
    const brng = (i / segments) * 2 * Math.PI;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
    const lon2 =
      lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    let lon = lon2 * R2D;
    if (lon > 180) lon -= 360;
    if (lon < -180) lon += 360;
    pts.push([lat2 * R2D, lon]);
  }
  return pts;
}

/** 폴리곤 대략 면적(도² 단위, 정렬용) */
export function polygonAreaDeg2(polygon: LatLon[]): number {
  let a = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    a += (polygon[j][1] + polygon[i][1]) * (polygon[j][0] - polygon[i][0]);
  }
  return Math.abs(a / 2);
}

/** 두 위경도의 각거리(라디안) — 마커 가시성 판정 등에 사용 */
export function angularDistance(a: LatLon, b: LatLon): number {
  const [lat1, lon1] = [a[0] * D2R, a[1] * D2R];
  const [lat2, lon2] = [b[0] * D2R, b[1] * D2R];
  const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 대륙 빠른 이동 좌표 */
export const CONTINENT_VIEWS: { key: string; label: string; lat: number; lon: number }[] = [
  { key: 'east_asia', label: '동아시아', lat: 35, lon: 120 },
  { key: 'asia', label: '아시아', lat: 30, lon: 90 },
  { key: 'europe', label: '유럽', lat: 48, lon: 15 },
  { key: 'africa', label: '아프리카', lat: 5, lon: 20 },
  { key: 'americas', label: '아메리카', lat: 15, lon: -80 },
  { key: 'oceania', label: '오세아니아', lat: -25, lon: 140 },
];
