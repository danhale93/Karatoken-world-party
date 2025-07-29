const request = require('supertest');
const express = require('express');

// Import your app (refactor your main file to export app for testing)
let app;
beforeAll(() => {
  app = require('../karatoken_backend_apis');
});

describe('Karatoken API', () => {
  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        username: `testuser${Date.now()}`,
        userType: 'artist'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.userId).toBeDefined();
  });

  it('should reject login (by design)', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/firebase client sdk/i);
  });

  it('should get leaderboard', async () => {
    const res = await request(app).get('/api/leaderboard');
    expect(res.statusCode).toBe(200);
    expect(res.body.leaderboard).toBeDefined();
    expect(Array.isArray(res.body.leaderboard)).toBe(true);
  });
});
