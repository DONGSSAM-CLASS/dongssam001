import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { flattenUnits, unitPath } from '../../lib/units';
import { examLabel, questionPdfLink } from '../../lib/pdfLink';

/**
 * 수업 투사 모드 (/teacher/project, 기능 10).
 * 단원 선택 시 대표 문항 정보를 큰 글씨로 표시(프로젝터용). 키보드 좌우로 문항 이동.
 * 전체화면 레이아웃(학생 네비게이션 없음).
 */
export default function ProjectionPage() {
  const { curriculum, unitById, examById, itemsForUnit } = useData();
  const [params, setParams] = useSearchParams();
  const unitId = params.get('unit') ?? '';
  const [idx, setIdx] = useState(0);

  const leaves = useMemo(
    () => flattenUnits(curriculum.units).filter((f) => !f.unit.children?.length),
    [curriculum],
  );

  const items = useMemo(
    () => (unitId ? itemsForUnit(unitId, { verifiedOnly: true }) : []),
    [unitId, itemsForUnit],
  );

  const setUnit = (id: string) => {
    const n = new URLSearchParams(params);
    if (id) n.set('unit', id);
    else n.delete('unit');
    setParams(n, { replace: true });
    setIdx(0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (items.length === 0) return;
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(items.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  const cur = items[Math.min(idx, Math.max(items.length - 1, 0))];
  const q = cur ? questionPdfLink(cur, examById.get(cur.examId)) : null;

  const goFullscreen = () => {
    const el = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <div className="no-print flex flex-wrap items-center gap-3 border-b border-slate-700 px-4 py-2">
        <Link to="/teacher" className="text-sm text-slate-300 hover:text-white">← 교사용 홈</Link>
        <select
          value={unitId}
          onChange={(e) => setUnit(e.target.value)}
          className="rounded-md bg-slate-800 px-2 py-1.5 text-sm text-white"
        >
          <option value="">단원 선택…</option>
          {leaves.map((f) => (
            <option key={f.unit.id} value={f.unit.id}>
              {unitPath(unitById, f.unit.id)}
            </option>
          ))}
        </select>
        {items.length > 0 && (
          <span className="text-sm text-slate-400">
            {idx + 1} / {items.length} · ← → 키로 이동
          </span>
        )}
        <button onClick={goFullscreen} className="ml-auto rounded-md bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">
          전체화면
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        {!unitId ? (
          <p className="text-2xl text-slate-400">단원을 선택하세요.</p>
        ) : items.length === 0 ? (
          <p className="text-2xl text-slate-400">이 단원의 (검수 완료) 기출이 없습니다.</p>
        ) : cur ? (
          <div className="max-w-4xl text-center">
            <div className="mb-4 text-2xl font-medium text-blue-300">
              {examLabel(examById.get(cur.examId))} · {cur.number}번
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight">{cur.topic ?? '(주제 미입력)'}</h1>
            {cur.itemType && (
              <div className="mb-4 inline-block rounded-full bg-slate-700 px-4 py-1.5 text-xl">
                {cur.itemType}
              </div>
            )}
            {cur.keywords.length > 0 && (
              <div className="mb-8 flex flex-wrap justify-center gap-2 text-2xl text-slate-300">
                {cur.keywords.map((k) => (
                  <span key={k}>#{k}</span>
                ))}
              </div>
            )}
            {q && (
              <a
                href={q.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-xl font-medium hover:bg-blue-700"
              >
                공식 PDF 보기{q.isDeepLink && cur.pdfPage ? ` (${cur.pdfPage}쪽)` : ''}
              </a>
            )}
          </div>
        ) : null}
      </div>

      {items.length > 1 && (
        <div className="no-print flex justify-center gap-4 pb-8">
          <button
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx <= 0}
            className="rounded-lg bg-slate-700 px-6 py-2 text-lg hover:bg-slate-600 disabled:opacity-30"
          >
            ← 이전
          </button>
          <button
            onClick={() => setIdx((i) => Math.min(items.length - 1, i + 1))}
            disabled={idx >= items.length - 1}
            className="rounded-lg bg-slate-700 px-6 py-2 text-lg hover:bg-slate-600 disabled:opacity-30"
          >
            다음 →
          </button>
        </div>
      )}
    </div>
  );
}
