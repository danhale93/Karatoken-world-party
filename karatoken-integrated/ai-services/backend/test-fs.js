const fs = require('fs');
const path = require('path');

// Test the web directory path
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

console.log('Project root:', PROJECT_ROOT);
console.log('Web directory:', WEB_DIR);

// Check if directory exists
try {
  const exists = fs.existsSync(WEB_DIR);
  console.log('Directory exists:', exists);
  
  if (exists) {
    console.log('Directory contents:');
    const files = fs.readdirSync(WEB_DIR);
    files.forEach(file => {
      console.log(`- ${file}`);
    });
  }
} catch (err) {
  console.error('Error accessing directory:', err.message);
}
