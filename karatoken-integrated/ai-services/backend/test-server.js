const express = require('express');
const path = require('path');
const app = express();

const PORT = 3000;
const WEB_DIR = path.resolve(__dirname, '../../../karatoken-integrated/web');

// Log the web directory path
console.log('Web directory path:', WEB_DIR);
console.log('Directory exists:', require('fs').existsSync(WEB_DIR) ? 'Yes' : 'No');

// Serve static files
app.use(express.static(WEB_DIR));

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test endpoint is working' });
});

// Fallback to serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Serving files from: ${WEB_DIR}`);
});
