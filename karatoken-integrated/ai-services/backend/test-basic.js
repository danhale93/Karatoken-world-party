const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Simple test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/health`);
});
