require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve the web preview static assets
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

// Verify web directory exists
if (!fs.existsSync(WEB_DIR)) {
  console.error(`ERROR: Web directory not found at: ${WEB_DIR}`);
  process.exit(1);
}

console.log('Serving static web from:', WEB_DIR);
app.use(express.static(WEB_DIR));

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'karatoken-backend',
    timestamp: new Date().toISOString()
  });
});

// Fallback to serve index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Web directory: ${WEB_DIR}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
