import { CONTINENT_VIEWS } from '@/lib/geo';
import { useGlobeStore } from '@/store/globeStore';
import type { LayerKey } from '@/types/firestore';
import type { Subject } from '@/types/history';

const LAYER_LABELS: Record<LayerKey, string> = {
  polities: '왕조·국가 영역',
  figures: '인물 마커',
  places: '주요 도시·유적',
  routes: '교역로',
  modernBorders: '현대 국경선',
};
const SUBJECTS: (Subject | 'all')[] = ['all', '역사①', '역사②', '세계사', '동아시아 역사 기행'];

/** 레이어 토글 · 대륙 빠른 이동 · 표기/과목 필터 · 목록형 보기 */
export function LayerPanel() {
  const layers = useGlobeStore((s) => s.layers);
  const toggleLayer = useGlobeStore((s) => s.toggleLayer);
  const flyTo = useGlobeStore((s) => s.flyTo);
  const showEnglish = useGlobeStore((s) => s.showEnglish);
  const setShowEnglish = useGlobeStore((s) => s.setShowEnglish);
  const textbookFilter = useGlobeStore((s) => s.textbookFilter);
  const setTextbookFilter = useGlobeStore((s) => s.setTextbookFilter);
  const listMode = useGlobeStore((s) => s.listMode);
  const setListMode = useGlobeStore((s) => s.setListMode);
  const fps = useGlobeStore((s) => s.fps);

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl bg-slate-900/85 backdrop-blur border border-slate-700 p-3 text-sm w-56">
      <nav aria-label="대륙 빠른 이동" className="flex flex-wrap gap-1">
        {CONTINENT_VIEWS.map((c) => (
          <button key={c.key} type="button" className="rounded-lg bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600" onClick={() => flyTo(c.lat, c.lon, 2.6)}>
            {c.label}
          </button>
        ))}
      </nav>
      <fieldset className="border-t border-slate-700 pt-2">
        <legend className="text-xs font-semibold text-slate-400">레이어</legend>
        {(Object.keys(LAYER_LABELS) as LayerKey[]).map((k) => (
          <label key={k} className="flex items-center gap-2 py-0.5 text-xs">
            <input type="checkbox" checked={layers[k]} onChange={() => toggleLayer(k)} className="accent-amber-400" />
            {LAYER_LABELS[k]}
          </label>
        ))}
      </fieldset>
      <div className="border-t border-slate-700 pt-2 flex flex-col gap-1">
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={showEnglish} onChange={(e) => setShowEnglish(e.target.checked)} className="accent-amber-400" />
          원어·영어 병기
        </label>
        <label className="flex items-center gap-2 text-xs">
          <span className="shrink-0">과목</span>
          <select value={textbookFilter} onChange={(e) => setTextbookFilter(e.target.value as Subject | 'all')} className="flex-1 rounded bg-slate-800 border border-slate-600 px-1 py-0.5 text-xs">
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? '전체' : s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={listMode} onChange={(e) => setListMode(e.target.checked)} className="accent-amber-400" />
          목록형 보기 (지구본 대체)
        </label>
      </div>
      <p className="text-[10px] text-slate-400 border-t border-slate-700 pt-1">
        조작 중 FPS {fps || '–'} · 드래그 회전 · 휠 줌 · 더블클릭 포커스 · 장소 마커는 줌인 시 표시
        <span className="block">화면은 조작·변경이 있을 때만 다시 그립니다(저사양 기기 배터리·CPU 절약).</span>
      </p>
    </div>
  );
}
