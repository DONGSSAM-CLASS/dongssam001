import { Link, NavLink, Outlet } from 'react-router-dom';

import TextSizeControls from './TextSizeControls.jsx';

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/cases/korea', label: '한국사' },
  { to: '/cases/world', label: '세계사' },
  { to: '/guide', label: '아카이브 사용법' },
  { to: '/teacher', label: '교사 모드' },
];

function navClass({ isActive }) {
  return [
    'rounded-sm px-3 py-1.5 text-sm font-bold transition-colors duration-150',
    isActive ? 'bg-kraft-light text-ink' : 'text-kraft-light/85 hover:bg-ink-soft',
  ].join(' ');
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="no-print border-b-4 border-ink-deep bg-ink text-kraft-light">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link to="/" className="mr-auto leading-tight">
            <span className="block text-lg font-bold tracking-tight">역사탐정 프로젝트</span>
            <span className="block text-xs text-kraft-light/70">
              역사 정보 검증 · 출처 기재 실습
            </span>
          </Link>
          <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <TextSizeControls />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="no-print border-t border-kraft-dark px-4 py-5 text-center text-sm text-ink-soft">
        <p>
          2022 개정 교육과정 중학교 「역사」 [9역01-01] · [9역01-02] 수업용 실습 자료. 학습 기록은
          이 기기(localStorage)에만 저장되며 외부로 전송되지 않습니다.
        </p>
        <p className="mt-2">
          <Link to="/credits" className="underline underline-offset-2">
            출처 고지 · 이용 안내
          </Link>
          <span className="mx-2">·</span>
          <Link to="/guide" className="underline underline-offset-2">
            아카이브 사용법
          </Link>
        </p>
      </footer>
    </div>
  );
}
