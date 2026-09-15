import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 학교 크롬북·구형 태블릿 대응: 번들 최소화, 외부 API 호출 없음.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
  },
});
