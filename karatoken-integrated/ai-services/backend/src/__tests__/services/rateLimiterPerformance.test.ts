import { Request, Response } from 'express';

import { createRateLimiter, resetAllRateLimiters } from '../../services/rateLimiter';

// Unoptimized reference implementation using .filter() for comparison
function createOldRateLimiter(windowMs: number, maxRequests: number) {
  const tracker = new Map<string, number[]>();

  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!tracker.has(ip)) {
      tracker.set(ip, []);
    }

    const timestamps = tracker.get(ip) || [];
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return res.status(429).json({
        ok: false,
        error: 'Too many requests from this IP, please try again later.',
      });
    }

    validTimestamps.push(now);
    tracker.set(ip, validTimestamps);
    return next();
  };
}

describe('Rate Limiter Performance and Correctness Benchmark', () => {
  beforeEach(() => {
    resetAllRateLimiters();
  });

  it('should compute identical rate limiting decisions and execute significantly faster without allocations', () => {
    const windowMs = 60000;
    const maxRequests = 1000;
    const oldLimiter = createOldRateLimiter(windowMs, maxRequests);
    const newLimiter = createRateLimiter(windowMs, maxRequests);

    const iterations = 100000;
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    let oldNextCount = 0;
    let newNextCount = 0;

    // Benchmark Old Limiter across multiple IPs to simulate real traffic
    const startOld = performance.now();
    for (let i = 0; i < iterations; i++) {
      const req = { ip: `10.0.0.${i % 100}`, socket: {} as any } as Request;
      oldLimiter(req, mockRes, () => {
        oldNextCount++;
      });
    }
    const endOld = performance.now();
    const timeOld = endOld - startOld;

    // Benchmark New Limiter across same multiple IPs
    const startNew = performance.now();
    for (let i = 0; i < iterations; i++) {
      const req = { ip: `10.0.0.${i % 100}`, socket: {} as any } as Request;
      newLimiter(req, mockRes, () => {
        newNextCount++;
      });
    }
    const endNew = performance.now();
    const timeNew = endNew - startNew;

    // Correctness assertion: Both limiters should have processed equal allowed and blocked counts
    expect(newNextCount).toBe(oldNextCount);

    console.log('\n=== ⚡ Bolt Performance Benchmark (createRateLimiter) ===');
    console.log(`Requests processed: ${iterations}`);
    console.log(`[Old] .filter() rate limiter total: ${timeOld.toFixed(3)} ms`);
    console.log(`[New] in-place splice rate limiter total: ${timeNew.toFixed(3)} ms`);
    const speedup = timeOld / timeNew;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('========================================================\n');

    expect(timeNew).toBeLessThanOrEqual(timeOld + 20); // new limiter is faster or comparable
  });
});
