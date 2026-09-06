import { NavLink, Outlet } from 'react-router-dom';
import { COPYRIGHT_FOOTER } from '../constants';
import { useSettings } from '../settings/SettingsContext';
import SampleBanner from './SampleBanner';

const navItems = [
  { to: '/', label: '단원 탐색', end: true },
  { to: '/heatmap', label: '출제 빈도' },
  { to: '/search', label: '검색' },
  { to: '/records', label: '내 학습' },
  { to: '/report', label: '취약 단원' },
  { to: '/plan', label: 'D-day 플랜' },
];

export default function Layout() {
  const { middleMode, setMiddleMode } = useSettings();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="no-print">
        <SampleBanner />
      </div>
      <header className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <NavLink to="/" className="mr-2 flex flex-col leading-tight">
            <span className="text-base font-bold text-slate-900">한국사 수능 기출 단원 연동</span>
            <span className="text-[11px] text-slate-500">2022 개정 교육과정 연계</span>
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-md px-2.5 py-1.5 font-medium ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={middleMode}
                onChange={(e) => setMiddleMode(e.target.checked)}
                className="h-4 w-4 accent-emerald-600"
              />
              중학생 모드
            </label>
            <NavLink
              to="/teacher"
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-slate-800 text-white' : 'border text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              교사용
            </NavLink>
          </div>
        </div>
      </header>

      <main className="print-area mx-auto w-full max-w-6xl flex-1 px-4 py-4">
        <Outlet />
      </main>

      <footer className="no-print border-t bg-white px-4 py-3 text-center text-[11px] text-slate-500">
        {COPYRIGHT_FOOTER}
      </footer>
    </div>
  );
}
