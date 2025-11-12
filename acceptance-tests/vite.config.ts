import { defineConfig } from 'vite';

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  test: {
    environment: 'node',
    include: ['./__tests__/**/*.test.ts'],
    exclude: ['./lib/**/*'],
    testTimeout: 60000,
    hookTimeout: 30000,
    fileParallelism: false,
    sequence: {
      concurrent: false, // Run files sequentially
    },
    globals: true,
    retry: 1,
  },
});
