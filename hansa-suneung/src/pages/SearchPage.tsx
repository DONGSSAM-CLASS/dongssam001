import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { examLabel } from '../lib/pdfLink';
import { unitPath } from '../lib/units';
import type { ExamType } from '../types/schema';
import ItemCard from '../components/ItemCard';

const TYPES: ExamType[] = ['수능', '6월', '9월'];

/** 키워드 검색(기능 4) + 역방향 탐색(기능 5). */
export default function SearchPage() {
  const { items, exams, examById, unitById } = useData();

  // ---------- 키워드 검색 ----------
  const [q, setQ] = useState('');
  const kw = q.trim();

  const itemHits = useMemo(() => {
    if (!kw) return [];
    return items
      .filter((it) => it.verified)
      .filter(
        (it) =>
          (it.topic ?? '').includes(kw) ||
          it.keywords.some((k) => k.includes(kw)) ||
          it.itemId.includes(kw),
      );
  }, [items, kw]);

  const unitHits = useMemo(() => {
    if (!kw) return [];
    return Array.from(unitById.values())
      .filter(
        (f) =>
          f.unit.title.includes(kw) ||
          (f.unit.keywords ?? []).some((k) => k.includes(kw)),
      )
      .slice(0, 12);
  }, [unitById, kw]);

  // 연도별 출제 요약
  const yearSummary = useMemo(() => {
    const m = new Map<number, number>();
    for (const it of itemHits) {
      const y = examById.get(it.examId)?.schoolYear;
      if (y != null) m.set(y, (m.get(y) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [itemHits, examById]);

  // ---------- 역방향 탐색 ----------
  const [ry, setRy] = useState<number | ''>('');
  const [rt, setRt] = useState<ExamType>('수능');
  const [rn, setRn] = useState<string>('');
  const [searched, setSearched] = useState(false);

  const reverse = useMemo(() => {
    if (ry === '' || !rn) return null;
    const exam = exams.find((e) => e.schoolYear === ry && e.type === rt);
    if (!exam) return { exam: null, item: null };
    const item = items.find((it) => it.examId === exam.examId && it.number === Number(rn));
    return { exam, item: item ?? null };
  }, [ry, rt, rn, exams, items]);

  const schoolYears = Array.from(new Set(exams.map((e) => e.schoolYear))).sort((a, b) => b - a);

  return (
    <div className="space-y-8">
      {/* 키워드 검색 */}
      <section>
        <h1 className="mb-2 text-xl font-bold text-slate-900">키워드 검색</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="주제·키워드 검색 (예: 대동법)"
          className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-400"
        />

        {kw && (
          <div className="mt-3 space-y-4">
            {yearSummary.length > 0 && (
              <div className="flex flex-wrap gap-1.5 text-sm">
                <span className="text-slate-500">연도별:</span>
                {yearSummary.map(([y, c]) => (
                  <span key={y} className="rounded bg-slate-100 px-2 py-0.5">
                    {y}학년도 {c}건
                  </span>
                ))}
              </div>
            )}

            {unitHits.length > 0 && (
              <div>
                <h2 className="mb-1 text-sm font-semibold text-slate-500">단원 {unitHits.length}건</h2>
                <div className="flex flex-wrap gap-2">
                  {unitHits.map((f) => (
                    <Link
                      key={f.unit.id}
                      to={`/?unit=${encodeURIComponent(f.unit.id)}`}
                      className="rounded-md border bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:border-blue-300"
                    >
                      {unitPath(unitById, f.unit.id)}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">문항 {itemHits.length}건</h2>
              {itemHits.length === 0 ? (
                <p className="text-sm text-slate-400">일치하는 (검수 완료) 문항이 없습니다.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {itemHits.map((it) => (
                    <ItemCard key={it.itemId} item={it} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 역방향 탐색 */}
      <section>
        <h1 className="mb-2 text-xl font-bold text-slate-900">역방향 탐색</h1>
        <p className="mb-3 text-sm text-slate-500">
          "2024학년도 수능 12번"처럼 회차·번호로 찾으면 해당 문항이 속한 단원과 관련 단원을 보여줍니다.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">학년도</span>
            <select
              value={ry}
              onChange={(e) => setRy(e.target.value ? Number(e.target.value) : '')}
              className="rounded-md border px-2 py-1.5"
            >
              <option value="">선택</option>
              {schoolYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">시행</span>
            <select
              value={rt}
              onChange={(e) => setRt(e.target.value as ExamType)}
              className="rounded-md border px-2 py-1.5"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-500">문항 번호</span>
            <input
              type="number"
              min={1}
              value={rn}
              onChange={(e) => setRn(e.target.value)}
              className="w-24 rounded-md border px-2 py-1.5"
            />
          </label>
          <button
            type="button"
            onClick={() => setSearched(true)}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            찾기
          </button>
        </div>

        {searched && reverse && (
          <div className="mt-4 rounded-lg border bg-white p-4">
            {!reverse.exam ? (
              <p className="text-sm text-slate-500">해당 회차 정보가 없습니다.</p>
            ) : !reverse.item ? (
              <p className="text-sm text-slate-500">
                {examLabel(reverse.exam)} {rn}번 문항 메타데이터가 아직 없습니다.
              </p>
            ) : (
              <ReverseResult item={reverse.item} />
            )}
          </div>
        )}
      </section>
    </div>
  );

  function ReverseResult({ item }: { item: (typeof items)[number] }) {
    const related = new Map<string, string>();
    for (const uid of item.unitIds) {
      const f = unitById.get(uid);
      if (!f) continue;
      // 같은 대단원 아래의 다른 소단원을 관련 단원으로 제시
      const top = f.ancestors[0];
      const pool = top ? top : f.unit;
      const collect = (u: typeof pool) => {
        if (!u.children?.length) {
          if (u.id !== uid) related.set(u.id, unitPath(unitById, u.id));
        } else u.children.forEach(collect);
      };
      collect(pool);
    }
    return (
      <div>
        <div className="mb-1 text-sm font-semibold text-slate-700">
          {examLabel(examById.get(item.examId))} {item.number}번
        </div>
        <div className="text-[15px] font-medium text-slate-900">{item.topic ?? '(주제 미입력)'}</div>
        <div className="mt-3">
          <div className="text-xs font-semibold text-slate-500">속한 단원</div>
          <div className="mt-1 flex flex-wrap gap-2">
            {item.unitIds.map((uid) => (
              <Link
                key={uid}
                to={`/?unit=${encodeURIComponent(uid)}`}
                className="rounded-md bg-blue-50 px-2.5 py-1 text-sm text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
              >
                {unitPath(unitById, uid)}
              </Link>
            ))}
          </div>
        </div>
        {related.size > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500">관련 단원(같은 대단원)</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {Array.from(related.entries()).map(([id, label]) => (
                <Link
                  key={id}
                  to={`/?unit=${encodeURIComponent(id)}`}
                  className="rounded-md border px-2.5 py-1 text-sm text-slate-600 hover:border-blue-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}
