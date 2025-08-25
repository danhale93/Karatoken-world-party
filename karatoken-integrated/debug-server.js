const express = require('express');
const path = require('path');
const cors = require('cors');

console.log('Starting debug server...');

const app = express();
const PORT = 3100;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the web directory
app.use(express.static(path.join(__dirname, 'web')));

// Simple health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.json({
    status: 'ok',
    server: 'debug-server',
    timestamp: new Date().toISOString(),
    message: 'Debug server is running'
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Debug Server Running ===`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Web Interface: http://localhost:${PORT}/index.html`);
  console.log('==========================\n');
});

// Handle server errors
server.on('error', (error) => {
  console.error('\n=== Server Error ===');
  console.error(error);
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Please free the port or use a different one.`);
  }
  console.error('====================\n');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n=== Uncaught Exception ===');
  console.error(error);
  console.error('========================\n');  
  // Don't exit, let the server keep running
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n=== Unhandled Rejection ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('==========================\n');
});
