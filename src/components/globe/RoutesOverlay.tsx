import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { dataset } from '@/data';
import { latLonToPixel } from '@/lib/geo';
import { useGlobeStore } from '@/store/globeStore';
import { EARTH_RADIUS } from './GlobeCanvas';

const W = 2048;
const H = 1024;
const ROUTE_COLORS = ['#fbbf24', '#f472b6', '#34d399', '#60a5fa', '#c084fc', '#fb923c', '#a3e635', '#22d3ee', '#f87171', '#e879f9', '#facc15'];

/** 교역로·항해로 레이어 — 설정 연대에 활발했던 경로만 캔버스 텍스처에 그린다 */
export function RoutesOverlay() {
  const visible = useGlobeStore((s) => s.layers.routes);
  const year = useGlobeStore((s) => s.year);
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (visible) {
      dataset.routes.forEach((r, idx) => {
        if (r.active_years[0] > year || r.active_years[1] < year) return;
        ctx.strokeStyle = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.setLineDash(r.is_approximate ? [14, 10] : []);
        ctx.beginPath();
        let prev: [number, number] | null = null;
        for (const [lat, lon] of r.path) {
          const [x, y] = latLonToPixel(lat, lon, W, H);
          // 경도 ±180 을 가로지르는 구간은 끊어 그려 화면 가로지르기를 막는다
          if (prev && Math.abs(x - prev[0]) > W / 2) ctx.moveTo(x, y);
          else if (prev) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          prev = [x, y];
        }
        ctx.stroke();
        // 경로 이름
        const [lx, ly] = latLonToPixel(r.path[Math.floor(r.path.length / 2)][0], r.path[Math.floor(r.path.length / 2)][1], W, H);
        ctx.setLineDash([]);
        ctx.font = 'bold 9px "Noto Sans KR", sans-serif';
        ctx.fillStyle = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeText(r.name_ko, lx + 4, ly - 4);
        ctx.fillText(r.name_ko, lx + 4, ly - 4);
      });
    }
    texture.needsUpdate = true;
  }, [visible, year, canvas, texture]);

  return (
    <mesh renderOrder={3}>
      <sphereGeometry args={[EARTH_RADIUS * 1.005, 64, 64]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
