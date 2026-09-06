import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../data/DataContext';
import { leafFrequencies } from '../lib/stats';
import { STATUS_LABEL, STATUS_STYLE, useRecords, type RecordStatus } from '../records/RecordsContext';

const WEIGHT: Record<RecordStatus, number> = { wrong: 3, unsure: 2, done: -1 };

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** D-day 학습 플랜 (기능 8). 목표 날짜까지 출제 빈도(+취약도) 순으로 단원을 날짜에 배분. */
export default function PlanPage() {
  const { curriculum, items } = useData();
  const { records } = useRecords();

  const today = new Date();
  const defaultTarget = new Date(today.getTime() + 13 * 86400000);
  const [target, setTarget] = useState<string>(toDateStr(defaultTarget));

  const freqs = useMemo(() => leafFrequencies(curriculum, items, true), [curriculum, items]);

  // 우선순위: 취약도(오답>헷갈림) + 출제 빈도. 학습완료는 뒤로.
  const ordered = useMemo(() => {
    return [...freqs].sort((a, b) => {
      const wa = (records[a.unit.id] ? WEIGHT[records[a.unit.id]] : 0) + a.freq;
      const wb = (records[b.unit.id] ? WEIGHT[records[b.unit.id]] : 0) + b.freq;
      return wb - wa;
    });
  }, [freqs, records]);

  const days = useMemo(() => {
    const t = new Date(target + 'T00:00:00');
    const start = new Date(toDateStr(today) + 'T00:00:00');
    const diff = Math.floor((t.getTime() - start.getTime()) / 86400000) + 1; // 오늘 포함
    return Math.max(1, diff);
  }, [target]);

  const plan = useMemo(() => {
    const perDay = Math.ceil(ordered.length / days);
    const buckets: { date: string; units: typeof ordered }[] = [];
    for (let d = 0; d < days; d++) {
      const date = new Date(toDateStr(today) + 'T00:00:00');
      date.setDate(date.getDate() + d);
      buckets.push({ date: toDateStr(date), units: ordered.slice(d * perDay, (d + 1) * perDay) });
    }
    return buckets.filter((b) => b.units.length > 0);
  }, [ordered, days]);

  const dday = days - 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">D-day 학습 플랜</h1>
        <p className="text-sm text-slate-500">
          목표 날짜를 정하면 출제 빈도와 취약도를 반영해 단원을 날짜별로 배분합니다.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-slate-500">목표 날짜</span>
          <input
            type="date"
            value={target}
            min={toDateStr(today)}
            onChange={(e) => setTarget(e.target.value)}
            className="rounded-md border px-2 py-1.5"
          />
        </label>
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          D-{dday} · {days}일 · 단원 {ordered.length}개
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {plan.map((b, i) => (
          <div key={b.date} className="rounded-lg border bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Day {i + 1}</span>
              <span className="text-xs text-slate-400">{b.date}</span>
            </div>
            <ul className="space-y-1.5">
              {b.units.map((u) => {
                const st = records[u.unit.id];
                return (
                  <li key={u.unit.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link
                      to={`/?unit=${encodeURIComponent(u.unit.id)}`}
                      className="truncate text-slate-700 hover:text-blue-600"
                      title={u.path}
                    >
                      {u.unit.title}
                    </Link>
                    <span className="flex shrink-0 items-center gap-1">
                      {u.freq > 0 && <span className="text-xs text-blue-600">{u.freq}회</span>}
                      {st && (
                        <span className={`rounded px-1 text-[10px] font-medium ring-1 ${STATUS_STYLE[st]}`}>
                          {STATUS_LABEL[st]}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
