const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const config = require('./mcp-config.json');

// Import workers
const GenreSwapWorker = require('./workers/GenreSwapWorker');
const StylusWorker = require('./workers/StylusWorker');

class MCPServer {
  constructor() {
    this.app = express();
    this.workers = {
      current: new GenreSwapWorker(),
      stylus: new StylusWorker()
    };
    this.setupMiddleware();
    this.setupRoutes();
    this.setupStaticFiles();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }

  setupStaticFiles() {
    // Create public directory if it doesn't exist
    const publicDir = path.join(__dirname, 'public');
    const downloadsDir = path.join(publicDir, 'downloads');
    
    fs.mkdir(downloadsDir, { recursive: true }).catch(console.error);
    
    // Serve static files from public directory
    this.app.use('/downloads', express.static(downloadsDir));

    // Serve frontend assets from web directory
    const webDir = path.join(__dirname, 'web');
    this.app.use(express.static(webDir));

    // Root route -> web/index.html (so opening http://localhost:3000 shows the UI)
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(webDir, 'index.html'));
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        server: process.env.SERVER_TYPE || 'mcp',
        timestamp: new Date().toISOString(),
        workers: Object.keys(this.workers)
      });
    });

    // Process endpoint
    this.app.post('/process', async (req, res) => {
      try {
        const { type, data } = req.body;
        
        if (!this.workers[type]) {
          return res.status(400).json({ error: 'Invalid server type' });
        }

        // Forward request to appropriate worker
        const response = await this.forwardRequest(type, data);
        res.json(response);
      } catch (error) {
        console.error('Process error:', error);
        res.status(500).json({ error: 'Processing failed', details: error.message });
      }
    });
    
    // Job status endpoint
    this.app.get('/status/:type/:jobId', async (req, res) => {
      try {
        const { type, jobId } = req.params;
        
        if (!this.workers[type]) {
          return res.status(400).json({ error: 'Invalid server type' });
        }
        
        const status = await this.getJobStatus(type, jobId);
        const job = {
          id: status.jobId,
          status: status.status,
          progress: status.progress,
          // Map result fields to what the UI expects
          outputUrl: status?.result?.audioUrl || status?.result?.outputUrl || null,
          lrcUrl: status?.result?.lrcUrl || status?.result?.lyricsUrl || null,
          message: status?.result?.message || null,
          stage: status?.result?.stage || null,
        };
        res.json({ ok: true, job });
      } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Status check failed', details: error.message });
      }
    });
    
    // Minimal API: Genre swap entrypoint expected by the UI
    this.app.post('/api/genre/swap', async (req, res) => {
      try {
        const { audioUrl, targetGenre } = req.body || {};
        const response = await this.forwardRequest('current', { audioUrl, targetGenre });
        const statusUrl = `/status/current/${response.jobId}`;
        res.json({ ok: true, statusUrl });
      } catch (error) {
        console.error('Genre swap error:', error);
        res.status(500).json({ ok: false, error: error.message });
      }
    });

    // Minimal YouTube endpoints to avoid 404s in the UI
    this.app.get('/api/youtube/search', async (req, res) => {
      // Not implemented in this server; return empty results gracefully
      res.json({ items: [] });
    });

    this.app.post('/api/youtube/download', async (req, res) => {
      // Not implemented here; surface a helpful message for the UI
      res.status(501).json({ error: 'YouTube download not implemented in MCP server' });
    });

    // List jobs endpoint (for debugging)
    this.app.get('/jobs', (req, res) => {
      res.json({
        genreSwap: Array.from(this.workers.current.jobs.keys()),
        stylus: Array.from(this.workers.stylus.jobs.keys())
      });
    });
  }

  async forwardRequest(serverType, data) {
    const worker = this.workers[serverType];
    if (!worker) {
      throw new Error(`No worker found for server type: ${serverType}`);
    }

    // Create and start the job
    const job = await worker.createJob(serverType, data);
    
    // Process the job in the background
    worker.processJob(job.id).catch(error => {
      console.error(`Job ${job.id} failed:`, error);
    });
    
    // Return the job info immediately
    return {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      server: serverType,
      estimatedTime: serverType === 'current' ? 2000 : 3000
    };
  }
  
  async getJobStatus(serverType, jobId) {
    const worker = this.workers[serverType];
    if (!worker) {
      throw new Error(`No worker found for server type: ${serverType}`);
    }
    
    try {
      const job = await worker.getJobStatus(jobId);
      return {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
    } catch (error) {
      return {
        jobId,
        status: 'error',
        error: error.message
      };
    }
  }

  start(port = 3000) {
    this.server = this.app.listen(port, () => {
      console.log(`MCP Server running on port ${port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new MCPServer();
  const port = process.env.PORT || 3000;
  server.start(port);
}

module.exports = MCPServer;
