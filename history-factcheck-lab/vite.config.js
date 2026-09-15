import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 학교 크롬북·구형 태블릿 대응: 번들 최소화, 외부 API 호출 없음.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 케이스 데이터는 자주 고치는 부분이므로 코드와 분리해 캐시가 오래 살게 한다.
          if (id.includes('src/data/')) return 'case-data';
          if (id.includes('node_modules/react')) return 'react-vendor';
          return undefined;
        },
      },
    },
  },
});
