const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const MCPServer = require('./mcp-server');
const GenreSwapWorker = require('./workers/GenreSwapWorker');

test('MCPServer - Rate Limiting & Reset Protections', async (t) => {
  const server = new MCPServer();
  // Listen on a dynamic port
  await new Promise((resolve) => {
    server.start(0);
    server.server.on('listening', resolve);
  });
  const port = server.server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    await t.test('Rate limiter blocks requests exceeding limit', async () => {
      // Reset rate limit tracking map
      MCPServer.resetRateLimiters();

      // Send 15 requests (which is allowed)
      for (let i = 0; i < 15; i++) {
        const res = await fetch(`${baseUrl}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'current', data: { audioUrl: 'test.mp3', genre: 'rock' } })
        });
        assert.ok(res.status !== 429, `Request ${i} should not be rate limited`);
      }

      // The 16th request should return 429
      const res429 = await fetch(`${baseUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'current', data: { audioUrl: 'test.mp3', genre: 'rock' } })
      });
      assert.strictEqual(res429.status, 429, '16th request must return 429 Too Many Requests');
      const json = await res429.json();
      assert.strictEqual(json.error, 'Too many requests from this IP, please try again later.');
    });

    await t.test('Rate limiter can be reset using static utility', async () => {
      // Reset limiters
      MCPServer.resetRateLimiters();

      // Next request should succeed again
      const res = await fetch(`${baseUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'current', data: { audioUrl: 'test.mp3', genre: 'rock' } })
      });
      assert.ok(res.status !== 429, 'Request after rate limiter reset should succeed');
    });
  } finally {
    server.stop();
  }
});

const StylusWorker = require('./workers/StylusWorker');

test('StylusWorker - Defense in depth styleGenre validation', async () => {
  const worker = new StylusWorker();

  const invalidGenres = [
    '../../etc/passwd',
    'pop; rm -rf /',
    'rock\0',
    'genre&&touch',
    ''
  ];

  for (const styleGenre of invalidGenres) {
    const job = { id: 'test_job', data: { contentUrl: 'test.mp3', styleGenre } };
    await assert.rejects(
      () => worker.performJob(job),
      /Invalid styleGenre format/,
      `styleGenre '${styleGenre}' should be rejected by worker validation`
    );
  }
});

test('GenreSwapWorker - Defense in depth genre validation', async () => {
  const worker = new GenreSwapWorker();

  // Valid genres should not throw validation error (they might fail with file-not-found which is expected)
  // Let's test calling processGenreSwap directly
  const invalidGenres = [
    '../../etc/passwd',
    'pop; rm -rf /',
    'rock\0',
    'genre&&touch',
    ''
  ];

  for (const genre of invalidGenres) {
    await assert.rejects(
      () => worker.processGenreSwap('dummy_audio.mp3', genre),
      /Invalid genre format/,
      `Genre '${genre}' should be rejected by worker validation`
    );
  }

  // A valid genre should not throw 'Invalid genre format'
  try {
    await worker.processGenreSwap('dummy_audio.mp3', 'synthwave');
  } catch (err) {
    assert.notStrictEqual(err.message, 'Invalid genre format');
  }
});

test('simple-server.js - Serves responses with standard security headers', async () => {
  const simpleServerPath = require.resolve('./simple-server.js');
  // We can read simple-server.js file and verify secure headers are configured
  const fs = require('fs');
  const content = fs.readFileSync(simpleServerPath, 'utf8');
  assert.ok(content.includes('X-Content-Type-Options'), 'Should configure X-Content-Type-Options');
  assert.ok(content.includes('X-Frame-Options'), 'Should configure X-Frame-Options');
  assert.ok(content.includes('X-XSS-Protection'), 'Should configure X-XSS-Protection');
  assert.ok(content.includes('Referrer-Policy'), 'Should configure Referrer-Policy');
});
