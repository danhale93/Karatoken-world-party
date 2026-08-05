import { File as BufferFile } from 'node:buffer';

// Save original working directory before any tests or imports run
const ORIGINAL_CWD = process.cwd();

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

beforeEach(() => {
  // Restore original working directory if altered by third-party packages (like whisper-node)
  if (process.cwd() !== ORIGINAL_CWD) {
    try {
      process.chdir(ORIGINAL_CWD);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to restore working directory:', err);
    }
  }
});

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
