import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { leafFrequencies } from '../lib/stats';
import { STATUS_LABEL, STATUS_STYLE, useRecords, type RecordStatus } from '../records/RecordsContext';

const WEIGHT: Record<RecordStatus, number> = { wrong: 2, unsure: 1, done: 0 };

/** 취약 단원 리포트 (기능 7). 출제 빈도 × 내 오답/헷갈림을 결합해 '빈출인데 약한 단원' 정렬. */
export default function ReportPage() {
  const { curriculum, items } = useData();
  const { records } = useRecords();

  const freqs = useMemo(() => leafFrequencies(curriculum, items, true), [curriculum, items]);

  const weak = useMemo(() => {
    return freqs
      .map((f) => {
        const status = records[f.unit.id];
        const weight = status ? WEIGHT[status] : 0;
        return { ...f, status, score: f.freq * weight };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.freq - a.freq);
  }, [freqs, records]);

  // 빈출 상위인데 아직 학습 기록이 없는 단원(추천)
  const suggestions = useMemo(
    () => freqs.filter((f) => f.freq > 0 && !records[f.unit.id]).slice(0, 8),
    [freqs, records],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">취약 단원 리포트</h1>
        <p className="text-sm text-slate-500">
          출제 빈도와 내 학습 상태(오답·헷갈림)를 결합했습니다. 우선순위가 높을수록 '자주 나오는데 약한' 단원입니다.
        </p>
      </div>

      {weak.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-slate-400">
          아직 '오답' 또는 '헷갈림'으로 표시한 단원이 없습니다. 단원 탐색·내 학습에서 상태를 표시하면 여기에 우선순위가 나타납니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-3 py-2">순위</th>
                <th className="px-3 py-2">단원</th>
                <th className="px-3 py-2 text-center">출제 빈도</th>
                <th className="px-3 py-2 text-center">내 상태</th>
                <th className="px-3 py-2 text-center">우선순위</th>
              </tr>
            </thead>
            <tbody>
              {weak.map((r, i) => (
                <tr key={r.unit.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link to={`/?unit=${encodeURIComponent(r.unit.id)}`} className="text-slate-700 hover:text-blue-600">
                      {r.path}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-center font-medium">{r.freq}</td>
                  <td className="px-3 py-2 text-center">
                    {r.status && (
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ring-1 ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-rose-600">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">빈출 단원(아직 학습 기록 없음)</h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.unit.id}
                to={`/?unit=${encodeURIComponent(s.unit.id)}`}
                className="rounded-md border bg-white px-2.5 py-1.5 text-sm text-slate-600 hover:border-blue-300"
              >
                {s.unit.title} <span className="text-blue-600">· {s.freq}회</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
