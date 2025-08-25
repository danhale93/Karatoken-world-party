const path = require('path');
const fs = require('fs');

// Test the web directory path
const PROJECT_ROOT = path.resolve(__dirname, '../../../karatoken-integrated');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

console.log('Project root:', PROJECT_ROOT);
console.log('Web directory:', WEB_DIR);
console.log('Directory exists:', fs.existsSync(WEB_DIR) ? 'Yes' : 'No');

// List files in the web directory if it exists
if (fs.existsSync(WEB_DIR)) {
  console.log('\nFiles in web directory:');
  fs.readdirSync(WEB_DIR).forEach(file => {
    console.log(`- ${file}`);
  });
}
