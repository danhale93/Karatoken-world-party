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

    it('should return 400 for invalid targetGenre containing unsafe characters', async () => {
      const response = await request(server).post('/api/genre/swap').send({
        audioUrl: testAudioPath,
        targetGenre: 'rock; rm -rf /',
        karaokeMode: true,
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body).toHaveProperty('error', 'Invalid targetGenre format');
    });

    it('should fail the job with Access denied for path traversal audioUrl', async () => {
      const createResponse = await request(server).post('/api/genre/swap').send({
        audioUrl: '../../../../etc/passwd',
        targetGenre: 'rock',
        karaokeMode: true,
      });

      expect(createResponse.status).toBe(200);
      const { jobId } = createResponse.body;

      // Poll until status is failed (up to 2000ms)
      let statusResponse;
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        statusResponse = await request(server).get(`/api/genre/status/${jobId}`);
        if (statusResponse.body.job.status === 'failed') {
          break;
        }
      }

      expect(statusResponse).toBeDefined();
      expect(statusResponse!.status).toBe(200);
      expect(statusResponse!.body.job.status).toBe('failed');
      expect(statusResponse!.body.job.error).toContain('Access denied');
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
});
