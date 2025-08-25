const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');

console.log('Starting integrated Karatoken server...');

const app = express();
const PORT = 3100;

// Create HTTP server for Socket.IO
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from public directory (priority) and web directory (fallback)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'web')));

// Ensure tmp directory exists for file operations
const TMP_DIR = path.join(__dirname, 'tmp');
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Serve tmp files for downloads
app.use('/tmp', express.static(TMP_DIR));

// Job management
const jobs = new Map();
const MAX_COMPLETED_JOBS = 50; // Keep last 50 completed/failed jobs
let jobCounter = 0;

// Job history (completed/failed jobs)
const jobHistory = [];

// Utility functions
function createJobId() {
  return `job_${Date.now()}_${++jobCounter}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Job status enum
const JobStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Broadcast job updates to all connected clients
function broadcastJobUpdate(jobId, job) {
  // Update job in the map
  jobs.set(jobId, job);
  
  // If job is completed or failed, move to history
  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
    // Add timestamp if not exists
    if (!job.completedAt) {
      job.completedAt = new Date().toISOString();
    }
    
    // Add to history and maintain size limit
    jobHistory.unshift({...job});
    if (jobHistory.length > MAX_COMPLETED_JOBS) {
      jobHistory.pop();
    }
    
    // Remove from active jobs after a delay
    setTimeout(() => {
      jobs.delete(jobId);
    }, 300000); // Keep in active jobs for 5 minutes after completion
  }
  
  // Broadcast update to all connected clients
  io.emit('jobUpdate', { jobId, job });
  console.log(`[${jobId}] Status updated to ${job.status}`);
}

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check called');
  res.json({
    status: 'ok',
    server: 'integrated-karatoken-server',
    timestamp: new Date().toISOString(),
    message: 'Integrated server is running',
    features: ['genre-swap', 'stylus-transfer', 'youtube-integration', 'job-management']
  });
});

// YouTube API endpoints
app.get('/api/youtube/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ ok: false, error: 'Missing search query' });
  }

  try {
    // Mock YouTube search results for now
    // In production, you would integrate with YouTube API or ytsr
    const mockResults = [
      {
        id: { videoId: 'dQw4w9WgXcQ' },
        snippet: {
          title: `${query} - Official Music Video`,
          channelTitle: 'Artist Channel',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180?text=Video+1' }
          }
        }
      },
      {
        id: { videoId: 'abc123def456' },
        snippet: {
          title: `${query} (Live Performance)`,
          channelTitle: 'Live Music Channel',
          thumbnails: {
            medium: { url: 'https://via.placeholder.com/320x180?text=Video+2' }
          }
        }
      }
    ];

    res.json({
      ok: true,
      items: mockResults.map(video => ({
        id: video.id.videoId,
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.medium.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        duration: 180 // Mock duration in seconds
      }))
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post('/api/youtube/download', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ ok: false, error: 'Missing YouTube URL' });
  }

  try {
    // Mock YouTube download - in production, use ytdl-core
    const filename = `youtube_audio_${Date.now()}.mp3`;
    const filepath = path.join(TMP_DIR, filename);
    
    // Create a mock audio file
    fs.writeFileSync(filepath, 'Mock audio content for testing');
    
    res.json({
      ok: true,
      file: filepath,
      url: `/tmp/${filename}`,
      title: 'Downloaded Audio',
      id: 'mock_video_id'
    });
  } catch (error) {
    console.error('YouTube download error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Genre Swap API
app.post('/api/genre/swap', async (req, res) => {
  const { audioUrl, targetGenre, karaokeMode = true } = req.body;

  if (!audioUrl || !targetGenre) {
    return res.status(400).json({ ok: false, error: 'Missing audioUrl or targetGenre' });
  }

  const jobId = createJobId();
  const job = {
    id: jobId,
    type: 'genre-swap',
    status: JobStatus.PENDING,
    progress: 0,
    params: { audioUrl, targetGenre, karaokeMode },
    result: null,
    error: null,
    log: [`Job created for ${audioUrl} -> ${targetGenre}`],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jobs.set(jobId, job);
  console.log(`Created genre swap job: ${jobId}`);

  // Start processing in background
  processGenreSwap(job);

  res.json({ 
    ok: true, 
    jobId,
    statusUrl: `/api/genre/status/${jobId}`
  });
});

// Stylus Transfer API
app.post('/api/stylus/transfer', async (req, res) => {
  const { contentUrl, styleGenre } = req.body;

  if (!contentUrl || !styleGenre) {
    return res.status(400).json({ ok: false, error: 'Missing contentUrl or styleGenre' });
  }

  const jobId = createJobId();
  const job = {
    id: jobId,
    type: 'stylus-transfer',
    status: JobStatus.PENDING,
    progress: 0,
    params: { contentUrl, styleGenre },
    result: null,
    error: null,
    log: [`Stylus job created for ${contentUrl} -> ${styleGenre}`],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  jobs.set(jobId, job);
  console.log(`Created stylus transfer job: ${jobId}`);

  // Start processing in background
  processStylusTransfer(job);

  res.json({ 
    ok: true, 
    jobId,
    statusUrl: `/api/stylus/status/${jobId}`
  });
});

// Job status endpoints
app.get('/api/genre/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found' });
  }

  res.json({ ok: true, job });
});

app.get('/api/stylus/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found' });
  }

  res.json({ ok: true, job });
});

// General job management endpoints
app.get('/jobs', (req, res) => {
  const includeHistory = req.query.includeHistory === 'true';
  let jobList = Array.from(jobs.values());
  
  if (includeHistory) {
    jobList = [...jobList, ...jobHistory];
  }
  
  jobList = jobList.map(job => ({
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress || 0,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error
  }));
  
  res.json(jobList);
});

app.get('/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found' });
  }

  res.json(job);
});

// File download endpoint
app.get('/dl/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(TMP_DIR, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ ok: false, error: 'File not found' });
  }

  res.download(filepath, filename, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: 'Download failed' });
      }
    }
  });
});

// Process genre swap job
async function processGenreSwap(job) {
  try {
    job.status = JobStatus.PROCESSING;
    job.updatedAt = new Date().toISOString();
    broadcastJobUpdate(job.id, job);

    // Step 1: Download/validate audio
    job.progress = 10;
    job.log.push('Downloading and validating audio...');
    await sleep(1000);
    broadcastJobUpdate(job.id, job);

    // Step 2: Separate vocals and instruments
    job.progress = 30;
    job.log.push('Separating vocals and accompaniment...');
    await sleep(2000);
    broadcastJobUpdate(job.id, job);

    // Step 3: Generate new backing track
    job.progress = 60;
    job.log.push(`Generating ${job.params.targetGenre} backing track...`);
    await sleep(3000);
    broadcastJobUpdate(job.id, job);

    // Step 4: Transcribe lyrics
    job.progress = 80;
    job.log.push('Transcribing lyrics...');
    await sleep(1500);
    broadcastJobUpdate(job.id, job);

    // Step 5: Final mix
    job.progress = 95;
    job.log.push('Creating final mix...');
    await sleep(1000);
    broadcastJobUpdate(job.id, job);

    // Create output files
    const outputFilename = `genre_swap_${job.id}_${job.params.targetGenre}.mp3`;
    const lrcFilename = `lyrics_${job.id}.lrc`;
    const outputPath = path.join(TMP_DIR, outputFilename);
    const lrcPath = path.join(TMP_DIR, lrcFilename);

    // Create mock output files
    fs.writeFileSync(outputPath, `Mock ${job.params.targetGenre} audio output`);
    fs.writeFileSync(lrcPath, '[00:00.00]Sample lyrics\n[00:05.00]Generated by Karatoken\n[00:10.00]Genre: ' + job.params.targetGenre);

    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.result = {
      outputUrl: `/tmp/${outputFilename}`,
      lrcUrl: `/tmp/${lrcFilename}`
    };
    job.log.push('Genre swap completed successfully!');
    job.updatedAt = new Date().toISOString();

    console.log(`Genre swap job ${job.id} completed`);
    broadcastJobUpdate(job.id, job);

  } catch (error) {
    job.status = JobStatus.FAILED;
    job.error = error.message;
    job.log.push(`Error: ${error.message}`);
    job.updatedAt = new Date().toISOString();
    
    console.error(`Genre swap job ${job.id} failed:`, error);
    broadcastJobUpdate(job.id, job);
  }
}

// Process stylus transfer job
async function processStylusTransfer(job) {
  try {
    job.status = JobStatus.PROCESSING;
    job.updatedAt = new Date().toISOString();
    broadcastJobUpdate(job.id, job);

    // Step 1: Load content audio
    job.progress = 15;
    job.log.push('Loading content audio...');
    await sleep(1000);
    broadcastJobUpdate(job.id, job);

    // Step 2: Analyze style characteristics
    job.progress = 35;
    job.log.push(`Analyzing ${job.params.styleGenre} style characteristics...`);
    await sleep(2000);
    broadcastJobUpdate(job.id, job);

    // Step 3: Apply style transfer
    job.progress = 70;
    job.log.push('Applying style transfer...');
    await sleep(3500);
    broadcastJobUpdate(job.id, job);

    // Step 4: Post-processing
    job.progress = 90;
    job.log.push('Post-processing audio...');
    await sleep(1000);
    broadcastJobUpdate(job.id, job);

    // Create output files
    const outputFilename = `stylus_${job.id}_${job.params.styleGenre}.mp3`;
    const outputPath = path.join(TMP_DIR, outputFilename);

    // Create mock output file
    fs.writeFileSync(outputPath, `Mock stylus transfer output with ${job.params.styleGenre} style`);

    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.result = {
      outputUrl: `/tmp/${outputFilename}`
    };
    job.log.push('Stylus transfer completed successfully!');
    job.updatedAt = new Date().toISOString();

    console.log(`Stylus transfer job ${job.id} completed`);
    broadcastJobUpdate(job.id, job);

  } catch (error) {
    job.status = JobStatus.FAILED;
    job.error = error.message;
    job.log.push(`Error: ${error.message}`);
    job.updatedAt = new Date().toISOString();
    
    console.error(`Stylus transfer job ${job.id} failed:`, error);
    broadcastJobUpdate(job.id, job);
  }
}

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== Karatoken Integrated Server Running ===`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`Web Interface: http://localhost:${PORT}/index.html`);
  console.log(`Features: Genre Swap, Stylus Transfer, YouTube Integration`);
  console.log(`WebSocket: Enabled for real-time updates`);
  console.log('==========================================\n');
});

// Handle server errors
server.on('error', (error) => {
  console.error('\n=== Server Error ===');
  console.error(error);
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use. Please stop the current server first.`);
  }
  console.error('====================\n');
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('\n=== Uncaught Exception ===');
  console.error(error);
  console.error('========================\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('\n=== Unhandled Rejection ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  console.error('==========================\n');
});

module.exports = { app, server, io };