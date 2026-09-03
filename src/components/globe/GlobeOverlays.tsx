import { useEffect, useMemo, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { dataset } from '@/data';
import { geodesicCircle, latLonToPixel } from '@/lib/geo';
import { hexToRgba } from '@/lib/color';
import { REGION_COLORS } from '@/lib/history';
import { studentColor } from '@/lib/monitor';
import { overlaySize } from '@/lib/overlayCanvas';
import { useVisiblePolities } from '@/lib/useVisibleData';
import { useGlobeStore } from '@/store/globeStore';
import { useMonitorStore } from '@/store/monitorStore';
import { useWorkStore } from '@/store/workStore';
import type { LatLon, Polity } from '@/types/history';
import type { Pin, Route, StudentWorkDoc } from '@/types/firestore';
import { EARTH_RADIUS } from './GlobeCanvas';

const [W, H] = overlaySize();
const S = W / 2048; // 2048 기준으로 잡은 선 두께·글자 크기 배율
type CountryFile = { features: { n: string; i: string; p: [number, number][][][] }[] };

/** 경도 ±180 을 가로지르는 구간은 선을 끊어 그린다 */
function polyline(ctx: CanvasRenderingContext2D, points: LatLon[], close = false) {
  ctx.beginPath();
  let prev: [number, number] | null = null;
  for (const [lat, lon] of points) {
    const [x, y] = latLonToPixel(lat, lon, W, H);
    if (prev && Math.abs(x - prev[0]) > W / 2) ctx.moveTo(x, y);
    else if (prev) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    prev = [x, y];
  }
  if (close) ctx.closePath();
}

function ringArea(ring: LatLon[]) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][1] + ring[i][1]) * (ring[j][0] - ring[i][0]);
  return Math.abs(a / 2);
}

