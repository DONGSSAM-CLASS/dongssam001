import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { signOutAll } from '@/lib/authService';
import { createClass } from '@/lib/classService';
import { listTeacherSessions } from '@/lib/sessionService';
import { formatYear } from '@/lib/history';
import { useAuthStore } from '@/store/authStore';
import type { ClassDoc, SchoolLevel, SessionDoc } from '@/types/firestore';
import type { Subject } from '@/types/history';

type ClassRow = ClassDoc & { id: string };
type SessionRow = SessionDoc & { id: string };

const SUBJECTS: Subject[] = ['역사①', '세계사', '동아시아 역사 기행'];

/** 교사 대시보드: 학급 목록 · 최근 세션 · 학급 개설 */
export default function TeacherDashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<SchoolLevel>('중학교');
  const [subject, setSubject] = useState<Subject>('역사①');
  const [busy, setBusy] = useState(false);
  // 교사 프로필이 도착하면 학급 개설 기본값을 한 번 맞춘다 (렌더 중 파생 상태 갱신 패턴)
  const [syncedUid, setSyncedUid] = useState<string | null>(null);
  if (profile?.role === 'teacher' && syncedUid !== profile.uid) {
    setSyncedUid(profile.uid);
    setLevel(profile.schoolLevel);
    if (profile.subjects?.length) setSubject(profile.subjects[0]);
  }

  const uid = profile?.uid;
  // reloadToken 을 올리면 목록을 다시 읽는다 (효과 안에서 동기 setState 를 피하는 패턴)
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void (async () => {
      try {
        const [cs, ss] = await Promise.all([
          getDocs(query(collection(db, 'classes'), where('teacherId', '==', uid))),
          listTeacherSessions(uid),
        ]);
        if (!alive) return;
        setClasses(cs.docs.map((d) => ({ id: d.id, ...(d.data() as ClassDoc) })));
        setSessions(ss.slice(0, 6));
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    })();
    return () => {
      alive = false;
    };
  }, [uid, reloadToken]);


  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!uid || !name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createClass(uid, { name, schoolLevel: level, subject });
      setName('');
      reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!profile || profile.role !== 'teacher') return null;
  const visible = (classes ?? []).filter((c) => showArchived || !c.archived);
  const classNameOf = (id: string) => classes?.find((c) => c.id === id)?.name ?? '(삭제된 학급)';

  return (
    <main className="min-h-full p-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">👩‍🏫 {profile.displayName} 선생님</h1>
        <span className="text-sm text-slate-400">{profile.schoolName} · {profile.schoolLevel} · {profile.subjects?.join(', ')}</span>
        <div className="ml-auto flex gap-2 text-sm">
          <Link to="/teacher/design" className="rounded-lg bg-amber-400 text-slate-900 px-3 py-1.5 font-bold">✏️ 수업 설계</Link>
          <Link to="/globe" className="btn-icon">🌏 지구본</Link>
          {isAdmin && <Link to="/admin/data" className="btn-icon">🛠 데이터 검수</Link>}
          <button type="button" className="btn-icon" onClick={() => void signOutAll()}>로그아웃</button>
        </div>
      </header>
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

      <section className="mt-6" aria-labelledby="classes">
        <div className="flex items-center gap-2">
          <h2 id="classes" className="text-lg font-semibold">학급</h2>
          <label className="ml-auto flex items-center gap-1 text-xs text-slate-400">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-amber-400" />
            보관한 학급도 보기
          </label>
        </div>
        {classes === null ? <p className="text-sm text-slate-400 mt-2">불러오는 중…</p> : visible.length === 0 ? (
          <p className="text-sm text-slate-400 mt-2">아직 학급이 없습니다. 아래에서 학급을 만들어 주세요.</p>
        ) : (
          <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <li key={c.id} className={`rounded-2xl border p-4 ${c.archived ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-800/70 border-slate-700'}`}>
                <h3 className="font-bold">{c.name} {c.archived && <span className="text-xs text-slate-500">(보관됨)</span>}</h3>
                <p className="text-xs text-slate-400 mt-1">{c.schoolLevel} · {c.subject}</p>
                <p className="mt-2 text-sm">학급코드 <span className="font-mono text-lg tracking-widest text-amber-300">{c.code}</span></p>
                <Link to={`/teacher/classes/${c.id}`} className="mt-3 inline-block rounded-xl bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600">학급 관리 →</Link>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-2 rounded-2xl bg-slate-800/50 border border-slate-700 p-3">
          <label className="flex flex-col gap-1 text-sm">학급 이름
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} placeholder="예: 2학년 3반" className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600" />
          </label>
          <label className="flex flex-col gap-1 text-sm">학교급
            <select value={level} onChange={(e) => setLevel(e.target.value as SchoolLevel)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600">
              <option>중학교</option><option>고등학교</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">과목
            <select value={subject} onChange={(e) => setSubject(e.target.value as Subject)} className="rounded-xl bg-slate-900 px-3 py-2 border border-slate-600">
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <button type="submit" disabled={busy} className="rounded-xl bg-sky-500 px-4 py-2 font-bold disabled:opacity-50">＋ 학급 만들기</button>
        </form>
      </section>

      <section className="mt-8" aria-labelledby="sessions">
        <h2 id="sessions" className="text-lg font-semibold">최근 수업 세션</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400 mt-2">아직 만든 세션이 없습니다. <Link to="/teacher/design" className="underline">수업 설계</Link>에서 만들어 보세요.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-slate-400"><tr><th className="py-1">제목</th><th>학급</th><th>연대</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t border-slate-800">
                  <td className="py-1.5">{s.title}</td>
                  <td>{classNameOf(s.classId)}</td>
                  <td className="whitespace-nowrap">{formatYear(s.yearRange[0])} ~ {formatYear(s.yearRange[1])}</td>
                  <td>{s.status === 'open' ? '🟢 진행 중' : s.status === 'draft' ? '📝 초안' : '⚪ 종료'}</td>
                  <td className="text-right"><Link to={`/teacher/globe/${s.id}`} className="underline">수업 열기</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
