import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Intro } from './ui/Intro';
import GameScreen from './GameScreen';
import { useGame } from './store/gameStore';
import { loadSave } from './engine/save';

/**
 * 인물 전시장 — 주소 끝에 `?lineup` 을 붙이면 열리는 검수용 화면.
 * 옷의 고증이 맞는지 크게 보고 확인한다. 수업에서 쓰는 화면이 아니다.
 */
function Lineup() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let dispose: (() => void) | undefined;
    import('./dev/LineupScene').then((m) => {
      dispose = m.mountLineup(el);
    });
    return () => dispose?.();
  }, []);
  return <div className="world-layer" ref={ref} style={{ position: 'fixed', inset: 0 }} />;
}

const PortraitGallery = lazy(() => import('./dev/PortraitGallery'));

export default function App() {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const isLineup = search.includes('lineup');
  const isGallery = search.includes('portraits');
  const started = useGame((s) => s.started);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(loadSave() !== null);
  }, []);

  if (isLineup) return <Lineup />;
  if (isGallery) {
    return (
      <Suspense fallback={<div className="gallery" />}>
        <PortraitGallery />
      </Suspense>
    );
  }

  if (!started) {
    return (
      <Intro
        hasSave={hasSave}
        onStart={(level) => useGame.getState().start(level)}
        onContinue={() => useGame.getState().hydrate()}
      />
    );
  }
  return <GameScreen />;
}
