import request from 'supertest';
import { createServer } from 'http';
import app from '../index';

describe('GET /health', () => {
  let server: any;
  
  beforeAll((done) => {
    server = createServer(app);
    server.listen(0, () => done()); // Use random available port
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return 200 OK', async () => {
    const response = await request(server).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'karatoken-backend',
      time: expect.any(String)
    });
  });
});
