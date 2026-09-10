import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, Eye, Gamepad2, Trophy } from 'lucide-react';
import { watchClassProgress } from '@/lib/gameService';
import type { GameProgressDoc } from '@/types/firestore';
import { chapters, totalPoints } from '@/game/story';

type Row = GameProgressDoc & { id: string };

const shortTitle = (t: string) => t.replace(/^제\d+장 · /, '');

/**
 * 교사 대시보드용 — 학급의 『아직 오지 않은 광복』 게임 진행 현황.
 * 학생별 난이도·완료·점수를 실시간으로 보여 주고, 행을 펼치면 미션별 정오·시도·소감을 확인한다.
 * CSV 로 내려받아 평가·기록에 활용할 수 있다.
 */
export function GameProgressPanel({ classId }: { classId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

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
  const sorted = rows ? [...rows].sort((a, b) => a.number - b.number) : [];

  function totalAttempts(r: Row) {
    return Object.values(r.attempts ?? {}).reduce((s, n) => s + (n || 0), 0);
  }

  function downloadCsv() {
    if (!rows || rows.length === 0) return;
    const header = ['번호', '난이도', '완료미션', '점수', '총시도', '지금미션', '소감'];
    const lines = sorted.map((r) => {
      const done = r.completed?.length ?? 0;
      const curIdx = chapters.findIndex((c) => c.id === r.currentChapter);
      const cur = done >= total ? '완료' : curIdx >= 0 ? `${curIdx + 1}.${shortTitle(chapters[curIdx].title)}` : '-';
      const reflection = (r.reflections?.epilogue ?? '').replace(/\s+/g, ' ').trim();
      return [
        r.number,
        r.level === 'high' ? '고등' : '중등',
        `${done}/${total}`,
        r.score ?? 0,
        totalAttempts(r),
        cur,
        reflection,
      ]
        .map((v) => {
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',');
    });
    const csv = '﻿' + [header.join(','), ...lines].join('\n'); // BOM: 엑셀 한글 깨짐 방지
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `광복군게임_진행현황_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-8" aria-labelledby="game-progress">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="game-progress" className="flex items-center gap-1.5 text-lg font-semibold">
          <Gamepad2 className="size-5 text-amber-400" aria-hidden /> 『아직 오지 않은 광복』 진행 현황
        </h2>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            disabled={!rows || rows.length === 0}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600 disabled:opacity-50"
          >
            <Download className="size-4" aria-hidden /> CSV 내려받기
          </button>
          <Link
            to="/game/preview"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
          >
            <Eye className="size-4" aria-hidden /> 미리보기
          </Link>
        </div>
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
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="text-left text-xs text-slate-400">
              <tr>
                <th className="py-1 w-6" />
                <th>번호</th>
                <th>난이도</th>
                <th>진행</th>
                <th>완료</th>
                <th>점수</th>
                <th>지금 미션</th>
              </tr>
            </thead>
            {sorted.map((r) => {
                const done = r.completed?.length ?? 0;
                const pct = Math.round((done / total) * 100);
                const curIdx = chapters.findIndex((c) => c.id === r.currentChapter);
                const curLabel = done >= total ? '🏁 완료' : curIdx >= 0 ? `${curIdx + 1}. ${shortTitle(chapters[curIdx].title)}` : '-';
                const open = openId === r.id;
                return (
                  <tbody key={r.id}>
                    <tr
                      className="cursor-pointer border-t border-slate-800 hover:bg-slate-800/40"
                      onClick={() => setOpenId(open ? null : r.id)}
                    >
                      <td className="py-1.5 text-center">
                        <ChevronDown className={`inline size-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
                      </td>
                      <td>{r.number}</td>
                      <td>{r.level === 'high' ? '고등' : '중등'}</td>
                      <td className="w-40">
                        <div className="flex items-center gap-2">
                          <progress className="progress progress-warning h-2 w-24 align-middle" value={pct} max={100} />
                          <span className="text-xs text-slate-400">{pct}%</span>
                        </div>
                      </td>
                      <td>{done}/{total}</td>
                      <td className="font-semibold text-amber-300"><Trophy className="mr-1 inline size-3.5" aria-hidden />{r.score ?? 0}</td>
                      <td className="text-xs text-slate-300" style={{ wordBreak: 'keep-all' }}>{curLabel}</td>
                    </tr>
                    {open && (
                      <tr className="border-t border-slate-800/50 bg-slate-900/40">
                        <td />
                        <td colSpan={6} className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1.5">
                            {chapters.map((c, i) => {
                              const cleared = r.completed?.includes(c.id);
                              const att = r.attempts?.[c.id] ?? 0;
                              return (
                                <span
                                  key={c.id}
                                  className={`rounded-md px-2 py-1 text-xs ${cleared ? 'bg-emerald-900/50 text-emerald-200' : 'bg-slate-800 text-slate-500'}`}
                                  title={c.title}
                                >
                                  {i + 1}. {shortTitle(c.title)} {cleared ? `· ${att}회 시도` : ''}
                                </span>
                              );
                            })}
                          </div>
                          <p className="mt-2 text-xs text-slate-400">
                            <b className="text-slate-300">오늘의 한 문장:</b>{' '}
                            {r.reflections?.epilogue ? (
                              <span className="text-slate-200" style={{ wordBreak: 'keep-all' }}>“{r.reflections.epilogue}”</span>
                            ) : (
                              <span className="text-slate-500">아직 작성 전</span>
                            )}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })}
          </table>
        </div>
      )}
    </section>
  );
}
