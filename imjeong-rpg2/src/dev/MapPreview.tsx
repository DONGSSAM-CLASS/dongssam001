import { useEffect, useRef, useState } from 'react';
import { FirstPersonRenderer } from '../three/FirstPersonRenderer';
import { MAP_ORDER, getMap } from '../data/maps';
import { figures } from '../data/figures';
import type { MapId } from '../types';

/**
 * 장소 검수 화면 — 주소 끝에 `?preview=assembly` 처럼 붙이면 열린다.
 * 퀘스트·저장 없이 지도만 띄워 벽·가구·인물 배치를 눈으로 확인하는 용도다.
 * (`&x=12&z=8&yaw=1.57` 로 시작 위치를 바꿀 수 있다)
 */
export default function MapPreview({ initial }: { initial: MapId }) {
  const ref = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<FirstPersonRenderer | null>(null);
  const [mapId, setMapId] = useState<MapId>(initial);
  const [room, setRoom] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = new FirstPersonRenderer({
      container: el,
      onNpcActivate: () => {},
      onPlaqueActivate: () => {},
      onRelic: () => {},
      onPortal: () => {},
      onFocus: () => {},
      onRoom: setRoom,
      onPose: () => {},
    });
    rendererRef.current = r;
    return () => r.dispose();
  }, []);

  useEffect(() => {
    const r = rendererRef.current;
    if (!r) return;
    const base = getMap(mapId);
    const q = new URLSearchParams(window.location.search);
    const map =
      q.has('x') && q.has('z')
        ? { ...base, spawn: { x: Number(q.get('x')), z: Number(q.get('z')), yaw: Number(q.get('yaw') ?? 0) } }
        : base;
    r.loadMap(map, figures, { collectedRelics: [], portalOpen: true, donated: ['kimgu'], lettered: ['kimgu'] });
    r.setQuestMarkers(map.npcs.map((n) => n.figureId).slice(0, 1));
  }, [mapId]);

  return (
    <div className="game-root">
      <div className="world-layer" ref={ref} />
      <div className="hud">
        <div className="situation frame" style={{ width: 250 }}>
          <div className="situation-place">장소 검수 · {getMap(mapId).name}</div>
          <div className="situation-period">{room ?? '—'}</div>
          <div className="dialogue-actions">
            {MAP_ORDER.map((id) => (
              <button key={id} className="btn small" onClick={() => setMapId(id)}>
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
