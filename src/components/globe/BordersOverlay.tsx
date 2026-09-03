import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { latLonToPixel } from '@/lib/geo';
import { useGlobeStore } from '@/store/globeStore';
import { EARTH_RADIUS } from './GlobeCanvas';

const W = 2048;
const H = 1024;
type CountryFile = { features: { n: string; i: string; p: [number, number][][][] }[] };

/** 현대 국경선 레이어 (Natural Earth 110m) — 기본 숨김, 토글 시 한 번만 내려받아 캔버스에 그림 */
export function BordersOverlay() {
  const visible = useGlobeStore((s) => s.layers.modernBorders);
  const [data, setData] = useState<CountryFile | null>(null);

  useEffect(() => {
    if (!visible || data) return;
    let cancelled = false;
    fetch('/geo/ne_110m_countries.json')
      .then((r) => r.json())
      .then((j: CountryFile) => !cancelled && setData(j))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, data]);

  const texture = useMemo(() => {
    if (!data) return null;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.2;
    for (const f of data.features) {
      for (const poly of f.p) {
        for (const ring of poly) {
          ctx.beginPath();
          ring.forEach(([lat, lon], i) => {
            const [x, y] = latLonToPixel(lat, lon, W, H);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.stroke();
        }
      }
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [data]);

  if (!visible || !texture) return null;
  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[EARTH_RADIUS * 1.004, 64, 64]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
