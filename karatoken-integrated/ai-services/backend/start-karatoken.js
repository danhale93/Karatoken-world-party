#!/usr/bin/env node

const express = require('express');
const path = require('path');
const { router: genreSwapRouter } = require('./aiGenreSwapApi');

// Create the main app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/ai/genre-swap', genreSwapRouter);

// Serve the main web interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Karatoken AI Genre Swapping',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🎤 Karatoken AI Genre Swapping Server');
  console.log('=====================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Web Interface: http://localhost:${PORT}`);
  console.log(`🔧 API Endpoints:`);
  console.log(`   - GET  /api/ai/genre-swap/genres`);
  console.log(`   - POST /api/ai/genre-swap`);
  console.log(`   - GET  /api/ai/genre-swap/status/:jobId`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('🎵 Ready to transform songs!');
  console.log('');
}); 