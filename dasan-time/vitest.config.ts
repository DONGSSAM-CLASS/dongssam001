import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // 에뮬레이터 하나를 여러 파일이 같이 쓰기 때문에 순서대로 돌린다.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
