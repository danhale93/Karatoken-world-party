module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/index.ts'],
  coverageThreshold: {
    global: {
      statements: 30,
      branches: 20,
      functions: 40,
      lines: 30,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
