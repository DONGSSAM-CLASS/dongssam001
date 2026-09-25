import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Pretendard 글꼴 — 필요한 글자 조각만 내려받는 방식(dynamic subset)으로, 앱과 함께 배포된다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
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
