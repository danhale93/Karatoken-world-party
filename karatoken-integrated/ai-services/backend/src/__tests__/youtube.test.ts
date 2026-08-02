import { createServer } from 'http';
import request from 'supertest';
import ytdl from '@distube/ytdl-core';
import ytsr from 'ytsr';
import app from '../index';
import { resetRateLimits } from '../routes/rateLimiter';

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
    resetRateLimits();
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
      expect(response.body.error).toContain('Invalid or missing q parameter');
    });

    it('should fail with 400 when query parameter is an array (parameter pollution)', async () => {
      const response = await request(server)
        .get('/api/youtube/search')
        .query({ q: ['hello', 'world'] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Invalid or missing q parameter');
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
      expect(response.body.error).toContain('Invalid or missing url parameter');
    });

    it('should fail with 400 when URL is an array (parameter pollution)', async () => {
      const response = await request(server)
        .post('/api/youtube/download')
        .send({
          url: ['https://www.youtube.com/watch?v=1', 'https://www.youtube.com/watch?v=2'],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.error).toContain('Invalid or missing url parameter');
    });
  });

  describe('Rate Limiter for YouTube API', () => {
    it('should block requests that exceed limit', async () => {
      (ytsr as jest.Mock).mockResolvedValue({ items: [] });

      // We configured rate limiter for /search as 60 requests per minute, which is too high to easily test
      // unless we make 61 requests, but let's test rate limiter behavior by simulating 16 requests on download
      // (limit is 15 requests per minute).
      for (let i = 0; i < 15; i++) {
        const response = await request(server)
          .post('/api/youtube/download')
          .send({ url: 'https://www.youtube.com/watch?v=mock_video_id' });
        expect(response.status).toBe(200);
      }

      // 16th request should fail
      const blockedResponse = await request(server)
        .post('/api/youtube/download')
        .send({ url: 'https://www.youtube.com/watch?v=mock_video_id' });
      expect(blockedResponse.status).toBe(429);
      expect(blockedResponse.body).toHaveProperty('ok', false);
      expect(blockedResponse.body.error).toContain('Too many requests');
    });
  });
});
