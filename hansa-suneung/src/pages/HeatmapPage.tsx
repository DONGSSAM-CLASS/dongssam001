import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { buildHeatmap, heatColor } from '../lib/heatmap';

/** 출제 빈도 히트맵 (기능 2). 단원(행)×학년도(열), 출제 수 색 농도. 셀 클릭 시 해당 단원으로 이동. */
export default function HeatmapPage() {
  const { curriculum, items, examById, schoolYears } = useData();
  const navigate = useNavigate();

  const { rows, max, colTotals } = useMemo(
    () => buildHeatmap(curriculum.units, items, examById, schoolYears, true),
    [curriculum, items, examById, schoolYears],
  );

  if (schoolYears.length === 0 || rows.every((r) => r.total === 0)) {
    return (
      <div className="rounded-lg border border-dashed bg-white p-8 text-center text-slate-400">
        출제 데이터가 아직 없습니다. 검수 완료된 문항이 등록되면 히트맵이 표시됩니다.
      </div>
    );
  }

  const goto = (unitId: string, year: number) =>
    navigate(`/?unit=${encodeURIComponent(unitId)}&year=${year}`);

  let currentTop = '';

  return (
    <div>
      <div className="mb-3">
        <h1 className="text-xl font-bold text-slate-900">출제 빈도 히트맵</h1>
        <p className="text-sm text-slate-500">
          소단원(행) × 학년도(열)의 출제 수입니다. 색이 진할수록 자주 출제된 단원입니다. 셀을 누르면
          해당 단원으로 이동합니다.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 min-w-[240px] border-b bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">
                단원
              </th>
              {schoolYears.map((y) => (
                <th key={y} className="border-b px-2 py-2 text-center font-semibold text-slate-600">
                  {y}
                </th>
              ))}
              <th className="border-b px-2 py-2 text-center font-semibold text-slate-500">합계</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const showGroup = r.top.title !== currentTop;
              currentTop = r.top.title;
              return (
                <FragmentRow
                  key={r.unit.id}
                  showGroup={showGroup}
                  groupTitle={r.top.title}
                  colSpan={schoolYears.length + 2}
                >
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-[280px] truncate border-b bg-white px-3 py-1.5 text-left font-normal text-slate-700"
                    title={r.unit.title}
                  >
                    {r.unit.title}
                  </th>
                  {r.counts.map((c, i) => (
                    <td key={i} className="border-b p-0.5 text-center">
                      {c > 0 ? (
                        <button
                          type="button"
                          onClick={() => goto(r.unit.id, schoolYears[i])}
                          className={`h-8 w-full rounded ${heatColor(c, max)} text-xs font-semibold`}
                          aria-label={`${r.unit.title} ${schoolYears[i]}학년도 출제 ${c}건`}
                        >
                          {c}
                        </button>
                      ) : (
                        <div className={`h-8 w-full rounded ${heatColor(0, max)}`} aria-hidden />
                      )}
                    </td>
                  ))}
                  <td className="border-b px-2 text-center font-semibold text-slate-600">{r.total}</td>
                </FragmentRow>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-600">
                학년도 합계
              </th>
              {colTotals.map((t, i) => (
                <td key={i} className="px-2 py-2 text-center font-semibold text-slate-600">
                  {t}
                </td>
              ))}
              <td className="px-2 py-2 text-center font-bold text-slate-700">
                {colTotals.reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/** 대단원이 바뀌는 지점에 그룹 헤더 행을 먼저 렌더링한다. */
function FragmentRow({
  showGroup,
  groupTitle,
  colSpan,
  children,
}: {
  showGroup: boolean;
  groupTitle: string;
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <>
      {showGroup && (
        <tr>
          <td
            colSpan={colSpan}
            className="border-b bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
          >
            {groupTitle}
          </td>
        </tr>
      )}
      <tr className="hover:bg-slate-50">{children}</tr>
    </>
  );
}
