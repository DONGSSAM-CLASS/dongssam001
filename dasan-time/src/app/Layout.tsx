import { Link, Outlet, useNavigate } from 'react-router-dom';
import { House, LogOut, TriangleAlert } from 'lucide-react';
import { useAuth } from './AuthContext';
import { logOut } from '../lib/authService';
import { clearTrialData } from '../lib/localDb';
import { APP, UI_TEXT } from '../content/lessons';

/** 학생·체험 화면의 바깥 틀 (휴대폰·태블릿 우선) */
export default function Layout() {
  const { mode, endTrial, student } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      {mode === 'trial' && (
        <div
          className="no-print sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 bg-warning px-4 py-2 text-sm font-semibold text-warning-content"
          role="status"
        >
          <span className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
            {UI_TEXT.trialBanner}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs rounded-2xl"
            onClick={() => {
              clearTrialData();
              endTrial();
              navigate('/');
            }}
          >
            {UI_TEXT.trialClear}
          </button>
        </div>
      )}

      <header className="no-print navbar min-h-14 bg-base-100 px-3 shadow-sm">
        <div className="flex-1">
          <Link to={mode === 'trial' ? '/trial' : '/student'} className="btn btn-ghost gap-2 rounded-2xl px-2">
            <House className="h-5 w-5 text-primary" aria-hidden />
            <span className="text-base font-extrabold">{APP.name}</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {student && <span className="hidden text-sm opacity-70 sm:inline">{student.name}님</span>}
          {mode === 'student' && (
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1 rounded-2xl"
              aria-label="로그아웃"
              onClick={async () => {
                await logOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              나가기
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl grow px-3 py-5 sm:px-4">
        <Outlet />
      </main>

      <footer className="no-print px-4 py-6 text-center text-xs opacity-60">
        {APP.name} · {APP.subtitle}
      </footer>
    </div>
  );
}
