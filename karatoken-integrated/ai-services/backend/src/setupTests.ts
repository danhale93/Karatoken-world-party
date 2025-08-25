// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random port for tests

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
