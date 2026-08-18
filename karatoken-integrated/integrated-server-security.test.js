const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { server, resetRateLimiters } = require('./integrated-server');

test('Integrated Server - Rate Limiting & Isolation Protections', async (t) => {
  // Listen on a dynamic port
  await new Promise((resolve) => {
    server.listen(0);
    server.on('listening', resolve);
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    await t.test('Verify independent rate limits (no cross-route rate limit pollution)', async () => {
      resetRateLimiters();

      // Route 1 (/api/youtube/download) has maxRequests: 15
      // Route 2 (/api/youtube/search) has maxRequests: 60

      // Let's make 15 requests to /api/youtube/download. They should all succeed.
      for (let i = 0; i < 15; i++) {
        const res = await fetch(`${baseUrl}/api/youtube/download`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
        });
        assert.ok(res.status !== 429, `Download request ${i} should succeed`);
      }

      // The 16th request to /api/youtube/download should be rate limited (429)
      const res429 = await fetch(`${baseUrl}/api/youtube/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
      });
      assert.strictEqual(res429.status, 429, '16th download request should be rate limited');

      // Crucially, searching should NOT be rate limited even though download is rate limited!
      // This is because the rate limiters are isolated.
      const searchRes = await fetch(`${baseUrl}/api/youtube/search?q=test`);
      assert.ok(searchRes.status !== 429, 'Search request must NOT be rate limited by download exhaustions');
    });

    await t.test('Verify rate limiting reset', async () => {
      // With download rate limited, resetting the limiters should allow requests again
      resetRateLimiters();

      const res = await fetch(`${baseUrl}/api/youtube/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
      });
      assert.ok(res.status !== 429, 'Request should succeed after rate limiter reset');
    });

    await t.test('Verify security headers and disabled x-powered-by', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
      assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
      assert.strictEqual(res.headers.get('x-xss-protection'), '1; mode=block');
      assert.strictEqual(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
      assert.strictEqual(res.headers.get('x-powered-by'), null);
    });
  } finally {
    // Close the server
    await new Promise((resolve) => server.close(resolve));
  }
});
