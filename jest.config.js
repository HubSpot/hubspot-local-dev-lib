module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  transform: {
    'node_modules/variables/.+\\.(j|t)sx?$': 'ts-jest',
  },
  setupFiles: ['./setupTests.ts'],
  transformIgnorePatterns: ['node_modules/(?!variables/.*)'],
  modulePathIgnorePatterns: ['<rootDir>/dist/', '/__utils__/'],
  clearMocks: true,
};
