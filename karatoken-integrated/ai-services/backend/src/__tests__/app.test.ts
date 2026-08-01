import request from 'supertest';
import { createServer } from 'http';
import app from '../index';
import fs from 'fs';
import path from 'path';

describe('App Endpoints', () => {
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
});
