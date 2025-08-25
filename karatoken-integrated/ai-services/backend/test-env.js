// Test environment setup
console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
console.log('Environment variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  PATH:', process.env.PATH || 'not set');

// Simple test
console.log('\nRunning a simple test...');
try {
  const result = 1 + 1;
  console.log('1 + 1 =', result);
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed:', error);
}
