const { exec } = require('child_process');
const path = require('path');
const express = require('express');
const cors = require('cors');

// Configuration
const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Create test server
const app = express();
app.use(cors());
app.use(express.static(PUBLIC_DIR));

// Mock API endpoints for testing
app.post('/process', (req, res) => {
  const jobId = `test_${Date.now()}`;
  console.log(`[MOCK] Created job ${jobId}`);
  
  // Simulate processing delay
  setTimeout(() => {
    res.json({
      jobId,
      status: 'queued',
      progress: 0,
      server: 'test-server',
      estimatedTime: 2000
    });
  }, 500);
});

app.get('/status/:type/:jobId', (req, res) => {
  const { jobId } = req.params;
  const progress = Math.min(100, Math.floor(Math.random() * 30) + 10);
  
  console.log(`[MOCK] Status check for ${jobId} (${progress}%)`);
  
  if (progress >= 100) {
    res.json({
      jobId,
      status: 'completed',
      progress: 100,
      result: {
        audioUrl: '/test-audio.mp3',
        lrcUrl: '/test-lyrics.lrc',
        processingTime: '2.5s'
      }
    });
  } else {
    res.json({
      jobId,
      status: 'processing',
      progress,
      message: `Processing... ${progress}% complete`
    });
  }
});

// Start the test server
const server = app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Open this URL in your browser to test the UI');
  console.log('--------------------------------------------');
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('\nShutting down test server...');
  server.close();
  process.exit(0);
});
