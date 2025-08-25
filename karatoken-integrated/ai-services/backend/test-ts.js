// Simple test script to verify TypeScript setup
console.log('TypeScript setup test:');
console.log('- Node.js version:', process.version);
console.log('- Current directory:', process.cwd());

// Try to import TypeScript
let ts;
try {
  ts = require('typescript');
  console.log('- TypeScript version:', ts.version);
} catch (e) {
  console.error('- TypeScript not found! Please install typescript as a dev dependency.');
  process.exit(1);
}

// Try to import Jest
let jest;
try {
  jest = require('jest');
  console.log('- Jest is available');
} catch (e) {
  console.error('- Jest not found! Please install jest as a dev dependency.');
  process.exit(1);
}

console.log('\nBasic imports test:');
const fs = require('fs');
const path = require('path');

// Check if we can access files
const testFile = path.join(__dirname, 'src', 'index.ts');
try {
  const exists = fs.existsSync(testFile);
  console.log(`- Can access ${testFile}:`, exists ? 'Yes' : 'No');
  
  if (exists) {
    const content = fs.readFileSync(testFile, 'utf8');
    console.log(`- File content length: ${content.length} characters`);
  }
} catch (e) {
  console.error('- Error accessing test file:', e.message);
  process.exit(1);
}

console.log('\nTest completed successfully!');
