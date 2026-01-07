import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment - use node for library tests
    environment: 'node',

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        'coverage/**',
        '*.config.*',
        '*.d.ts',
      ],
    },

    // Test timeout
    testTimeout: 15000,

    // Clear mocks between tests
    clearMocks: true,

    // Include patterns
    include: [
      '**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**',
      '.github/**',
      'coverage/**',
    ],

    // Global test configuration
    globals: true,

    // Test isolation
    isolate: true,
  },
});
