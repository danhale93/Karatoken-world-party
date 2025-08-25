const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3100; // Changed from 3001 to 3100

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the web directory
app.use(express.static(path.join(__dirname, 'web')));

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.json({
    status: 'ok',
    server: 'simple-backend',
    timestamp: new Date().toISOString(),
    message: 'Server is running on port ' + PORT
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Health check: http://localhost:3100/health');
  console.log('Web interface: http://localhost:3100');
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});
