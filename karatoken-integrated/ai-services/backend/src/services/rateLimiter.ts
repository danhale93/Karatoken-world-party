import { NextFunction, Request, RequestHandler, Response } from 'express';

// Keeps track of all created limiter Maps globally so they can be cleared/reset during tests
const activeLimiters: Map<string, number[]>[] = [];

/**
 * Resets all active rate limit trackers.
 * Primarily used in test isolation/cleanup hooks.
 */
export function resetAllRateLimiters(): void {
  activeLimiters.forEach(limiter => limiter.clear());
}

/**
 * Creates an in-memory rate limiting middleware with route tracking isolation.
 * Mitigates CWE-400 (Denial of Service) and protects resource-intensive API routes.
 *
 * @param windowMs Time window in milliseconds
 * @param maxRequests Maximum number of requests allowed in the time window per IP
 */
export function createRateLimiter(windowMs: number, maxRequests: number): RequestHandler {
  // Instantiate the tracker Map inside the middleware factory function so each route gets its own independent tracking store
  const tracker = new Map<string, number[]>();
  activeLimiters.push(tracker);

  return (req: Request, res: Response, next: NextFunction) => {
    // Rely on Express's native trust-proxy req.ip resolver to avoid IP spoofing vulnerabilities
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!tracker.has(ip)) {
      tracker.set(ip, []);
    }

    const timestamps = tracker.get(ip) || [];

    // Filter out timestamps older than the window
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

// Background cleanup interval to prevent unbounded memory growth from stale IP keys (CWE-400)
// Set to clean up every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  activeLimiters.forEach(tracker => {
    for (const [ip, timestamps] of tracker.entries()) {
      // Clean up keys whose timestamps have all expired relative to 1 hour
      const filtered = timestamps.filter(timestamp => now - timestamp < 60 * 60 * 1000);
      if (filtered.length === 0) {
        tracker.delete(ip);
      } else {
        tracker.set(ip, filtered);
      }
    }
  });
}, CLEANUP_INTERVAL_MS);

// Call unref() to prevent the Node.js event loop from staying active during tests or process termination
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}
