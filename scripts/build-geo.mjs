// Natural Earth 110m 국가 경계 GeoJSON → 경량 JSON (좌표 소수 2자리, 속성은 이름·ISO만)
// 입력: scratch 에 내려받은 ne_110m_admin_0_countries.geojson  /  출력: public/geo/ne_110m_countries.json
import { readFileSync, writeFileSync } from 'node:fs';
const src = process.argv[2];
const out = process.argv[3] ?? 'public/geo/ne_110m_countries.json';
const gj = JSON.parse(readFileSync(src, 'utf8'));
const r = (n) => Math.round(n * 100) / 100;
const features = gj.features.map((f) => {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates; // MultiPolygon
  return {
    n: f.properties.NAME_KO || f.properties.NAME,
    i: f.properties.ISO_A2_EH || f.properties.ISO_A2,
    // 각 폴리곤은 [ring][ [lon,lat] ] → [lat,lon] 순서로 통일
    p: polys.map((rings) => rings.map((ring) => ring.map(([lon, lat]) => [r(lat), r(lon)]))),
  };
});
writeFileSync(out, JSON.stringify({ source: 'Natural Earth 1:110m admin_0_countries (public domain)', features }));
console.log(features.length, 'countries →', out);
