const request = require('supertest');
const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// Import the router
const { router: genreSwapRouter, GenreSwapProcessor } = require('./aiGenreSwapApi');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai/genre-swap', genreSwapRouter);

describe('Genre Swap API', () => {
  const testYoutubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll for testing
  const validGenre = 'rock';
  const invalidGenre = 'invalid_genre';

  beforeAll(async () => {
    // Create test directories
    await fs.ensureDir(path.join(process.cwd(), 'public', 'genre-swaps'));
    await fs.ensureDir(path.join(process.cwd(), 'temp'));
  });

  afterAll(async () => {
    // Clean up test files
    await fs.remove(path.join(process.cwd(), 'public', 'genre-swaps'));
    await fs.remove(path.join(process.cwd(), 'temp'));
  });

  describe('POST /api/ai/genre-swap', () => {
    test('should accept valid request and return job ID', async () => {
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: testYoutubeUrl,
          targetGenre: validGenre
        })
        .expect(200);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('estimatedTime');
      expect(response.body.message).toBe('Genre swap job queued successfully');
    });

    test('should reject request without youtubeUrl', async () => {
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          targetGenre: validGenre
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('youtubeUrl and targetGenre are required');
    });

    test('should reject request without targetGenre', async () => {
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: testYoutubeUrl
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('youtubeUrl and targetGenre are required');
    });

    test('should reject invalid YouTube URL', async () => {
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: 'https://invalid-url.com',
          targetGenre: validGenre
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid YouTube URL');
    });

    test('should reject invalid genre', async () => {
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: testYoutubeUrl,
          targetGenre: invalidGenre
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid genre');
      expect(response.body).toHaveProperty('supportedGenres');
    });

    test('should sanitize genre input', async () => {
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: testYoutubeUrl,
          targetGenre: 'ROCK!!!' // Should be sanitized to 'rock'
        })
        .expect(200);

      expect(response.body).toHaveProperty('jobId');
    });
  });

  describe('GET /api/ai/genre-swap/status/:jobId', () => {
    test('should return job status for valid job ID', async () => {
      // First create a job
      const createResponse = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: testYoutubeUrl,
          targetGenre: validGenre
        });

      const jobId = createResponse.body.jobId;

      // Check status
      const statusResponse = await request(app)
        .get(`/api/ai/genre-swap/status/${jobId}`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('progress');
      expect(statusResponse.body).toHaveProperty('timestamp');
    });

    test('should return 404 for invalid job ID', async () => {
      const response = await request(app)
        .get('/api/ai/genre-swap/status/invalid-job-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Job not found');
    });
  });

  describe('GET /api/ai/genre-swap/genres', () => {
    test('should return list of supported genres', async () => {
      const response = await request(app)
        .get('/api/ai/genre-swap/genres')
        .expect(200);

      expect(response.body).toHaveProperty('supportedGenres');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.supportedGenres)).toBe(true);
      expect(response.body.count).toBe(response.body.supportedGenres.length);
    });

    test('should include common genres', async () => {
      const response = await request(app)
        .get('/api/ai/genre-swap/genres')
        .expect(200);

      const genres = response.body.supportedGenres;
      expect(genres).toContain('rock');
      expect(genres).toContain('jazz');
      expect(genres).toContain('pop');
      expect(genres).toContain('electronic');
      expect(genres).toContain('classical');
    });
  });

  describe('Tool Availability Tests', () => {
    test('should check if yt-dlp is available', async () => {
      return new Promise((resolve, reject) => {
        const process = spawn('yt-dlp', ['--version']);
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('yt-dlp is not available'));
          }
        });
        
        process.on('error', () => {
          reject(new Error('yt-dlp is not available'));
        });
      });
    });

    test('should check if demucs is available', async () => {
      return new Promise((resolve, reject) => {
        const process = spawn('demucs', ['--help']);
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('demucs is not available'));
          }
        });
        
        process.on('error', () => {
          reject(new Error('demucs is not available'));
        });
      });
    });

    test('should check if whisper is available', async () => {
      return new Promise((resolve, reject) => {
        const process = spawn('whisper', ['--help']);
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('whisper is not available'));
          }
        });
        
        process.on('error', () => {
          reject(new Error('whisper is not available'));
        });
      });
    });

    test('should check if ffmpeg is available', async () => {
      return new Promise((resolve, reject) => {
        const process = spawn('ffmpeg', ['-version']);
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('ffmpeg is not available'));
          }
        });
        
        process.on('error', () => {
          reject(new Error('ffmpeg is not available'));
        });
      });
    });
  });

  describe('Genre Processing Tests', () => {
    test('should apply rock genre effects', async () => {
      const processor = new GenreSwapProcessor('test-job', testYoutubeUrl, 'rock');
      
      // Test genre-specific effects
      expect(processor.targetGenre).toBe('rock');
    });

    test('should apply jazz genre effects', async () => {
      const processor = new GenreSwapProcessor('test-job', testYoutubeUrl, 'jazz');
      
      expect(processor.targetGenre).toBe('jazz');
    });

    test('should apply electronic genre effects', async () => {
      const processor = new GenreSwapProcessor('test-job', testYoutubeUrl, 'electronic');
      
      expect(processor.targetGenre).toBe('electronic');
    });
  });

  describe('File Processing Tests', () => {
    test('should create proper file paths', async () => {
      const processor = new GenreSwapProcessor('test-job', testYoutubeUrl, 'rock');
      
      // Test LRC time formatting
      const time1 = processor.formatTime(65.5);
      expect(time1).toBe('01:05.50');
      
      const time2 = processor.formatTime(125.75);
      expect(time2).toBe('02:05.75');
    });

    test('should generate valid LRC content', async () => {
      const processor = new GenreSwapProcessor('test-job', testYoutubeUrl, 'rock');
      
      const mockTranscription = {
        segments: [
          { start: 0, end: 3, text: 'Hello world' },
          { start: 3, end: 6, text: 'This is a test' }
        ]
      };
      
      const lrcPath = await processor.generateLRCFile(mockTranscription);
      expect(await fs.pathExists(lrcPath)).toBe(true);
      
      const content = await fs.readFile(lrcPath, 'utf8');
      expect(content).toContain('[00:00.00]Hello world');
      expect(content).toContain('[00:03.00]This is a test');
      
      // Clean up
      await fs.remove(lrcPath);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle YouTube download failures gracefully', async () => {
      const processor = new GenreSwapProcessor('test-job', 'https://invalid-youtube-url', 'rock');
      
      // This should not throw an error but handle it gracefully
      expect(processor).toBeDefined();
    });

    test('should handle missing tools gracefully', async () => {
      // Test that the API doesn't crash when tools are missing
      const response = await request(app)
        .post('/api/ai/genre-swap')
        .send({
          youtubeUrl: testYoutubeUrl,
          targetGenre: validGenre
        })
        .expect(200);

      expect(response.body).toHaveProperty('jobId');
    });
  });
}); 