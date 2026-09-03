import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    projects: [
      {
        // 순수 로직 단위 테스트 (데이터 필터링, 거리 계산 등)
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        // Firestore Security Rules 테스트 — Firestore 에뮬레이터가 필요 (npm run test:rules)
        extends: true,
        test: {
          name: 'rules',
          include: ['tests/rules/**/*.test.ts'],
          environment: 'node',
          testTimeout: 30_000,
          hookTimeout: 60_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
