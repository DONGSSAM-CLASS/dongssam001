import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { normalizeClassCode } from '@/lib/studentAuth';
import { useAuthStore } from '@/store/authStore';
import { dataset } from '@/data';

export default function LandingPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [code, setCode] = useState('');
  return (
    <main className="min-h-full flex flex-col items-center justify-center gap-8 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">🌏 History Globe</h1>
        <p className="mt-2 text-lg text-slate-300">히스토리 글로브 — 3D 지구본으로 떠나는 세계사 동시대 탐색</p>
        <p className="mt-1 text-sm text-slate-400">2022 개정 교육과정 · 역사(중학교) / 세계사 / 동아시아 역사 기행</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 w-full max-w-2xl" aria-label="시작하기">
        <div className="rounded-2xl bg-slate-800/70 p-6 border border-slate-700">
          <h2 className="text-xl font-semibold">👩‍🏫 교사</h2>
          <p className="mt-2 text-sm text-slate-300">이메일 또는 Google 계정으로 로그인하고 학급을 개설합니다.</p>
          <Link
            to={profile?.role === 'teacher' ? '/teacher' : '/teacher/login'}
            className="mt-4 block w-full rounded-xl bg-amber-400 px-4 py-3 text-center font-bold text-slate-900"
          >
            {profile?.role === 'teacher' ? '내 대시보드로' : '교사 로그인 / 가입'}
          </Link>
        </div>
        <div className="rounded-2xl bg-slate-800/70 p-6 border border-slate-700">
          <h2 className="text-xl font-semibold">🧑‍🎓 학생</h2>
          <p className="mt-2 text-sm text-slate-300">선생님께 받은 6자리 학급코드와 번호로 들어옵니다.</p>
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); navigate(`/join?code=${code}`); }}>
            <label className="sr-only" htmlFor="classCode">학급코드</label>
            <input
              id="classCode"
              className="flex-1 rounded-xl bg-slate-900 px-4 py-3 uppercase tracking-widest border border-slate-600"
              placeholder="학급코드 6자리"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(normalizeClassCode(e.target.value))}
              autoComplete="off"
            />
            <button type="submit" disabled={code.length !== 6} className="rounded-xl bg-sky-500 text-slate-900 px-4 py-3 font-bold disabled:opacity-50">
              입장
            </button>
          </form>
          {profile?.role === 'student' && <p className="mt-2 text-xs"><Link className="underline" to="/student">이미 로그인됨 → 내 학급으로</Link></p>}
        </div>
      </section>

      <footer className="text-xs text-slate-400 text-center">
        <p>
          기본 데이터: 왕조 {dataset.polities.length} · 인물 {dataset.figures.length} · 장소 {dataset.places.length} · 사건{' '}
          {dataset.events.length} · 성취기준 {dataset.achievement_standards.length}
        </p>
        <p className="mt-1">
          <Link className="underline" to="/globe">지구본 바로 탐색하기</Link> · <Link className="underline" to="/dev/status">개발 상태 보기</Link>
        </p>
      </footer>
    </main>
  );
}
