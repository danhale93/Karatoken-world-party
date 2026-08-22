import { createServer } from 'http';
import request from 'supertest';
import ytdl from '@distube/ytdl-core';
import ytsr from 'ytsr';
import app from '../index';
import { resetAllRateLimiters } from '../services/rateLimiter';

jest.mock('ytsr', () => jest.fn());
jest.mock('@distube/ytdl-core', () => {
  const mockYtdl: any = jest.fn(() => {
    const { Readable } = require('stream');
    const s = new Readable();
    s._read = () => {};
    setTimeout(() => {
      s.emit('data', 'dummy chunk');
      s.emit('end');
    }, 10);
    return s;
  });
  mockYtdl.validateURL = jest.fn(() => true);
  mockYtdl.getInfo = jest.fn(() =>
    Promise.resolve({
      videoDetails: {
        title: 'Mock Video Title',
        videoId: 'mock_video_id',
      },
    })
  );
  return mockYtdl;
});

describe('YouTube Search & Download API (Security Focus)', () => {
  let server: any;

  beforeAll(done => {
    server = createServer(app);
    server.listen(0, () => done());
  });

  beforeEach(() => {
    resetAllRateLimiters();
  });

  afterAll(done => {
    server.close(done);
  });

  describe('GET /api/youtube/search', () => {
    it('should succeed with valid search query string', async () => {
      (ytsr as jest.Mock).mockResolvedValue({
        items: [
          {
            type: 'video',
            id: 'abc',
            title: 'Test Video',
            url: 'https://youtube.com/watch?v=abc',
            duration: '3:00',
            thumbnails: [],
            author: { name: 'Test Author', url: 'https://youtube.com/author' },
          },
        ],
      });

      const response = await request(server).get('/api/youtube/search').query({ q: 'hello' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body.items[0]).toHaveProperty('title', 'Test Video');
    });

    it('should fail with 400 when query parameter is missing', async () => {
      const response = await request(server).get('/api/youtube/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Missing or invalid q parameter');
    });

    it('should fail with 400 when query parameter is an array (parameter pollution)', async () => {
      const response = await request(server)
        .get('/api/youtube/search')
        .query({ q: ['hello', 'world'] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Missing or invalid q parameter');
    });
  });

  describe('POST /api/youtube/download', () => {
    it('should succeed with valid YouTube URL', async () => {
      (ytdl.validateURL as jest.Mock).mockReturnValue(true);

      const response = await request(server)
        .post('/api/youtube/download')
        .send({ url: 'https://www.youtube.com/watch?v=mock_video_id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('title', 'Mock Video Title');
    });

    it('should fail with 400 when URL is missing', async () => {
      const response = await request(server).post('/api/youtube/download').send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Invalid or missing YouTube URL');
    });

    it('should fail with 400 when URL is an array (parameter pollution)', async () => {
      const response = await request(server)
        .post('/api/youtube/download')
        .send({
          url: ['https://www.youtube.com/watch?v=1', 'https://www.youtube.com/watch?v=2'],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Invalid or missing YouTube URL');
    });
  });

  describe('Rate Limiter for YouTube API', () => {
    it('should block requests that exceed limit', async () => {
      (ytsr as jest.Mock).mockResolvedValue({ items: [] });

      // In testing env, max limit for rate limiters is 10 requests
      for (let i = 0; i < 10; i++) {
        const response = await request(server)
          .post('/api/youtube/download')
          .send({ url: 'https://www.youtube.com/watch?v=mock_video_id' });
        expect(response.status).toBe(200);
      }

      // 11th request should fail
      const blockedResponse = await request(server)
        .post('/api/youtube/download')
        .send({ url: 'https://www.youtube.com/watch?v=mock_video_id' });
      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body).toHaveProperty('ok', false);
      expect(blockedResponse.body.error).toContain('Too many requests');
    });
  });
});
