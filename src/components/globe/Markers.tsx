import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { dataset } from '@/data';
import { latLonToVec3 } from '@/lib/geo';
import { placeNameIn } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import { useVisibleFigures, useVisiblePolities } from '@/lib/useVisibleData';
import { EARTH_RADIUS } from './GlobeCanvas';

interface MarkerItem {
  key: string;
  kind: 'figure' | 'place' | 'polity_label';
  id: string;
  lat: number;
  lon: number;
  label: string;
  sub?: string;
  /** 같은 좌표에 겹치는 마커의 순번 (세로 오프셋용) */
  stack?: number;
}

/**
 * 인물·장소 마커와 왕조 이름표 (DOM 오버레이).
 * 지구 뒷면에 있는 마커는 매 프레임 법선·카메라 방향 내적으로 숨긴다(레이캐스트보다 훨씬 저렴).
 */
export function Markers() {
  const figures = useVisibleFigures();
  const polities = useVisiblePolities();
  const year = useGlobeStore((s) => s.year);
  const layers = useGlobeStore((s) => s.layers);
  const showEnglish = useGlobeStore((s) => s.showEnglish);
  const selection = useGlobeStore((s) => s.selection);
  const select = useGlobeStore((s) => s.select);

  const items = useMemo<MarkerItem[]>(() => {
    const out: MarkerItem[] = [];
    const seen = new Map<string, number>();
    const push = (it: MarkerItem) => {
      const k = `${it.lat.toFixed(1)},${it.lon.toFixed(1)}`;
      const n = seen.get(k) ?? 0;
      seen.set(k, n + 1);
      out.push({ ...it, stack: n });
    };
    if (layers.polities) {
      for (const p of polities) {
        push({ key: `pl-${p.id}`, kind: 'polity_label', id: p.id, lat: p.centroid[0], lon: p.centroid[1], label: showEnglish ? `${p.name_ko} (${p.name_en})` : p.name_ko });
      }
    }
    if (layers.figures) {
      for (const f of figures) {
        push({ key: `f-${f.id}`, kind: 'figure', id: f.id, lat: f.activity_location[0], lon: f.activity_location[1], label: showEnglish ? `${f.name_ko} (${f.name_en})` : f.name_ko });
      }
    }
    if (layers.places) {
      for (const pl of dataset.places) {
        push({ key: `p-${pl.id}`, kind: 'place', id: pl.id, lat: pl.coords[0], lon: pl.coords[1], label: placeNameIn(pl, year), sub: pl.type });
      }
    }
    return out;
  }, [figures, polities, layers, showEnglish, year]);

  const group = useRef<THREE.Group>(null);
  const els = useRef<(HTMLElement | null)[]>([]);
  const normals = useMemo(() => items.map((it) => new THREE.Vector3(...latLonToVec3(it.lat, it.lon, 1))), [items]);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const g = group.current;
    if (!g) return;
    camDir.copy(camera.position).normalize();
    const dist = camera.position.length();
    // 멀리서 볼 때는 장소 마커를 숨기고(줌인 시 표시), 더 멀면 인물 마커도 숨겨 혼잡도를 줄인다
    const hidePlaces = dist > 2.0;
    const hideFigures = dist > 3.4;
    items.forEach((_, i) => {
      const el = els.current[i];
      const front = normals[i].dot(camDir) > 0.12;
      const it = items[i];
      const isSelected = selection?.id === it.id && (selection.kind === it.kind || (selection.kind === 'polity' && it.kind === 'polity_label'));
      const hidden = !front || (!isSelected && ((hidePlaces && it.kind === 'place') || (hideFigures && it.kind === 'figure')));
      if (el) el.style.visibility = hidden ? 'hidden' : 'visible';
    });
  });

  return (
    <group ref={group}>
      {items.map((it, i) => {
        const pos = latLonToVec3(it.lat, it.lon, EARTH_RADIUS * 1.006);
        const selected = selection?.id === it.id && ((selection.kind === 'polity' && it.kind === 'polity_label') || selection.kind === it.kind);
        return (
          <MarkerHtml key={it.key} position={pos} register={(el) => { els.current[i] = el; }}>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                select({ kind: it.kind === 'polity_label' ? 'polity' : it.kind, id: it.id });
              }}
              className={markerClass(it.kind, selected)}
              style={it.stack ? { transform: `translateY(${it.stack * 22}px)` } : undefined}
              title={it.label}
            >
              {it.kind === 'figure' && <span className="mr-1" aria-hidden="true">●</span>}
              {it.kind === 'place' && <span className="mr-1" aria-hidden="true">▲</span>}
              {it.label}
            </button>
          </MarkerHtml>
        );
      })}
    </group>
  );
}

function markerClass(kind: MarkerItem['kind'], selected: boolean) {
  const base = 'pointer-events-auto select-none whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] leading-tight shadow transition-transform hover:scale-110 ';
  if (kind === 'polity_label') return base + (selected ? 'bg-white text-slate-900 font-bold' : 'bg-slate-900/70 text-white font-semibold border border-white/30');
  if (kind === 'figure') return base + (selected ? 'bg-amber-300 text-slate-900 font-bold' : 'bg-amber-500/90 text-slate-900');
  return base + (selected ? 'bg-sky-200 text-slate-900 font-bold' : 'bg-sky-900/80 text-sky-100 border border-sky-300/40');
}

function MarkerHtml({ position, register, children }: { position: [number, number, number]; register: (el: HTMLElement | null) => void; children: React.ReactNode }) {
  return (
    <Html position={position} center zIndexRange={[50, 0]} style={{ pointerEvents: 'none' }} ref={register}>
      {children}
    </Html>
  );
}
