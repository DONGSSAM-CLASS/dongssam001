import { lazy, Suspense, useEffect, useState } from 'react';
import { Intro } from './ui/Intro';
import GameScreen from './GameScreen';
import { useGame } from './store/gameStore';
import { loadSave } from './engine/save';
import type { MapId } from './types';

/**
 * 장소 검수 화면 — 주소 끝에 `?preview=assembly` 를 붙이면 열린다 (수업용이 아니다).
 * 1탄의 `?lineup` 과 같은 역할이다.
 */
const MapPreview = lazy(() => import('./dev/MapPreview'));
/** 교사용 화면 — `?teacher` (정답표·학급 진행 현황) */
const TeacherPage = lazy(() => import('./dev/TeacherPage'));

export default function App() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const preview = params.get('preview') as MapId | null;
  const started = useGame((s) => s.started);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(loadSave() !== null);
  }, []);

  if (params.has('teacher')) {
    return (
      <Suspense fallback={null}>
        <TeacherPage />
      </Suspense>
    );
  }

  if (preview) {
    return (
      <Suspense fallback={null}>
        <MapPreview initial={preview} />
      </Suspense>
    );
  }

  if (!started) {
    return (
      <Intro
        hasSave={hasSave}
        onStart={(level, nickname, played) => useGame.getState().start(level, nickname, played)}
        onContinue={() => useGame.getState().hydrate()}
        onRestore={(code, nickname) => useGame.getState().restoreFromCode(code, nickname)}
      />
    );
  }
  return <GameScreen />;
}
