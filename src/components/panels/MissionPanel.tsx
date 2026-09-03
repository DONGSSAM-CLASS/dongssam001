import { useState } from 'react';
import { submitMission } from '@/lib/sessionService';
import { useWorkStore } from '@/store/workStore';
import type { MissionDoc, SubmissionDoc } from '@/types/firestore';

interface Props {
  missions: (MissionDoc & { id: string })[];
  submissions: Record<string, SubmissionDoc>;
  ctx: { sessionId: string; classId: string; number: number; uid: string };
  readOnly?: boolean;
}

/** 학생 화면: 교사가 배포한 미션 확인 → 핀·루트를 근거로 제출 */
export function MissionPanel({ missions, submissions, ctx, readOnly }: Props) {
  const pins = useWorkStore((s) => s.pins);
  const routes = useWorkStore((s) => s.routes);
  const [open, setOpen] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (missions.length === 0) return null;

  const send = async (mission: MissionDoc & { id: string }, status: 'draft' | 'submitted') => {
    setBusy(true);
    setError(null);
    try {
      await submitMission({
        missionId: mission.id,
        sessionId: ctx.sessionId,
        classId: ctx.classId,
        number: ctx.number,
        uid: ctx.uid,
        answers: { note: answers[mission.id] ?? '' },
        pinIds: pins.map((p) => p.id),
        routeIds: routes.map((r) => r.id),
        status,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-auto w-full max-w-sm rounded-2xl bg-slate-900/90 backdrop-blur border border-amber-600/50 p-3 text-sm">
      <button type="button" className="flex w-full items-center gap-2" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <h2 className="font-semibold">🎯 미션 ({missions.length})</h2>
        <span className="ml-auto text-xs text-slate-400">{open ? '접기' : '펴기'}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {missions.map((m) => {
            const sub = submissions[m.id];
            const done = sub?.status === 'submitted';
            return (
              <li key={m.id} className="rounded-xl bg-slate-800/70 border border-slate-700 p-2">
                <h3 className="font-bold text-amber-200 text-sm">{m.title} {done && <span className="text-emerald-300 text-xs">✔ 제출함</span>}</h3>
                {m.description && <p className="mt-1 text-xs text-slate-300 whitespace-pre-line">{m.description}</p>}
                {m.requirements?.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {m.requirements.map((r) => (
                      <li key={r.id} className="flex gap-1">
                        <span aria-hidden="true">{checkOk(r.check, pins.length, routes.length) ? '✅' : '⬜'}</span>
                        <span className={checkOk(r.check, pins.length, routes.length) ? 'text-emerald-200' : ''}>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {!readOnly && (
                  <>
                    <textarea
                      className="mt-2 w-full rounded bg-slate-900 border border-slate-600 px-2 py-1 text-xs"
                      rows={2}
                      placeholder="알아낸 것을 적어 제출하세요"
                      aria-label={`${m.title} 답안`}
                      value={answers[m.id] ?? (sub?.answers?.note ?? '')}
                      onChange={(e) => setAnswers((p) => ({ ...p, [m.id]: e.target.value }))}
                    />
                    <div className="mt-1 flex gap-1 justify-end">
                      <button type="button" disabled={busy} className="btn-icon text-xs" onClick={() => void send(m, 'draft')}>임시 저장</button>
                      <button type="button" disabled={busy} className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1 text-xs font-bold disabled:opacity-50" onClick={() => void send(m, 'submitted')}>
                        {done ? '다시 제출' : '제출하기'}
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {error && <p role="alert" className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}

function checkOk(check: { type: string; value: number } | undefined, pins: number, routes: number) {
  if (!check) return false;
  if (check.type === 'min_pins') return pins >= check.value;
  if (check.type === 'min_routes') return routes >= check.value;
  return false;
}
