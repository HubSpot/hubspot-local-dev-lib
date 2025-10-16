import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
      },
      globals: {
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        URLSearchParams: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-console': 'off',
      'no-return-await': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-default-export': 'error',
      'no-redeclare': 'off', // Allow function overloads
      '@typescript-eslint/no-redeclare': 'off', // Allow function overloads
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/__mocks__/**/*.ts'],
    languageOptions: {
      globals: {
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        MockedFunction: 'readonly',
      },
    },
  },
  {
    files: ['acceptance-tests/tests/**/*.ts'],
    languageOptions: {
      globals: {
        jasmine: 'readonly',
      },
    },
  },
  {
    files: ['*.config.*', 'setupTests.ts'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
];
