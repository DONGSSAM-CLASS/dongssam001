import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // 보안 규칙 테스트(Phase 5)는 에뮬레이터 하나를 같이 쓰므로 순서대로 돌린다.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
