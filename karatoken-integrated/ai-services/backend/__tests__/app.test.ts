import request from 'supertest';
import app from '../index';

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

// Add a health check endpoint to your Express app if not already present
// app.get('/health', (req, res) => {
//   res.json({ status: 'ok' });
// });
