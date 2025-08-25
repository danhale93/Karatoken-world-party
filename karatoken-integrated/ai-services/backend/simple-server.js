const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Set up paths
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

// Log paths for debugging
console.log('Project root:', PROJECT_ROOT);
console.log('Web directory:', WEB_DIR);
console.log('Directory exists:', fs.existsSync(WEB_DIR) ? 'Yes' : 'No');

// Serve static files
app.use(express.static(WEB_DIR));

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test page: http://localhost:${PORT}/test-server.html`);
});
