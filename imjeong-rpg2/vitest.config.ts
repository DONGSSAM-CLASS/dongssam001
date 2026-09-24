import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 콘텐츠 무결성 테스트는 DOM 이 필요 없다 — node 환경이 훨씬 빠르다.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
});
