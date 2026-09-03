import { Html } from '@react-three/drei';
import { latLonToVec3 } from '@/lib/geo';
import { formatYear } from '@/lib/history';
import { studentColor } from '@/lib/monitor';
import { useMonitorStore } from '@/store/monitorStore';
import { EARTH_RADIUS } from './GlobeCanvas';

/**
 * 교사 화면: 한 학생만 볼 때 그 학생의 핀 이름표를 보여 준다.
 * 학생별 점·루트 선은 GlobeOverlays 의 캔버스 텍스처에 그려져 PNG 내보내기에도 담긴다.
 */
export function ClassPinLabels() {
  const works = useMonitorStore((s) => s.works);
  const only = useMonitorStore((s) => s.onlyNumber);
  const show = useMonitorStore((s) => s.showClassWork);
  if (!show || only === null) return null;
  const target = works.filter((w) => w.number === only);
  return (
    <group>
      {target.flatMap((w) =>
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
