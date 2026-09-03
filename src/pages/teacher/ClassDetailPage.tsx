import { useCallback, useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';
import {
  listClassMembers,
  moveStudent,
  preRegisterStudent,
  reissueClassCode,
  renameStudent,
  resetStudentPassword,
  setStudentActive,
  updateClass,
} from '@/lib/classService';
import { listClassSessions, setSessionStatus, deleteSession } from '@/lib/sessionService';
import { formatYear } from '@/lib/history';
import { useAuthStore } from '@/store/authStore';
import type { ClassDoc, ClassMemberDoc, SessionDoc } from '@/types/firestore';

type ClassRow = ClassDoc & { id: string };
type Member = ClassMemberDoc & { id: string };
type SessionRow = SessionDoc & { id: string };

function when(ts: unknown): string {
  const t = ts as { toDate?: () => Date } | null;
  if (!t?.toDate) return '—';
  const d = t.toDate();
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 학급 상세: 학급코드 · 학생 관리 · 세션 관리 */
export default function ClassDetailPage() {
  const { classId = '' } = useParams();
  const profile = useAuthStore((s) => s.profile);
  const [cls, setCls] = useState<ClassRow | null>(null);
  const [otherClasses, setOtherClasses] = useState<ClassRow[]>([]);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newName, setNewName] = useState('');

  const uid = profile?.uid;
  // reloadToken 을 올리면 목록을 다시 읽는다 (효과 안에서 동기 setState 를 피하는 패턴)
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, 'classes', classId));
        if (!snap.exists()) throw new Error('학급을 찾을 수 없습니다.');
        const [ms, ss, all] = await Promise.all([
          listClassMembers(classId),
          listClassSessions(classId),
          getDocs(query(collection(db, 'classes'), where('teacherId', '==', uid))),
        ]);
        if (!alive) return;
        setCls({ id: snap.id, ...(snap.data() as ClassDoc) });
        setMembers(ms);
        setSessions(ss);
        setOtherClasses(all.docs.map((d) => ({ id: d.id, ...(d.data() as ClassDoc) })).filter((c) => c.id !== classId && !c.archived));
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [classId, uid, reloadToken]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(msg);
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!cls) return <main className="p-6">{error ? <p className="text-red-300">{error}</p> : <p className="text-slate-400">불러오는 중…</p>}<Link to="/teacher" className="underline">← 대시보드</Link></main>;

  return (
    <main className="min-h-full p-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 flex-wrap">
        <Link to="/teacher" className="btn-icon">←</Link>
        <h1 className="text-2xl font-bold">{cls.name}</h1>
        <span className="text-sm text-slate-400">{cls.schoolLevel} · {cls.subject}</span>
        <div className="ml-auto flex gap-2 text-sm">
          <Link to={`/teacher/design?classId=${cls.id}`} className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1.5 font-bold">✏️ 수업 설계</Link>
          <button type="button" className="btn-icon" disabled={busy} onClick={() => void act(() => updateClass(cls.id, { archived: !cls.archived }), cls.archived ? '보관을 해제했습니다.' : '학급을 보관했습니다.')}>
            {cls.archived ? '보관 해제' : '학급 보관'}
          </button>
        </div>
      </header>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
      {notice && <p className="mt-3 text-sm text-emerald-300">{notice}</p>}

      <section className="mt-5 rounded-2xl bg-slate-800/70 border border-slate-700 p-4" aria-labelledby="code">
        <h2 id="code" className="text-lg font-semibold">학급코드</h2>
        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-3xl tracking-[0.3em] text-amber-300">{cls.code}</span>
          <button type="button" className="btn-icon" disabled={busy} onClick={() => void act(async () => { const c = await reissueClassCode(cls); setNotice(`새 학급코드: ${c}`); }, '학급코드를 다시 발급했습니다.')}>코드 재발급</button>
          <p className="text-xs text-slate-400">재발급해도 이미 가입한 학생은 그대로 로그인할 수 있습니다(로그인용 접두어 {cls.authPrefix} 는 바뀌지 않음).</p>
        </div>
      </section>

      <section className="mt-6" aria-labelledby="students">
        <h2 id="students" className="text-lg font-semibold">학생 ({members?.length ?? 0}명)</h2>
        {members === null ? <p className="text-sm text-slate-400 mt-2">불러오는 중…</p> : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm min-w-[46rem]">
              <thead className="text-left text-xs text-slate-400">
                <tr><th className="py-1">번호</th><th>이름</th><th>가입</th><th>최근 접속</th><th>상태</th><th className="text-right">관리</th></tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-slate-800">
                    <td className="py-1.5">{m.number}</td>
                    <td>{m.nickname ?? m.displayName}</td>
                    <td>{m.uid ? '✔ 가입' : m.resetPending ? '🔑 초기화 대기' : '⏳ 미가입'}</td>
                    <td>{when(m.lastSeenAt)}</td>
                    <td>{m.active ? '활성' : '비활성'}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" className="btn-icon text-xs mr-1" disabled={busy} onClick={() => { const n = prompt('새 이름', m.nickname ?? m.displayName); if (n) void act(() => renameStudent(m, n), '이름을 바꿨습니다.'); }}>이름</button>
                      <button type="button" className="btn-icon text-xs mr-1" disabled={busy} onClick={() => void act(() => resetStudentPassword(cls, m), `${m.number}번 학생이 새 비밀번호로 다시 가입할 수 있습니다.`)}>비번 초기화</button>
                      <button type="button" className="btn-icon text-xs mr-1" disabled={busy} onClick={() => void act(() => setStudentActive(m, !m.active), m.active ? '비활성화했습니다.' : '다시 활성화했습니다.')}>{m.active ? '비활성' : '활성'}</button>
                      {otherClasses.length > 0 && (
                        <select
                          className="rounded bg-slate-800 border border-slate-600 px-1 py-0.5 text-xs"
                          value=""
                          aria-label={`${m.number}번 학급 이동`}
                          onChange={(e) => { const to = e.target.value; if (to) void act(() => moveStudent(m, to, m.number), '학급을 옮겼습니다.'); }}
                        >
                          <option value="">이동…</option>
                          {otherClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => { e.preventDefault(); const n = Number(newNumber); if (!n || !newName.trim()) return; void act(() => preRegisterStudent(cls.id, n, newName), '명단에 추가했습니다. 학생이 그 번호로 가입하면 자리를 이어받습니다.'); setNewNumber(''); setNewName(''); }}
        >
          <label className="flex flex-col gap-1 text-xs">번호
            <input value={newNumber} onChange={(e) => setNewNumber(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" className="w-20 rounded-lg bg-slate-900 px-2 py-1 border border-slate-600" />
          </label>
          <label className="flex flex-col gap-1 text-xs">이름
            <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={30} className="rounded-lg bg-slate-900 px-2 py-1 border border-slate-600" />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">＋ 명단 미리 등록</button>
        </form>
      </section>

      <section className="mt-8" aria-labelledby="cls-sessions">
        <h2 id="cls-sessions" className="text-lg font-semibold">수업 세션 ({sessions.length})</h2>
        {sessions.length === 0 ? <p className="text-sm text-slate-400 mt-2">아직 세션이 없습니다.</p> : (
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-slate-400"><tr><th className="py-1">제목</th><th>연대</th><th>상태</th><th className="text-right">관리</th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-800">
                  <td className="py-1.5">{s.title}</td>
                  <td className="whitespace-nowrap">{formatYear(s.yearRange[0])} ~ {formatYear(s.yearRange[1])}</td>
                  <td>{s.status === 'open' ? '🟢 진행 중' : s.status === 'draft' ? '📝 초안' : '⚪ 종료'}</td>
                  <td className="text-right whitespace-nowrap">
                    <Link to={`/teacher/globe/${s.id}`} className="btn-icon text-xs mr-1">수업 열기</Link>
                    {s.status !== 'open' && <button type="button" className="btn-icon text-xs mr-1" disabled={busy} onClick={() => void act(() => setSessionStatus(s.id, 'open'), '학급에 배포했습니다(학생 화면에 보입니다).')}>배포</button>}
                    {s.status === 'open' && <button type="button" className="btn-icon text-xs mr-1" disabled={busy} onClick={() => void act(() => setSessionStatus(s.id, 'closed'), '세션을 종료했습니다.')}>종료</button>}
                    <button type="button" className="btn-icon text-xs" disabled={busy} onClick={() => { if (confirm(`"${s.title}" 세션을 삭제할까요? 학생 기록은 남지만 화면에서 사라집니다.`)) void act(() => deleteSession(s.id), '세션을 삭제했습니다.'); }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
