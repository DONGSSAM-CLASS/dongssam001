import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { signOutAll } from '@/lib/authService';
import { useAuthStore } from '@/store/authStore';
import type { SessionDoc } from '@/types/firestore';
import { formatYear } from '@/lib/history';

type SessionRow = SessionDoc & { id: string };

/** 학생 홈: 소속 학급의 공개 세션 목록 → 지구본 입장 */
export default function StudentHomePage() {
  const profile = useAuthStore((s) => s.profile);
  const classDoc = useAuthStore((s) => s.classDoc);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'student') return;
    // 규칙: 학생은 classId == 내 학급 && status in [open, closed] 인 세션만 조회 가능
    getDocs(query(collection(db, 'sessions'), where('classId', '==', profile.classId), where('status', 'in', ['open', 'closed']), orderBy('updatedAt', 'desc')))
      .then((snap) => setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as SessionDoc) }))))
      .catch((e) => setError((e as Error).message));
  }, [profile]);

  if (!profile || profile.role !== 'student') return null;
  return (
    <main className="min-h-full p-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">🌏 {profile.nickname ?? profile.displayName} 님의 탐험</h1>
        <span className="text-sm text-slate-400">{classDoc?.name ?? '학급'} · {profile.number}번</span>
        <div className="ml-auto flex gap-2 text-sm">
          <Link to="/student/records" className="btn-icon">📒 내 기록</Link>
          <button type="button" className="btn-icon" onClick={() => void signOutAll()}>로그아웃</button>
        </div>
      </header>

      <section className="mt-6" aria-labelledby="sessions">
        <h2 id="sessions" className="text-lg font-semibold">수업 세션</h2>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {sessions === null ? <p className="text-slate-400 text-sm mt-2">불러오는 중…</p> : sessions.length === 0 ? (
          <p className="text-slate-400 text-sm mt-2">아직 공개된 수업 세션이 없습니다. 선생님이 세션을 열면 여기에 나타납니다.</p>
        ) : (
          <ul className="mt-2 grid gap-3 sm:grid-cols-2">
            {sessions.map((s) => (
              <li key={s.id} className="rounded-2xl bg-slate-800/70 border border-slate-700 p-4">
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{formatYear(s.yearRange[0])} ~ {formatYear(s.yearRange[1])} · {s.status === 'open' ? '🟢 진행 중' : '⚪ 종료(읽기 전용)'}</p>
                <Link to={`/student/globe/${s.id}`} className="mt-3 inline-block rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900">지구본 열기</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-semibold">자유 탐색</h2>
        <p className="text-sm text-slate-400">수업과 상관없이 지구본을 돌려 볼 수 있어요. 여기서 찍은 핀은 이 기기에만 저장됩니다.</p>
        <Link to="/globe" className="mt-2 inline-block rounded-xl bg-sky-500 text-slate-900 px-4 py-2 text-sm font-bold">자유 탐색 열기</Link>
      </section>
    </main>
  );
}
