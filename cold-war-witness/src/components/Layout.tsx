import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { APP_TITLE, FICTION_NOTICE } from '../config';
import { applyReduceMotion, loadReduceMotion } from '../lib/prefs';

/** 애니메이션 끄기 스위치 */
export function MotionToggle() {
  const [off, setOff] = useState(loadReduceMotion);
  useEffect(() => applyReduceMotion(off), [off]);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!off}
      aria-label="움직임 효과"
      onClick={() => setOff((v) => !v)}
      className="no-print min-h-10 rounded-md border border-line bg-white/70 px-3 text-[15px] hover:bg-white"
    >
      움직임 효과 {off ? '끔' : '켬'}
    </button>
  );
}

export function Layout({
  children,
  right,
  wide = false,
  chapterTheme,
}: {
  children: ReactNode;
  right?: ReactNode;
  wide?: boolean;
  chapterTheme?: 'berlin' | 'newyork' | 'florida';
}) {
  return (
    <div data-chapter={chapterTheme} className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-2">
        본문으로 건너뛰기
      </a>
      <header className="no-print border-b border-line bg-paper-dark/80">
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
          <Link to="/" className="typewriter text-[16px] font-bold text-ink">
            <span className="text-stamp" aria-hidden="true">
              ■{' '}
            </span>
            {APP_TITLE.split(' — ')[0]}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {right}
            <MotionToggle />
          </div>
        </div>
      </header>
      <main id="main" className={`mx-auto w-full flex-1 px-4 py-6 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
        {children}
      </main>
    </div>
  );
}

/** 챕터 화면 하단에 항상 붙는 가상 인물 안내 */
export function FictionNotice() {
  return (
    <p className="mt-8 border-t border-dashed border-line pt-3 text-center text-[15px] text-ink-soft">
      ※ {FICTION_NOTICE}
    </p>
  );
}
