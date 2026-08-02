import { NextFunction, Request, RequestHandler, Response } from 'express';

// Storing references to all individual rate limit maps for testing cleanup purposes
const allRateLimits: Map<string, number[]>[] = [];

/**
 * Reset all rate limits across all route instances (useful for test environments)
 */
export function resetRateLimits() {
  for (const limits of allRateLimits) {
    limits.clear();
  }
}

/**
 * Dependency-free, in-memory rate limiter middleware factory.
 * NOTE: This is a single-node in-memory store suitable for simple/single-instance deployments,
 * but will fail to enforce limits consistently across horizontally scaled multi-instance environments
 * (where Redis or similar session stores are required).
 */
export function rateLimiter(windowMs: number, maxRequests: number): RequestHandler {
  // Scoped per-route middleware instance to isolate rate limiting budgets
  const rateLimits = new Map<string, number[]>();
  allRateLimits.push(rateLimits);

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const now = Date.now();

    if (!rateLimits.has(ipStr)) {
      rateLimits.set(ipStr, []);
    }

    let timestamps = rateLimits.get(ipStr)!;
    // Filter out expired timestamps
    timestamps = timestamps.filter(time => now - time < windowMs);

    if (timestamps.length >= maxRequests) {
      return res.status(429).json({
        ok: false,
        error: 'Too many requests from this IP, please try again later.',
      });
    }

    timestamps.push(now);
    rateLimits.set(ipStr, timestamps);
    next();
  };
}
