import { useState, type FormEvent } from 'react';
import { createMission, updateMission, deleteMission } from '@/lib/sessionService';
import type { MissionDoc } from '@/types/firestore';

interface Props {
  teacherId: string;
  classId: string;
  sessionId: string;
  missions: (MissionDoc & { id: string })[];
}

/** 교사: 이 세션의 학생 미션 배포 */
export function MissionComposer({ teacherId, classId, sessionId, missions }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minPins, setMinPins] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createMission(teacherId, {
        classId,
        sessionId,
        title: title.trim(),
        description: description.trim(),
        requirements: [{ id: 'r1', text: `핀을 ${minPins}개 이상 찍기`, check: { type: 'min_pins', value: minPins } }],
        published: true,
        dueAt: null,
      });
      setTitle('');
      setDescription('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-auto rounded-2xl bg-slate-900/90 backdrop-blur border border-slate-700 p-3 text-sm w-72">
      <button type="button" className="flex w-full items-center gap-2" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <h2 className="font-semibold">🎯 미션 ({missions.length})</h2>
        <span className="ml-auto text-xs text-slate-400">{open ? '접기' : '만들기'}</span>
      </button>
      {missions.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-xs">
          {missions.map((m) => (
            <li key={m.id} className="flex items-center gap-1">
              <span className="flex-1 truncate">{m.published ? '🟢' : '⚪'} {m.title}</span>
              <button type="button" className="btn-icon text-[10px]" onClick={() => void updateMission(m.id, { published: !m.published })}>{m.published ? '내리기' : '배포'}</button>
              <button type="button" className="btn-icon text-[10px]" onClick={() => { if (confirm(`"${m.title}" 미션을 삭제할까요?`)) void deleteMission(m.id); }}>✕</button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <form onSubmit={submit} className="mt-2 flex flex-col gap-1">
          <input className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs" placeholder="미션 제목 (예: 3개 대륙 마킹하기)" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="미션 제목" />
          <textarea className="rounded bg-slate-800 border border-slate-600 px-2 py-1 text-xs" rows={2} placeholder="설명 (예: 1500년 당시 세 대륙에서 각각 나라 1개와 인물 1명을 찾아 핀을 찍고 메모를 쓰세요)" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="미션 설명" />
          <label className="flex items-center gap-1 text-xs">
            핀 최소 개수
            <input type="number" min={1} max={20} value={minPins} onChange={(e) => setMinPins(Number(e.target.value))} className="w-16 rounded bg-slate-800 border border-slate-600 px-1 py-0.5" />
          </label>
          {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
          <button type="submit" disabled={busy || !title.trim()} className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1 text-xs font-bold disabled:opacity-50">배포하기</button>
        </form>
      )}
    </div>
  );
}
