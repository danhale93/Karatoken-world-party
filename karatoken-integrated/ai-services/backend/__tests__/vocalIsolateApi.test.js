jest.setTimeout(90000); // 90 seconds for all tests in this file

const request = require('supertest');
let app;
beforeAll(() => {
  app = require('../karatoken_backend_apis');
});

describe('Vocal Isolation API', () => {
  it('should return 400 if youtubeUrl is missing', async () => {
    const res = await request(app).post('/api/ai/vocal-isolate').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/youtubeUrl is required/i);
  });

  it('should return an audioUrl for a valid YouTube URL', async () => {
    const res = await request(app)
      .post('/api/ai/vocal-isolate')
      .send({ youtubeUrl: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y' });
    expect(res.statusCode).toBe(200);
    expect(res.body.audioUrl).toBeDefined();
    expect(typeof res.body.audioUrl).toBe('string');
  });
}); 