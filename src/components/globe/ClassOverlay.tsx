import { useEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToPixel, latLonToVec3 } from '@/lib/geo';
import { formatYear } from '@/lib/history';
import { studentColor } from '@/lib/monitor';
import { useMonitorStore } from '@/store/monitorStore';
import { EARTH_RADIUS } from './GlobeCanvas';

const W = 2048;
const H = 1024;

/**
 * 교사 화면: 학급 전체 학생의 핀·루트를 학생별 색으로 지구본에 표시한다.
 * 핀 점과 루트 선은 캔버스 텍스처에 그려 PNG 내보내기에도 함께 담기고,
 * 이름표는 DOM 으로 얹어 읽기 쉽게 한다.
 */
export function ClassOverlay() {
  const works = useMonitorStore((s) => s.works);
  const only = useMonitorStore((s) => s.onlyNumber);
  const show = useMonitorStore((s) => s.showClassWork);

  const visible = useMemo(() => (show ? works.filter((w) => only === null || w.number === only) : []), [works, only, show]);

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
    for (const w of visible) {
      const color = studentColor(w.number);
      const byId = new Map(w.pins.map((p) => [p.id, p]));
      // 루트 선
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      for (const r of w.routes) {
        const pts = r.pinIds.map((id) => byId.get(id)).filter(Boolean);
        if (pts.length < 2) continue;
        ctx.beginPath();
        let prev: [number, number] | null = null;
        for (const p of pts) {
          const [x, y] = latLonToPixel(p!.lat, p!.lon, W, H);
          if (prev && Math.abs(x - prev[0]) > W / 2) ctx.moveTo(x, y);
          else if (prev) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          prev = [x, y];
        }
        ctx.stroke();
      }
      // 핀 점
      for (const p of w.pins) {
        const [x, y] = latLonToPixel(p.lat, p.lon, W, H);
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.stroke();
      }
    }
    texture.needsUpdate = true;
  }, [visible, canvas, texture]);

  return (
    <group>
      <mesh renderOrder={5}>
        <sphereGeometry args={[EARTH_RADIUS * 1.007, 64, 64]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
      {/* 한 학생만 볼 때는 핀 이름표까지 보여 준다 */}
      {only !== null &&
        visible.flatMap((w) =>
          w.pins.map((p) => (
            <Html key={`${w.number}-${p.id}`} position={latLonToVec3(p.lat, p.lon, EARTH_RADIUS * 1.01)} center zIndexRange={[45, 0]} style={{ pointerEvents: 'none' }}>
              <span className="whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-semibold text-slate-900 shadow" style={{ background: studentColor(w.number) }}>
                {w.number}·{p.name} <span className="opacity-70">{formatYear(p.year)}</span>
              </span>
            </Html>
          )),
        )}
    </group>
  );
}
