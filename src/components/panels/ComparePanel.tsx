import { useMemo } from 'react';
import { formatYear, groupByRegion, REGION_COLORS, REGION_LABELS } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import { useVisibleFigures, useVisiblePolities } from '@/lib/useVisibleData';
import type { Region } from '@/types/history';

const REGION_ORDER: Region[] = ['east_asia', 'southeast_asia', 'central_asia', 'south_asia', 'west_asia', 'europe', 'africa', 'americas', 'oceania'];

/** 동시대 비교 패널: 설정 연대 기준 대륙(문화권)별 왕조·인물 요약 카드 자동 생성 */
export function ComparePanel() {
  const year = useGlobeStore((s) => s.year);
  const select = useGlobeStore((s) => s.select);
  const flyTo = useGlobeStore((s) => s.flyTo);
  const polities = useVisiblePolities();
  const figures = useVisibleFigures();

  const cards = useMemo(() => {
    const byRegion = groupByRegion(polities);
    return REGION_ORDER.map((region) => {
      const ps = byRegion.get(region) ?? [];
      const ids = new Set(ps.map((p) => p.id));
      const fs = figures.filter((f) => f.polity_id && ids.has(f.polity_id));
      return { region, polities: ps, figures: fs };
    }).filter((c) => c.polities.length > 0 || c.figures.length > 0);
  }, [polities, figures]);

  return (
    <section aria-label={`${formatYear(year)} 동시대 비교`} className="rounded-2xl bg-slate-900/85 backdrop-blur border border-slate-700 px-3 py-2">
      <h2 className="text-xs font-semibold text-slate-300 mb-1">{formatYear(year)} — 동시대 비교</h2>
      {cards.length === 0 ? (
        <p className="text-xs text-slate-400">이 연대에 표시할 자료가 아직 없습니다. (데이터 3단계에서 보강)</p>
      ) : (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {cards.map((c) => (
            <li key={c.region} className="min-w-[11rem] shrink-0 rounded-xl bg-slate-800/80 border-l-4 p-2" style={{ borderColor: REGION_COLORS[c.region] }}>
              <h3 className="text-xs font-bold">{REGION_LABELS[c.region]}</h3>
              <ul className="mt-1 flex flex-wrap gap-1">
                {c.polities.map((p) => (
                  <li key={p.id}>
                    <button type="button" className="rounded bg-slate-700 px-1.5 py-0.5 text-[11px] hover:bg-slate-600" onClick={() => { select({ kind: 'polity', id: p.id }); flyTo(p.centroid[0], p.centroid[1]); }}>
                      {p.name_ko}
                    </button>
                  </li>
                ))}
              </ul>
              {c.figures.length > 0 && (
                <p className="mt-1 text-[11px] text-amber-200">
                  {c.figures.map((f, i) => (
                    <button key={f.id} type="button" className="hover:underline" onClick={() => { select({ kind: 'figure', id: f.id }); flyTo(f.activity_location[0], f.activity_location[1]); }}>
                      {i > 0 && ' · '}{f.name_ko}
                    </button>
                  ))}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
