import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

// CDN 실패 대비 로컬 번들 폰트 (Noto Sans KR).
// 저대역폭 대응: 통합 서브셋(korean-400.woff2 한 덩어리 850KB) 대신 분할 서브셋을 쓴다.
// 분할 서브셋은 unicode-range별로 40KB 안팎의 조각만 실제 사용 글자에 맞춰 내려받는다.
// 굵기도 본문(400)과 강조(700) 두 가지로 제한한다.
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/700.css';

import App from './App.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