/** 왕조·국가 영역 — 큰 영역부터 그려 작은(내포된) 나라가 가려지지 않게 한다 */
function drawPolities(ctx: CanvasRenderingContext2D, polities: Polity[], selectedId: string | null, highlight: string[]) {
  const items = polities
    .map((p) => {
      const ring: LatLon[] = p.area_polygon.length >= 3 ? p.area_polygon : geodesicCircle(p.centroid, p.radius_km ?? 300);
      return { p, ring, circle: p.area_polygon.length < 3 };
    })
    .sort((a, b) => ringArea(b.ring) - ringArea(a.ring));
  const hl = new Set(highlight);
  for (const { p, ring, circle } of items) {
    const color = REGION_COLORS[p.region];
    const isSel = p.id === selectedId;
    const isHl = hl.has(p.id);
    polyline(ctx, ring, true);
    ctx.fillStyle = hexToRgba(color, isSel ? 0.62 : circle ? 0.2 : p.is_approximate ? 0.3 : 0.42);
    ctx.fill();
    ctx.lineWidth = (isSel ? 5 : isHl ? 4 : 2.5) * S;
    ctx.strokeStyle = isSel ? '#ffffff' : isHl ? '#fde68a' : hexToRgba(color, 0.95);
    ctx.setLineDash(p.is_approximate || circle ? [10 * S, 8 * S] : []);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** 현대 국경선 (Natural Earth 110m) */
function drawBorders(ctx: CanvasRenderingContext2D, data: CountryFile) {
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.2 * S;
  for (const f of data.features) for (const poly of f.p) for (const ring of poly) {
    polyline(ctx, ring, true);
    ctx.stroke();
  }
}

const ROUTE_COLORS = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#a3e635', '#22d3ee', '#f87171', '#e879f9', '#facc15'];

/** 교역로 — 설정 연대에 활발했던 경로만 */
function drawRoutes(ctx: CanvasRenderingContext2D, year: number) {
  dataset.routes.forEach((r, idx) => {
    if (r.active_years[0] > year || r.active_years[1] < year) return;
    const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * S;
    ctx.lineCap = 'round';
    ctx.setLineDash(r.is_approximate ? [14 * S, 10 * S] : []);
    polyline(ctx, r.path);
    ctx.stroke();
    ctx.setLineDash([]);
    const mid = r.path[Math.floor(r.path.length / 2)];
    const [lx, ly] = latLonToPixel(mid[0], mid[1], W, H);
    ctx.font = `bold ${9 * S * 2}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2 * S;
    ctx.strokeText(r.name_ko, lx + 4 * S, ly - 4 * S);
    ctx.fillText(r.name_ko, lx + 4 * S, ly - 4 * S);
  });
}

/** 내 핀·루트·거리 측정선 */
function drawMyWork(ctx: CanvasRenderingContext2D, pins: Pin[], routes: Route[], draft: string[], measure: [number, number][]) {
  const byId = new Map(pins.map((p) => [p.id, p]));
  const path = (ids: string[], color: string, dash: number[]) => {
    const pts = ids.map((id) => byId.get(id)).filter(Boolean) as Pin[];
    if (pts.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * S;
    ctx.setLineDash(dash);
    polyline(ctx, pts.map((p) => [p.lat, p.lon] as LatLon));
    ctx.stroke();
    ctx.setLineDash([]);
  };
  for (const r of routes) path(r.pinIds, '#f97316', []);
  path(draft, '#fde68a', [8 * S, 6 * S]);
  if (measure.length === 2) {
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3 * S;
    ctx.setLineDash([6 * S, 6 * S]);
    polyline(ctx, measure);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

/** 학급 전체 핀·루트 (교사 화면) */
function drawClassWork(ctx: CanvasRenderingContext2D, works: (StudentWorkDoc & { id: string })[]) {
  for (const w of works) {
    const color = studentColor(w.number);
    const byId = new Map(w.pins.map((p) => [p.id, p]));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5 * S;
    for (const r of w.routes) {
      const pts = r.pinIds.map((id) => byId.get(id)).filter(Boolean) as Pin[];
      if (pts.length < 2) continue;
      polyline(ctx, pts.map((p) => [p.lat, p.lon] as LatLon));
      ctx.stroke();
    }
    for (const p of w.pins) {
      const [x, y] = latLonToPixel(p.lat, p.lon, W, H);
      ctx.beginPath();
      ctx.arc(x, y, 7 * S, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2 * S;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.stroke();
    }
  }
}

/**
 * 지구본 오버레이 전부를 캔버스 한 장에 그려 구(球) 하나로 입힌다.
 * 레이어마다 반투명 구를 겹치면 저사양(소프트웨어 렌더링) 기기에서 그리기 비용이 크게 늘어난다.
 */
export function GlobeOverlays() {
  const layers = useGlobeStore((s) => s.layers);
  const year = useGlobeStore((s) => s.year);
  const selectedId = useGlobeStore((s) => (s.selection?.kind === 'polity' ? s.selection.id : null));
  const highlight = useGlobeStore((s) => s.highlightPolities);
  const measure = useGlobeStore((s) => s.measurePoints);
  const polities = useVisiblePolities();
  const pins = useWorkStore((s) => s.pins);
  const routes = useWorkStore((s) => s.routes);
  const draft = useWorkStore((s) => s.draftRoute);
  const classWorks = useMonitorStore((s) => s.works);
  const onlyNumber = useMonitorStore((s) => s.onlyNumber);
  const showClassWork = useMonitorStore((s) => s.showClassWork);
  const invalidate = useThree((s) => s.invalidate);
  const [borders, setBorders] = useState<CountryFile | null>(null);

  // 현대 국경선은 토글할 때 한 번만 내려받는다
  useEffect(() => {
    if (!layers.modernBorders || borders) return;
    let cancelled = false;
    fetch('/geo/ne_110m_countries.json')
      .then((r) => r.json())
      .then((j: CountryFile) => !cancelled && setBorders(j))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [layers.modernBorders, borders]);

  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    return { canvas, texture };
  }, []);

  const visibleClassWork = useMemo(
    () => (showClassWork ? classWorks.filter((w) => onlyNumber === null || w.number === onlyNumber) : []),
    [classWorks, onlyNumber, showClassWork],
  );

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (layers.polities) drawPolities(ctx, polities, selectedId, highlight);
    if (layers.modernBorders && borders) drawBorders(ctx, borders);
    if (layers.routes) drawRoutes(ctx, year);
    drawMyWork(ctx, pins, routes, draft, measure);
    drawClassWork(ctx, visibleClassWork);
    texture.needsUpdate = true;
    invalidate();
  }, [canvas, texture, invalidate, layers, polities, selectedId, highlight, year, borders, pins, routes, draft, measure, visibleClassWork]);

  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[EARTH_RADIUS * 1.004, 64, 64]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
