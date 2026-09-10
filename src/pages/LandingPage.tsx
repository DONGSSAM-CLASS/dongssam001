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

      <Link
        to={profile?.role === 'student' ? '/game' : '/join'}
        className="group relative w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#241a0f] to-[#0f0b06] p-6 shadow-xl transition hover:border-amber-400"
      >
        <span className="absolute right-5 top-5 text-4xl opacity-25 transition group-hover:opacity-50">🎖️</span>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/90">한국광복군 창설 기념 · 역사 추리 시뮬레이션</p>
        <h2 className="mt-1 text-2xl font-bold text-amber-200">『아직 오지 않은 광복』</h2>
        <p className="mt-0.5 text-sm text-amber-100/70">1940년 9월, 그들이 걸었던 선택 · 실제 사료로 추리하는 15~20분</p>
        <span className="mt-3 inline-block rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900">
          {profile?.role === 'student' ? '게임 시작 / 이어하기 →' : '학급코드로 입장해 시작하기 →'}
        </span>
      </Link>

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
        <p className="mt-3 text-[11px] text-slate-500">제작 · 동쌤(김동은 선생님)</p>
      </footer>
    </main>
  );
}
