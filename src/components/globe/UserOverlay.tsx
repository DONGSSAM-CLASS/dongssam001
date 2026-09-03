import { Html } from '@react-three/drei';
import { latLonToVec3 } from '@/lib/geo';
import { formatYear } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import { useWorkStore } from '@/store/workStore';
import { EARTH_RADIUS } from './GlobeCanvas';

/**
 * 내가 찍은 핀의 이름표와 거리 재기 지점 (DOM 오버레이).
 * 선(루트·측정선)과 점은 GlobeOverlays 의 캔버스 텍스처에 함께 그려진다.
 */
export function UserPinMarkers() {
  const pins = useWorkStore((s) => s.pins);
  const draft = useWorkStore((s) => s.draftRoute);
  const pending = useWorkStore((s) => s.pendingPin);
  const measure = useGlobeStore((s) => s.measurePoints);
  const tool = useGlobeStore((s) => s.tool);
  const toggleDraft = useWorkStore((s) => s.toggleDraftPin);

  return (
    <group>
      {pins.map((pin) => {
        const orderInDraft = draft.indexOf(pin.id);
        return (
          <Html key={pin.id} position={latLonToVec3(pin.lat, pin.lon, EARTH_RADIUS * 1.008)} center zIndexRange={[55, 0]} style={{ pointerEvents: 'none' }}>
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
      })}
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
