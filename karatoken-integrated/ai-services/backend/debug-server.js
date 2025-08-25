// Enable all debug logs
process.env.DEBUG = '*';
const debug = require('debug')('server');
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Set up paths
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

// Log environment and paths
debug('Starting server with environment:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('Project root:', PROJECT_ROOT);
console.log('Web directory:', WEB_DIR);

// Verify web directory exists
try {
  const exists = fs.existsSync(WEB_DIR);
  console.log('Web directory exists:', exists);
  
  if (exists) {
    console.log('Web directory contents:', fs.readdirSync(WEB_DIR));
  }
} catch (err) {
  console.error('Error checking web directory:', err);
  process.exit(1);
}

// Basic middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(WEB_DIR));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test page: http://localhost:${PORT}/test-server.html`);
});

// Handle errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});
