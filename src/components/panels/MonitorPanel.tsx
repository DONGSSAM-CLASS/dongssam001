import { useMemo, useState } from 'react';
import { buildRows, detailCsv, rowsToCsv, summarize, type MonitorRow } from '@/lib/monitor';
import { formatYear } from '@/lib/history';
import { useMonitorStore } from '@/store/monitorStore';
import type { ClassMemberDoc, MissionDoc, SubmissionDoc } from '@/types/firestore';

interface Props {
  sessionTitle: string;
  members: (ClassMemberDoc & { id: string })[];
  submissions: (SubmissionDoc & { id: string })[];
  missions: (MissionDoc & { id: string })[];
  /** 지구본 화면을 PNG 로 저장 */
  onExportPng: () => void;
}

function whenText(ts: unknown): string {
  const t = ts as { toDate?: () => Date } | null;
  return t?.toDate ? t.toDate().toLocaleString('ko-KR') : '';
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 교사 실시간 모니터링: 학생별 진행 상황·제출 현황·내보내기 */
export function MonitorPanel({ sessionTitle, members, submissions, missions, onExportPng }: Props) {
  const works = useMonitorStore((s) => s.works);
  const only = useMonitorStore((s) => s.onlyNumber);
  const setOnly = useMonitorStore((s) => s.setOnlyNumber);
  const show = useMonitorStore((s) => s.showClassWork);
  const setShow = useMonitorStore((s) => s.setShowClassWork);
  const [openList, setOpenList] = useState(true);

  const rows = useMemo(() => buildRows(members, works, submissions), [members, works, submissions]);
  const sum = useMemo(() => summarize(rows), [rows]);
  const published = missions.filter((m) => m.published);

  return (
    <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700 p-3 text-sm w-72 max-h-[38vh] overflow-y-auto">
      <div className="flex items-center gap-2">
        <h2 className="font-semibold">👀 실시간 현황</h2>
        <label className="ml-auto flex items-center gap-1 text-xs">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-amber-400" />
          지구본에 표시
        </label>
      </div>
      <p className="text-xs text-slate-300">
        가입 {sum.joined}/{sum.total} · 활동 {sum.working}명 · 핀 {sum.pins} · 루트 {sum.routes}
        {published.length > 0 && ` · 미션 제출 ${sum.submitted}/${sum.joined}`}
      </p>

      <div className="flex gap-1 text-xs">
        <button type="button" onClick={() => setOnly(null)} aria-pressed={only === null} className={`rounded px-2 py-1 ${only === null ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-700 hover:bg-slate-600'}`}>전체 보기</button>
        <button type="button" onClick={() => setOpenList((v) => !v)} className="rounded px-2 py-1 bg-slate-700 hover:bg-slate-600">{openList ? '목록 접기' : '목록 펴기'}</button>
      </div>

      {openList && (
        <ul className="space-y-0.5" aria-label="학생 목록">
          {rows.map((r) => (
            <li key={r.number}>
              <button
                type="button"
                onClick={() => setOnly(only === r.number ? null : r.number)}
                aria-pressed={only === r.number}
                className={`w-full flex items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs ${only === r.number ? 'bg-slate-700' : 'hover:bg-slate-800'}`}
              >
                <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ background: r.color, opacity: r.pins || r.routes ? 1 : 0.25 }} aria-hidden="true" />
                <span className="w-6 tabular-nums text-slate-400">{r.number}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <StatusBadge row={r} hasMission={published.length > 0} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {only !== null && (
        <div className="border-t border-slate-700 pt-2 text-xs">
          <h3 className="font-semibold text-slate-300">{only}번 학생 상세</h3>
          {published.map((m) => {
            const sub = submissions.find((x) => x.missionId === m.id && x.number === only);
            return (
              <div key={m.id} className="mt-1">
                <p className="text-slate-300">🎯 {m.title} — {sub?.status === 'submitted' ? `제출 ${whenText(sub.submittedAt)}` : sub ? '작성 중' : '미제출'}</p>
                {sub?.answers?.note && <p className="text-slate-400 whitespace-pre-line">{sub.answers.note}</p>}
              </div>
            );
          })}
          {published.length === 0 && <p className="text-slate-400">배포한 미션이 없습니다.</p>}
        </div>
      )}
      <div className="border-t border-slate-700 pt-2 flex flex-wrap gap-1 text-xs">
        <button type="button" className="btn-icon text-xs" onClick={() => download(rowsToCsv(rows, sessionTitle), `${sessionTitle}-요약.csv`, 'text/csv;charset=utf-8')}>📊 요약 CSV</button>
        <button type="button" className="btn-icon text-xs" onClick={() => download(detailCsv(members, works, sessionTitle), `${sessionTitle}-핀루트.csv`, 'text/csv;charset=utf-8')}>📊 핀·루트 CSV</button>
        <button type="button" className="btn-icon text-xs" onClick={onExportPng}>🖼 지구본 PNG</button>
      </div>
      <p className="text-[10px] text-slate-400">학생 화면이 저장될 때마다 자동으로 갱신됩니다(수업이 열려 있는 동안만).</p>
    </div>
  );
}

function StatusBadge({ row, hasMission }: { row: MonitorRow; hasMission: boolean }) {
  if (!row.joined) return <span className="text-[10px] text-slate-400">미가입</span>;
  if (hasMission && row.submitted) return <span className="text-[10px] text-emerald-300">제출</span>;
  if (row.pins || row.routes) return <span className="text-[10px] text-slate-300 tabular-nums">📍{row.pins} 🧭{row.routes}{row.lastYear !== null && <span className="text-slate-400"> {formatYear(row.lastYear)}</span>}</span>;
  return <span className="text-[10px] text-slate-400">대기</span>;
}
