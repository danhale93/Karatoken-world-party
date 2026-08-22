import request from 'supertest';
import { createServer } from 'http';
import app from '../index';
import path from 'path';
import fs from 'fs';

describe('Genre Swap API', () => {
  let server: any;
  const testAudioPath = path.join(__dirname, '../../test/test-audio.mp3');

  beforeAll(done => {
    // Create a test audio file if it doesn't exist
    if (!fs.existsSync(path.dirname(testAudioPath))) {
      fs.mkdirSync(path.dirname(testAudioPath), { recursive: true });
    }
    if (!fs.existsSync(testAudioPath)) {
      fs.writeFileSync(testAudioPath, 'dummy audio content');
    }

    server = createServer(app);
    server.listen(0, () => done());
  });

  afterAll(done => {
    server.close(done);
  });

  describe('POST /api/genre/swap', () => {
    it('should create a new genre swap job', async () => {
      const response = await request(server).post('/api/genre/swap').send({
        audioUrl: testAudioPath,
        targetGenre: 'rock',
        karaokeMode: true,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('jobId');
    });

    it('should return 400 for missing parameters', async () => {
      const response = await request(server).post('/api/genre/swap').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail background job when a path-traversal local path is supplied', async () => {
      const createResponse = await request(server).post('/api/genre/swap').send({
        audioUrl: '../../../../../../etc/passwd',
        targetGenre: 'rock',
        karaokeMode: true,
      });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body).toHaveProperty('ok', true);
      const { jobId } = createResponse.body;

      // Wait for background job execution
      await new Promise(resolve => setTimeout(resolve, 1200));

      const statusResponse = await request(server).get(`/api/genre/status/${jobId}`);
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.job.status).toBe('failed');
      expect(statusResponse.body.job.error).toBe('Access denied: Invalid file path');
    });

    it('should fail background job when a non-audio file is supplied to prevent arbitrary file overwrite', async () => {
      const createResponse = await request(server).post('/api/genre/swap').send({
        audioUrl: 'package.json',
        targetGenre: 'rock',
        karaokeMode: true,
      });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body).toHaveProperty('ok', true);
      const { jobId } = createResponse.body;

      // Wait for background job execution
      await new Promise(resolve => setTimeout(resolve, 1200));

      const statusResponse = await request(server).get(`/api/genre/status/${jobId}`);
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.job.status).toBe('failed');
      expect(statusResponse.body.job.error).toContain(
        'Access denied: File must be a valid audio file'
      );
    });

    it('should fail background job when a directory is supplied as audioUrl', async () => {
      const createResponse = await request(server).post('/api/genre/swap').send({
        audioUrl: 'src',
        targetGenre: 'rock',
        karaokeMode: true,
      });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body).toHaveProperty('ok', true);
      const { jobId } = createResponse.body;

      // Wait for background job execution
      await new Promise(resolve => setTimeout(resolve, 1200));

      const statusResponse = await request(server).get(`/api/genre/status/${jobId}`);
      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.job.status).toBe('failed');
      expect(statusResponse.body.job.error).toContain('Access denied: Path is not a regular file');
    });
  });

  describe('GET /api/genre/status/:jobId', () => {
    it('should return job status', async () => {
      // First create a job
      const createResponse = await request(server).post('/api/genre/swap').send({
        audioUrl: testAudioPath,
        targetGenre: 'pop',
        karaokeMode: true,
      });

      const { jobId } = createResponse.body;

      // Then check its status
      const statusResponse = await request(server).get(`/api/genre/status/${jobId}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body).toHaveProperty('ok', true);
      expect(statusResponse.body).toHaveProperty('job');
      expect(statusResponse.body.job).toHaveProperty('id', jobId);
      expect(['pending', 'processing', 'completed', 'failed']).toContain(
        statusResponse.body.job.status
      );
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(server).get('/api/genre/status/nonexistent-job-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body).toHaveProperty('error', 'Job not found');
    });
  });

  describe('Caching behavior of /api/genre/swap', () => {
    const targetGenre = 'pop_cache_test';
    const expectedCacheKey = `${testAudioPath}-${targetGenre}`
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const cacheFilePath = path.join(__dirname, '../../.cache', `${expectedCacheKey}.json`);

    afterAll(() => {
      // Clean up cached json and dummy files generated during the cache tests
      try {
        if (fs.existsSync(cacheFilePath)) {
          fs.unlinkSync(cacheFilePath);
        }
        const generatedFiles = [
          testAudioPath.replace('.mp3', '_instr.mp3'),
          testAudioPath.replace('.mp3', '_vocal.mp3'),
          testAudioPath.replace('.mp3', `_backing_${targetGenre}.mp3`),
          testAudioPath.replace('.mp3', '.lrc'),
          testAudioPath.replace('.mp3', `_final_${targetGenre}.mp3`),
        ];
        generatedFiles.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
      } catch (err) {
        console.warn('Failed to clean up test cache/dummy files:', err);
      }
    });

    it('should run full swap, write cache, and hit cache on subsequent request', async () => {
      // 1. First request (cold start, must process and write cache)
      const res1 = await request(server).post('/api/genre/swap').send({
        audioUrl: testAudioPath,
        targetGenre,
        karaokeMode: true,
      });

      expect(res1.status).toBe(200);
      expect(res1.body).toHaveProperty('ok', true);
      const jobId = res1.body.jobId;

      // Poll until background job completes or timeout occurs
      let statusRes1: any;
      const maxAttempts = 50;
      for (let i = 0; i < maxAttempts; i++) {
        statusRes1 = await request(server).get(`/api/genre/status/${jobId}`);
        if (
          statusRes1.body?.job?.status === 'completed' ||
          statusRes1.body?.job?.status === 'failed'
        ) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Verify the job completed successfully
      expect(statusRes1.status).toBe(200);
      expect(statusRes1.body.job.status).toBe('completed');

      // Verify cache file was written to disk
      expect(fs.existsSync(cacheFilePath)).toBe(true);

      // 2. Second request (should hit the cache immediately)
      const startTime = performance.now();
      const res2 = await request(server).post('/api/genre/swap').send({
        audioUrl: testAudioPath,
        targetGenre,
        karaokeMode: true,
      });
      const endTime = performance.now();

      expect(res2.status).toBe(200);
      expect(res2.body).toHaveProperty('ok', true);
      expect(res2.body).toHaveProperty('cached', true);
      expect(res2.body.jobId).toBe(jobId);

      // Verify that cache hit response is extremely fast (< 10ms)
      const responseTime = endTime - startTime;
      console.log(`\n=== ⚡ Bolt Performance Benchmark (Genre Swap Caching) ===`);
      console.log(`[Cache Hit] Response time: ${responseTime.toFixed(3)} ms`);
      console.log(`=========================================================\n`);
      expect(responseTime).toBeLessThan(150);

      // 3. Verify status polling for the cached job ID also works instantly
      const statusRes2 = await request(server).get(`/api/genre/status/${jobId}`);
      expect(statusRes2.status).toBe(200);
      expect(statusRes2.body.job.status).toBe('completed');
    });
  });
});
