import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 완전한 정적 사이트 빌드(HTML/CSS/JS/JSON). 서버 사이드 렌더링 사용 안 함.
export default defineConfig({
  plugins: [react()],
});
