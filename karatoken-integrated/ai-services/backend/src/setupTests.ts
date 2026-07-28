import { File as BufferFile } from 'node:buffer';

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests

// Polyfill global File for Node.js < 20 (required by undici / @distube/ytdl-core in tests)
if (typeof globalThis.File === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { File } = require('node:buffer');
  globalThis.File = File;
}

// Mock any global dependencies if needed
// For example, you can mock console methods to keep test output clean
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Suppress expected error/warning messages during tests
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
