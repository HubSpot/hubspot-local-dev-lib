export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  collectCoverage: true,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
      useESM: true,
      isolatedModules: true
    }],
    'node_modules/variables/.+\\.(j|t)sx?$': ['ts-jest', { 
      useESM: true,
      isolatedModules: true
    }],
  },
  setupFiles: ['./setupTests.ts'],
  transformIgnorePatterns: ['node_modules/(?!(variables|prettier)/.*)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '/__utils__/'],
  clearMocks: true,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  // Handle potential issues with newer Node.js versions and hanging tests
  testTimeout: 15000,
  maxWorkers: 1,
  forceExit: true,
  detectOpenHandles: true,
};
