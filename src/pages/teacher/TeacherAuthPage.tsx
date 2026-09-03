import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { createTeacherProfile, friendlyError, teacherGoogleSignIn, teacherSignIn, teacherSignUp } from '@/lib/authService';
import { useAuthStore } from '@/store/authStore';
import type { SchoolLevel } from '@/types/firestore';
import type { Subject } from '@/types/history';

const SUBJECTS: Subject[] = ['역사①', '세계사', '동아시아 역사 기행'];

/** 교사 가입·로그인 (이메일/비밀번호 또는 Google). Google 로 처음 들어오면 학교 정보를 이어서 받는다. */
export default function TeacherAuthPage() {
  const navigate = useNavigate();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('중학교');
  const [schoolName, setSchoolName] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>(['역사①']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile?.role === 'teacher') return <Navigate to="/teacher" replace />;
  if (profile?.role === 'student') return <Navigate to="/student" replace />;

  // Google 로 로그인했지만 아직 프로필이 없는 상태 → 학교 정보만 받아 프로필 생성
  const needsProfile = status === 'ready' && user && !profile;

  const toggleSubject = (s: Subject) => setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (needsProfile) {
        await createTeacherProfile(user, { displayName, schoolLevel, schoolName, subjects });
        window.location.assign('/teacher');
        return;
      }
      if (mode === 'login') await teacherSignIn(email, password);
      else await teacherSignUp({ email, password, displayName, schoolLevel, schoolName, subjects });
      navigate('/teacher', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      await teacherGoogleSignIn();
      if (useAuthStore.getState().profile) navigate('/teacher', { replace: true });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const showProfileFields = mode === 'signup' || needsProfile;

  return (
    <main className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-slate-800/80 border border-slate-700 p-6">
        <h1 className="text-2xl font-bold">👩‍🏫 교사 {needsProfile ? '정보 입력' : '로그인'}</h1>
        {needsProfile ? (
          <p className="mt-1 text-sm text-slate-300">처음이시군요. 학교 정보를 입력하면 학급을 만들 수 있습니다.</p>
        ) : (
          <div role="tablist" className="mt-4 flex rounded-xl overflow-hidden border border-slate-600 text-sm">
            <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => setMode('login')} className={`flex-1 py-2 ${mode === 'login' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-900'}`}>로그인</button>
            <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => setMode('signup')} className={`flex-1 py-2 ${mode === 'signup' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-900'}`}>가입</button>
          </div>
        )}

        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          {!needsProfile && (
            <>
              <label className="flex flex-col gap-1 text-sm">이메일
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" />
              </label>
              <label className="flex flex-col gap-1 text-sm">비밀번호
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" />
              </label>
            </>
          )}
          {showProfileFields && (
            <>
              <label className="flex flex-col gap-1 text-sm">이름
                <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30} className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" placeholder="예: 김역사" />
              </label>
              <fieldset className="flex gap-3 text-sm">
                <legend className="sr-only">학교급</legend>
                {(['중학교', '고등학교'] as SchoolLevel[]).map((lv) => (
                  <label key={lv} className="flex items-center gap-1">
                    <input type="radio" name="level" checked={schoolLevel === lv} onChange={() => setSchoolLevel(lv)} className="accent-amber-400" />
                    {lv}
                  </label>
                ))}
              </fieldset>
              <label className="flex flex-col gap-1 text-sm">학교명
                <input required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} maxLength={40} className="rounded-xl bg-slate-900 px-4 py-2 border border-slate-600" placeholder="예: 히스토리중학교" />
              </label>
              <fieldset className="text-sm">
                <legend className="mb-1">담당 과목 (복수 선택)</legend>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => (
                    <label key={s} className={`rounded-lg px-2 py-1 border cursor-pointer ${subjects.includes(s) ? 'bg-amber-400 text-slate-900 border-amber-300 font-semibold' : 'bg-slate-900 border-slate-600'}`}>
                      <input type="checkbox" className="sr-only" checked={subjects.includes(s)} onChange={() => toggleSubject(s)} />
                      {s}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
          {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-900 disabled:opacity-50">
            {busy ? '잠시만요…' : needsProfile ? '시작하기' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>

        {!needsProfile && (
          <button type="button" onClick={() => void google()} disabled={busy} className="mt-3 w-full rounded-xl bg-white px-4 py-3 font-bold text-slate-800 disabled:opacity-50">
            Google 계정으로 계속하기
          </button>
        )}
        <p className="mt-4 text-xs"><Link className="underline" to="/">← 처음으로</Link></p>
      </div>
    </main>
  );
}
