import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { geodesicCircle, latLonToPixel } from '@/lib/geo';
import { REGION_COLORS } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import { useVisiblePolities } from '@/lib/useVisibleData';
import type { LatLon } from '@/types/history';
import { EARTH_RADIUS } from './GlobeCanvas';
import { hexToRgba } from '@/lib/color';

const W = 2048;
const H = 1024;

/**
 * 왕조·국가 영역 레이어.
 * 활성 정치체를 등장방형 캔버스(2048×1024)에 그려 반투명 텍스처로 지구본에 입힌다.
 * 연대가 바뀔 때 캔버스 한 장만 다시 그리므로 저사양 기기에서도 메시 수가 늘지 않는다.
 */
export function PolityOverlay() {
  const polities = useVisiblePolities();
  const visible = useGlobeStore((s) => s.layers.polities);
  const selectedId = useGlobeStore((s) => (s.selection?.kind === 'polity' ? s.selection.id : null));

  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    return { canvas, texture };
  }, []);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!visible) {
      texture.needsUpdate = true;
      return;
    }
    // 큰 영역을 먼저, 작은 영역을 나중에 그려 내포된 나라가 가려지지 않게 함
    const items = polities
      .map((p) => {
        const ring: LatLon[] = p.area_polygon.length >= 3 ? p.area_polygon : geodesicCircle(p.centroid, p.radius_km ?? 300);
        return { p, ring, circle: p.area_polygon.length < 3 };
      })
      .sort((a, b) => ringArea(b.ring) - ringArea(a.ring));

    for (const { p, ring, circle } of items) {
      const color = REGION_COLORS[p.region];
      const isSel = p.id === selectedId;
      ctx.beginPath();
      ring.forEach(([lat, lon], i) => {
        const [x, y] = latLonToPixel(lat, lon, W, H);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = hexToRgba(color, isSel ? 0.62 : circle ? 0.2 : p.is_approximate ? 0.3 : 0.42);
      ctx.fill();
      ctx.lineWidth = isSel ? 5 : 2.5;
      ctx.strokeStyle = isSel ? '#ffffff' : hexToRgba(color, 0.95);
      // 불확실한 영역은 점선
      ctx.setLineDash(p.is_approximate || circle ? [10, 8] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    texture.needsUpdate = true;
  }, [polities, visible, selectedId, canvas, texture]);

  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[EARTH_RADIUS * 1.003, 64, 64]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function ringArea(ring: LatLon[]) {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][1] + ring[i][1]) * (ring[j][0] - ring[i][0]);
  return Math.abs(a / 2);
}
