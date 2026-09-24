import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // Firebase Hosting 의 하위 경로(/imjeong-rpg/)에 올려도 동작하도록 상대 경로로 빌드한다.
  base: './',
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // 저사양 크롬북에서 첫 화면이 빨리 뜨도록 three.js 를 별도 청크로 뺀다.
        manualChunks: { three: ['three'], react: ['react', 'react-dom'] },
      },
    },
  },
  server: { port: 5184, host: true },
});
