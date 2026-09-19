import { useEffect, useState } from 'react';
import { Intro } from './ui/Intro';
import GameScreen from './GameScreen';
import { useGame } from './store/gameStore';
import { loadSave } from './engine/save';

export default function App() {
  const started = useGame((s) => s.started);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    setHasSave(loadSave() !== null);
  }, []);

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
