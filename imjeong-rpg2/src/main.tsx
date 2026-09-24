import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useGame } from './store/gameStore';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root 를 찾을 수 없습니다.');

// 개발 중에만 — 자동 화면 검사(Playwright)에서 상태를 들여다보기 위한 창구. 배포 빌드에는 들어가지 않는다.
if (import.meta.env.DEV) (window as unknown as { __game: typeof useGame }).__game = useGame;

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
