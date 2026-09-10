import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Gamepad2, Trophy } from 'lucide-react';
import { watchClassProgress } from '@/lib/gameService';
import type { GameProgressDoc } from '@/types/firestore';
import { chapters, totalPoints } from '@/game/story';

type Row = GameProgressDoc & { id: string };

/**
 * 교사 대시보드용 — 학급의 『아직 오지 않은 광복』 게임 진행 현황.
 * 학생별 난이도·완료 미션 수·점수·마지막 진행 미션을 실시간으로 보여 준다.
 */
export function GameProgressPanel({ classId }: { classId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = watchClassProgress(
      classId,
      (r) => setRows(r),
      (e) => setError(e.message),
    );
    return () => unsub();
  }, [classId]);

  const total = chapters.length;
  const started = rows?.length ?? 0;
  const finished = rows?.filter((r) => (r.completed?.length ?? 0) >= total).length ?? 0;

  return (
    <section className="mt-8" aria-labelledby="game-progress">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="game-progress" className="flex items-center gap-1.5 text-lg font-semibold">
          <Gamepad2 className="size-5 text-amber-400" aria-hidden /> 『아직 오지 않은 광복』 진행 현황
        </h2>
        <Link
          to="/game/preview"
          className="ml-auto inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
        >
          <Eye className="size-4" aria-hidden /> 미리보기
        </Link>
      </div>

      {error && <p className="mt-2 text-sm text-red-300">진행 현황을 불러오지 못했습니다: {error}</p>}

      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <span className="rounded-lg bg-slate-800/70 px-3 py-1.5 text-slate-300">시작한 학생 <b className="text-amber-300">{started}</b>명</span>
        <span className="rounded-lg bg-slate-800/70 px-3 py-1.5 text-slate-300">전체 완료 <b className="text-emerald-300">{finished}</b>명</span>
        <span className="rounded-lg bg-slate-800/70 px-3 py-1.5 text-slate-300">미션 <b>{total}</b>개 · 만점 <b>{totalPoints}</b>점</span>
      </div>

      {rows === null ? (
        <p className="mt-2 text-sm text-slate-400">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">아직 게임을 시작한 학생이 없습니다. 학생이 로그인해 게임을 시작하면 여기에 나타납니다.</p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr>
                <th className="py-1">번호</th>
                <th>난이도</th>
                <th>진행</th>
                <th>완료 미션</th>
                <th>점수</th>
                <th>지금 미션</th>
              </tr>
            </thead>
            <tbody>
              {[...rows]
                .sort((a, b) => a.number - b.number)
                .map((r) => {
                  const done = r.completed?.length ?? 0;
                  const pct = Math.round((done / total) * 100);
                  const curIdx = chapters.findIndex((c) => c.id === r.currentChapter);
                  const curLabel = done >= total ? '🏁 완료' : curIdx >= 0 ? `${curIdx + 1}. ${chapters[curIdx].title.replace(/^제\d+장 · /, '')}` : '-';
                  return (
                    <tr key={r.id} className="border-t border-slate-800">
                      <td className="py-1.5">{r.number}</td>
                      <td>{r.level === 'high' ? '고등' : '중등'}</td>
                      <td className="w-40">
                        <div className="flex items-center gap-2">
                          <progress className="progress progress-warning h-2 w-24 align-middle" value={pct} max={100} />
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                      </td>
                      <td>{done} / {total}</td>
                      <td className="font-semibold text-amber-300"><Trophy className="mr-1 inline size-3.5" aria-hidden />{r.score ?? 0}</td>
                      <td className="text-xs text-slate-300" style={{ wordBreak: 'keep-all' }}>{curLabel}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
