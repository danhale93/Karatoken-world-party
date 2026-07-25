module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/__tests__/**/*',
    '!src/services/pitchDetection.ts',
    '!src/services/realtimeOptimization.ts',
    '!src/services/whisper.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/src/__tests__/services/pitchDetection.test.ts',
    '<rootDir>/src/__tests__/services/realtimeOptimization.test.ts',
    '<rootDir>/src/__tests__/services/whisper.test.ts'
  ],
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 30,
      functions: 30,
      lines: 30,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
