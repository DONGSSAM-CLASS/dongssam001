import { useEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { latLonToPixel, latLonToVec3 } from '@/lib/geo';
import { formatYear } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import { useWorkStore } from '@/store/workStore';
import { EARTH_RADIUS } from './GlobeCanvas';

const W = 2048;
const H = 1024;

/** 학생 핀·루트·거리 재기 지점 (자기 기록) */
export function UserOverlay() {
  const pins = useWorkStore((s) => s.pins);
  const routes = useWorkStore((s) => s.routes);
  const draft = useWorkStore((s) => s.draftRoute);
  const pending = useWorkStore((s) => s.pendingPin);
  const measure = useGlobeStore((s) => s.measurePoints);
  const showEnglish = useGlobeStore((s) => s.showEnglish);
  void showEnglish;

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
    const byId = new Map(pins.map((p) => [p.id, p]));
    const drawPath = (ids: string[], color: string, dash: number[]) => {
      const pts = ids.map((id) => byId.get(id)).filter(Boolean) as typeof pins;
      if (pts.length < 2) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.setLineDash(dash);
      ctx.beginPath();
      let prev: [number, number] | null = null;
      for (const p of pts) {
        const [x, y] = latLonToPixel(p.lat, p.lon, W, H);
        if (prev && Math.abs(x - prev[0]) > W / 2) ctx.moveTo(x, y);
        else if (prev) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        prev = [x, y];
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };
    for (const r of routes) drawPath(r.pinIds, '#f97316', []);
    drawPath(draft, '#fde68a', [8, 6]);
    if (measure.length === 2) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      const [x1, y1] = latLonToPixel(measure[0][0], measure[0][1], W, H);
      const [x2, y2] = latLonToPixel(measure[1][0], measure[1][1], W, H);
      ctx.moveTo(x1, y1);
      if (Math.abs(x2 - x1) <= W / 2) ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    texture.needsUpdate = true;
  }, [pins, routes, draft, measure, canvas, texture]);

  return (
    <group>
      <mesh renderOrder={4}>
        <sphereGeometry args={[EARTH_RADIUS * 1.0055, 64, 64]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
      {pins.map((p) => (
        <PinMarker key={p.id} pin={p} orderInDraft={draft.indexOf(p.id)} />
      ))}
      {pending && (
        <Html position={latLonToVec3(pending.lat, pending.lon, EARTH_RADIUS * 1.008)} center zIndexRange={[55, 0]} style={{ pointerEvents: 'none' }}>
          <span className="text-2xl animate-bounce" aria-hidden="true">📍</span>
        </Html>
      )}
      {measure.map((m, i) => (
        <Html key={`m${i}`} position={latLonToVec3(m[0], m[1], EARTH_RADIUS * 1.008)} center zIndexRange={[55, 0]} style={{ pointerEvents: 'none' }}>
          <span className="rounded-full bg-cyan-400 text-slate-900 text-[10px] font-bold w-5 h-5 flex items-center justify-center shadow">{i + 1}</span>
        </Html>
      ))}
    </group>
  );
}

function PinMarker({ pin, orderInDraft }: { pin: { id: string; lat: number; lon: number; name: string; year: number }; orderInDraft: number }) {
  const toggleDraft = useWorkStore((s) => s.toggleDraftPin);
  const tool = useGlobeStore((s) => s.tool);
  return (
    <Html position={latLonToVec3(pin.lat, pin.lon, EARTH_RADIUS * 1.008)} center zIndexRange={[55, 0]} style={{ pointerEvents: 'none' }}>
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          toggleDraft(pin.id);
        }}
        // 핀 찍기·거리 재기 중에는 마커가 지구본 클릭을 가로채지 않게 한다
        className={`${tool === 'select' ? 'pointer-events-auto' : 'pointer-events-none'} whitespace-nowrap rounded-lg px-1.5 py-0.5 text-[11px] font-semibold shadow border ${orderInDraft >= 0 ? 'bg-amber-300 text-slate-900 border-amber-500' : 'bg-orange-600/90 text-white border-orange-300/50'}`}
        title={`${formatYear(pin.year)} — ${pin.name} (클릭: 루트에 추가/제외)`}
      >
        {orderInDraft >= 0 && <span className="mr-1 rounded-full bg-slate-900 text-amber-300 px-1">{orderInDraft + 1}</span>}
        📍 {pin.name}
      </button>
    </Html>
  );
}
