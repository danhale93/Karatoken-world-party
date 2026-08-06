import { NextFunction, Request, RequestHandler, Response } from 'express';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface LimiterRegistry {
  tracker: Map<string, number[]>;
}

const activeLimiters: LimiterRegistry[] = [];

/**
 * Creates a rate limiting middleware.
 * Instantiates the tracker Map inside the middleware factory function to ensure each route
 * gets its own independent tracking store, preventing cross-route interference and scoping bugs.
 */
export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const { windowMs, max, message = 'Too many requests, please try again later' } = options;
  const tracker = new Map<string, number[]>();

  // Periodic cleanup of expired entries to prevent memory exhaustion (CWE-400)
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of tracker.entries()) {
      const active = timestamps.filter(time => now - time < windowMs);
      if (active.length === 0) {
        tracker.delete(ip);
      } else {
        tracker.set(ip, active);
      }
    }
  }, windowMs);

  // Unref the interval so it doesn't block Node process from exiting
  if (interval.unref) {
    interval.unref();
  }

  // Register this tracker for global test cleanup
  activeLimiters.push({ tracker });

  return (req: Request, res: Response, next: NextFunction) => {
    // Avoid manual header parsing to prevent IP spoofing; rely on Express's trust proxy instead
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!tracker.has(clientIp)) {
      tracker.set(clientIp, []);
    }

    let timestamps = tracker.get(clientIp) || [];
    // Filter out timestamps that fall outside the current window
    timestamps = timestamps.filter(time => now - time < windowMs);

    if (timestamps.length >= max) {
      return res.status(429).json({
        ok: false,
        error: message,
      });
    }

    timestamps.push(now);
    tracker.set(clientIp, timestamps);
    next();
  };
}

/**
 * Clears all registered rate limiter tracking maps.
 * Useful for resetting rate limit windows between unit and integration tests.
 */
export function resetAllRateLimiters(): void {
  activeLimiters.forEach(({ tracker }) => {
    tracker.clear();
  });
}
