import request from 'supertest';
import { createServer } from 'http';
import app from '../index';
import fs from 'fs';
import path from 'path';
import { resetAllRateLimiters } from '../services/rateLimiter';

jest.mock('ytsr', () => {
  return jest.fn().mockResolvedValue({
    items: [
      {
        type: 'video',
        id: 'dQw4w9WgXcQ',
        title: 'Mock Video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '3:30',
        thumbnails: [],
        author: { name: 'Mock Channel', url: 'https://youtube.com' },
      },
    ],
  });
});

describe('App Endpoints', () => {
  beforeEach(() => {
    resetAllRateLimiters();
  });
  let server: any;
  const tmpDir = path.resolve(process.cwd(), 'tmp');
  const testFilePath = path.join(tmpDir, 'test-download-file.txt');

  beforeAll(done => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(testFilePath, 'secure content for testing download');

    server = createServer(app);
    server.listen(0, () => done()); // Use random available port
  });

  afterAll(done => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    server.close(done);
  });

  describe('GET /health', () => {
    it('should return 200 OK', async () => {
      const response = await request(server).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'karatoken-backend',
        time: expect.any(String),
      });
    });
  });

  describe('Security Headers', () => {
    it('should set security headers and disable X-Powered-By', async () => {
      const response = await request(server).get('/health');
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });

  describe('GET /dl/*', () => {
    it('should download a valid file successfully', async () => {
      const response = await request(server).get('/dl/test-download-file.txt');
      expect(response.status).toBe(200);
      expect(response.text).toBe('secure content for testing download');
    });

    it('should return 404 for a non-existent file', async () => {
      const response = await request(server).get('/dl/non-existent-file-999.txt');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body).toHaveProperty('error', 'File not found');
    });

    it('should return 400 for a directory', async () => {
      const response = await request(server).get('/dl/.');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Invalid path');
    });

    it('should return 400 for path traversal', async () => {
      const response = await request(server).get('/dl/../package.json');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Invalid path');
    });
  });

  describe('POST /api/youtube/download Security', () => {
    it('should return 400 for missing or invalid type URL (parameter pollution/type confusion)', async () => {
      const response1 = await request(server)
        .post('/api/youtube/download')
        .send({ url: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'] });
      expect(response1.status).toBe(400);
      expect(response1.body).toHaveProperty('ok', false);
      expect(response1.body.error).toBe('Invalid or missing YouTube URL');

      const response2 = await request(server).post('/api/youtube/download').send({ url: 12345 });
      expect(response2.status).toBe(400);
      expect(response2.body).toHaveProperty('ok', false);
      expect(response2.body.error).toBe('Invalid or missing YouTube URL');
    });

    it('should return 400 for non-YouTube or internal malicious URLs (SSRF prevention)', async () => {
      const response1 = await request(server)
        .post('/api/youtube/download')
        .send({ url: 'http://localhost:3100/health' });
      expect(response1.status).toBe(400);
      expect(response1.body).toHaveProperty('ok', false);
      expect(response1.body.error).toBe('Invalid YouTube URL format');

      const response2 = await request(server)
        .post('/api/youtube/download')
        .send({ url: 'http://127.0.0.1.nip.io/health' });
      expect(response2.status).toBe(400);
      expect(response2.body).toHaveProperty('ok', false);
      expect(response2.body.error).toBe('Invalid YouTube URL format');

      const response3 = await request(server)
        .post('/api/youtube/download')
        .send({ url: 'https://attacker.com/malicious' });
      expect(response3.status).toBe(400);
      expect(response3.body).toHaveProperty('ok', false);
      expect(response3.body.error).toBe('Invalid YouTube URL format');
    });
  });

  describe('GET /api/youtube/search Parameter Validation', () => {
    it('should return 400 for missing or invalid q parameter type (parameter pollution/type confusion)', async () => {
      const response1 = await request(server)
        .get('/api/youtube/search')
        .query({ q: ['rock', 'pop'] });
      expect(response1.status).toBe(400);
      expect(response1.body).toHaveProperty('ok', false);
      expect(response1.body.error).toBe('Missing or invalid q parameter');

      const response2 = await request(server).get('/api/youtube/search');
      expect(response2.status).toBe(400);
      expect(response2.body).toHaveProperty('ok', false);
      expect(response2.body.error).toBe('Missing or invalid q parameter');
    });
  });

  describe('Rate Limiter Protection & Abuse Prevention', () => {
    it('should block rapid requests to /api/youtube/search with 429 after 10 requests in test env', async () => {
      // Node environment rate limit max is set to 10 in testing, making unit tests fast and efficient!
      for (let i = 0; i < 10; i++) {
        await request(server).get('/api/youtube/search').query({ q: 'rock' });
      }

      const response = await request(server).get('/api/youtube/search').query({ q: 'rock' });
      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Too many search requests');
    });

    it('should reset rate limit windows using global reset functionality', async () => {
      // Consume the quota
      for (let i = 0; i < 10; i++) {
        await request(server).get('/api/youtube/search').query({ q: 'rock' });
      }

      const blockedResponse = await request(server).get('/api/youtube/search').query({ q: 'rock' });
      expect(blockedResponse.status).toBe(429);

      // Trigger reset
      resetAllRateLimiters();

      // Should succeed now
      const allowedResponse = await request(server).get('/api/youtube/search').query({ q: 'rock' });
      expect(allowedResponse.status).not.toBe(429);
    });
  });

  describe('GET /api/spotify/callback Parameter Validation', () => {
    it('should return 400 for invalid error parameter type', async () => {
      const response = await request(server)
        .get('/api/spotify/callback')
        .query({ error: ['err1', 'err2'] });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toBe('Invalid error parameter type');
    });

    it('should return 400 for invalid code parameter type', async () => {
      const response = await request(server)
        .get('/api/spotify/callback')
        .query({ code: ['code1', 'code2'] });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toBe('Invalid code parameter type');
    });

    it('should return 400 for invalid state parameter type', async () => {
      const response = await request(server)
        .get('/api/spotify/callback')
        .query({ state: ['state1', 'state2'] });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toBe('Invalid state parameter type');
    });

    it('should return 200 and success with valid callback query parameters', async () => {
      const response = await request(server)
        .get('/api/spotify/callback')
        .query({ code: 'valid-code', state: 'valid-state' });
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        received: { code: 'valid-code', state: 'valid-state' },
      });
    });
  });
});
