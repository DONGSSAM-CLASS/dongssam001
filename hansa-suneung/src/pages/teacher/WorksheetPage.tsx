import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { flattenUnits, unitPath, descendantIds } from '../../lib/units';
import { COPYRIGHT_FOOTER } from '../../constants';

/** 학습지 내보내기 (기능 12). 선택 단원의 기출 목록을 인쇄용 표로 렌더링 → 브라우저 인쇄(PDF 저장). */
export default function WorksheetPage() {
  const { curriculum, items, examById, unitById } = useData();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [includePending, setIncludePending] = useState(false);

  const leaves = useMemo(
    () => flattenUnits(curriculum.units).filter((f) => !f.unit.children?.length),
    [curriculum],
  );

  const rows = useMemo(() => {
    if (selected.size === 0) return [];
    const targetIds = new Set<string>();
    for (const uid of selected) {
      const f = unitById.get(uid);
      if (f) descendantIds(f.unit).forEach((id) => targetIds.add(id));
    }
    return items
      .filter((it) => (includePending ? true : it.verified))
      .filter((it) => it.unitIds.some((u) => targetIds.has(u)))
      .sort(
        (a, b) =>
          (examById.get(a.examId)?.schoolYear ?? 0) - (examById.get(b.examId)?.schoolYear ?? 0) ||
          a.number - b.number,
      );
  }, [selected, items, includePending, examById, unitById]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <div className="no-print mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">학습지 내보내기</h1>
            <p className="text-sm text-slate-500">단원을 선택하고 인쇄하면 기출 목록 표를 PDF로 저장할 수 있습니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/teacher" className="text-sm text-blue-600 hover:underline">← 교사용 홈</Link>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={rows.length === 0}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
            >
              인쇄 / PDF 저장
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">단원 선택 ({selected.size})</span>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includePending}
                onChange={(e) => setIncludePending(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              검수 대기 문항도 포함
            </label>
          </div>
          <div className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {leaves.map((f) => (
              <label key={f.unit.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selected.has(f.unit.id)}
                  onChange={() => toggle(f.unit.id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <span className="text-slate-700">{unitPath(unitById, f.unit.id)}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 인쇄 영역 */}
      <div>
        <div className="mb-2 hidden print:block">
          <h2 className="text-lg font-bold">한국사 수능 기출 학습지</h2>
          <p className="text-xs text-slate-500">
            {Array.from(selected)
              .map((id) => unitById.get(id)?.unit.title)
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="no-print rounded-lg border border-dashed bg-white p-6 text-center text-sm text-slate-400">
            단원을 선택하면 기출 목록이 표로 나타납니다.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 print:bg-transparent">
                <th className="border px-2 py-1.5 text-left">학년도</th>
                <th className="border px-2 py-1.5 text-left">시행</th>
                <th className="border px-2 py-1.5 text-center">번호</th>
                <th className="border px-2 py-1.5 text-left">주제</th>
                <th className="border px-2 py-1.5 text-left">유형</th>
                <th className="border px-2 py-1.5 text-center">PDF쪽</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it) => {
                const ex = examById.get(it.examId);
                return (
                  <tr key={it.itemId}>
                    <td className="border px-2 py-1.5">{ex?.schoolYear ?? ''}</td>
                    <td className="border px-2 py-1.5">{ex?.type ?? ''}</td>
                    <td className="border px-2 py-1.5 text-center">{it.number}</td>
                    <td className="border px-2 py-1.5">
                      {it.topic ?? '(주제 미입력)'}
                      {!it.verified && <span className="ml-1 text-xs text-yellow-700">[검수대기]</span>}
                    </td>
                    <td className="border px-2 py-1.5">{it.itemType ?? ''}</td>
                    <td className="border px-2 py-1.5 text-center">{it.pdfPage ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {rows.length > 0 && (
          <p className="mt-3 text-[10px] text-slate-500">{COPYRIGHT_FOOTER}</p>
        )}
      </div>
    </div>
  );
}
