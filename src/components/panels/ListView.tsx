import { formatYear, REGION_LABELS } from '@/lib/history';
import { useGlobeStore } from '@/store/globeStore';
import { useVisibleFigures, useVisiblePolities } from '@/lib/useVisibleData';

/** 접근성: 지구본 조작을 대체하는 목록형 보기 (키보드·스크린리더) */
export function ListView() {
  const year = useGlobeStore((s) => s.year);
  const select = useGlobeStore((s) => s.select);
  const polities = useVisiblePolities();
  const figures = useVisibleFigures();
  return (
    <div className="h-full overflow-y-auto p-4 bg-slate-950">
      <h2 className="text-lg font-bold">{formatYear(year)}의 세계 — 목록형 보기</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="lv-polities">
          <h3 id="lv-polities" className="font-semibold text-amber-300">왕조·국가 ({polities.length})</h3>
          <table className="mt-1 w-full text-sm">
            <thead className="text-left text-xs text-slate-400"><tr><th className="py-1">이름</th><th>문화권</th><th>존속</th><th>수도</th></tr></thead>
            <tbody>
              {polities.map((p) => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="py-1"><button type="button" className="underline" onClick={() => select({ kind: 'polity', id: p.id })}>{p.name_ko}</button></td>
                  <td>{REGION_LABELS[p.region]}</td>
                  <td className="whitespace-nowrap">{formatYear(p.start_year)}~{formatYear(p.end_year)}</td>
                  <td>{p.capital}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section aria-labelledby="lv-figures">
          <h3 id="lv-figures" className="font-semibold text-amber-300">인물 ({figures.length})</h3>
          <table className="mt-1 w-full text-sm">
            <thead className="text-left text-xs text-slate-400"><tr><th className="py-1">이름</th><th>생몰</th><th>업적</th></tr></thead>
            <tbody>
              {figures.map((f) => (
                <tr key={f.id} className="border-t border-slate-800">
                  <td className="py-1"><button type="button" className="underline" onClick={() => select({ kind: 'figure', id: f.id })}>{f.name_ko}</button></td>
                  <td className="whitespace-nowrap">{formatYear(f.birth_year)}~{formatYear(f.death_year)}</td>
                  <td>{f.one_liner_ko}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
