import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { APP_TITLE } from './config';
import { applyReduceMotion, loadReduceMotion } from './lib/prefs';

// 브라우저 탭 제목도 config.ts 의 APP_TITLE 을 따른다.
document.title = APP_TITLE;
applyReduceMotion(loadReduceMotion());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
