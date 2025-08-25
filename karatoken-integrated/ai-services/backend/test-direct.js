// Simple test to verify Node.js can run tests
console.log('Running basic test...');
console.log('1 + 1 =', 1 + 1);

// Verify we can import required modules
try {
  const express = require('express');
  console.log('Express version:', express.version);
  
  const jest = require('jest');
  console.log('Jest is available');
  
  const ts = require('typescript');
  console.log('TypeScript version:', ts.version);
  
  console.log('\n✅ Basic test passed!');
  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
