import { describe, expect, it } from 'vitest';
import { geodesicCircle, latLonToVec3, pointInPolygon, vec3ToLatLon } from './geo';

describe('geo', () => {
  it('round-trips lat/lon through 3D', () => {
    for (const [lat, lon] of [
      [37.57, 126.98],
      [-33.9, 151.2],
      [0, 0],
      [51.5, -0.1],
      [41.0, 28.98],
    ]) {
      const [x, y, z] = latLonToVec3(lat, lon);
      const [lat2, lon2] = vec3ToLatLon(x, y, z);
      expect(lat2).toBeCloseTo(lat, 5);
      expect(lon2).toBeCloseTo(lon, 5);
    }
  });
  it('detects points inside a polygon', () => {
    const square: [number, number][] = [
      [30, 120],
      [30, 130],
      [40, 130],
      [40, 120],
    ];
    expect(pointInPolygon([35, 125], square)).toBe(true);
    expect(pointInPolygon([45, 125], square)).toBe(false);
  });
  it('builds a geodesic circle around a center', () => {
    const pts = geodesicCircle([47.2, 102.85], 500, 12);
    expect(pts).toHaveLength(12);
    for (const [lat, lon] of pts) {
      expect(Math.abs(lat - 47.2)).toBeLessThan(6);
      expect(Math.abs(lon - 102.85)).toBeLessThan(8);
    }
  });
});
