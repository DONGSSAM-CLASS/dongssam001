import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    // pdf·charts 청크는 첫 화면에 실리지 않고 필요한 순간에만 내려받는다.
    // 그래서 기본 경고선(500kB)을 넘겨도 학생 화면의 첫 로딩에는 영향이 없다.
    chunkSizeWarningLimit: 800,
    // 큰 라이브러리(jspdf/html2canvas-pro/recharts)는 처음 화면에서 필요하지 않다.
    // 청크를 나눠 두어야 학교 네트워크에서 첫 화면이 빨리 뜬다.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts'],
          pdf: ['jspdf', 'html2canvas-pro', 'jszip'],
        },
      },
    },
  },
});
