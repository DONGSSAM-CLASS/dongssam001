import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Info, Sparkles } from 'lucide-react';
import { APP_TITLE, FICTION_NOTICE } from '../config';
import { applyReduceMotion, loadReduceMotion } from '../lib/prefs';

/** 움직임 효과 스위치 (애니메이션 끄기) */
export function MotionToggle() {
  const [off, setOff] = useState(loadReduceMotion);
  useEffect(() => applyReduceMotion(off), [off]);
  return (
    <label className="no-print flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-base-100/80 px-3 text-[15px]">
      <Sparkles className="h-4 w-4 text-ink-soft" aria-hidden="true" />
      <span>움직임</span>
      <input
        type="checkbox"
        role="switch"
        className="toggle toggle-sm toggle-primary"
        checked={!off}
        onChange={(e) => setOff(!e.target.checked)}
        aria-label="움직임 효과"
      />
    </label>
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
      <header className="no-print sticky top-0 z-20 border-b border-base-300 bg-base-100/90 backdrop-blur">
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-2 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
          <Link to="/" className="flex items-center gap-2 text-[17px] font-extrabold text-ink">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-secondary-content">
              <Eye className="h-5 w-5" aria-hidden="true" />
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
    <p className="mt-8 flex items-start justify-center gap-1.5 border-t border-dashed border-base-300 pt-3 text-center text-[15px] text-ink-soft">
      <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
      {FICTION_NOTICE}
    </p>
  );
}
