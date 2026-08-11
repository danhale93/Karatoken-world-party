import { Request, Response } from 'express';

import { createRateLimiter, resetAllRateLimiters } from '../../services/rateLimiter';

describe('Rate Limiter Service', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    resetAllRateLimiters();
    req = {
      ip: '127.0.0.1',
      socket: {} as any,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow requests below the limit', () => {
    const limit = 3;
    const limiter = createRateLimiter(60000, limit);

    for (let i = 0; i < limit; i++) {
      limiter(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(i + 1);
    }
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should reject requests exceeding the limit with 429 status', () => {
    const limit = 2;
    const limiter = createRateLimiter(60000, limit);

    // First two requests allowed
    limiter(req as Request, res as Response, next);
    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);

    // Third request blocked
    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2); // Still 2
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      ok: false,
      error: 'Too many requests from this IP, please try again later.',
    });
  });

  it('should isolate limits between different routes/limiters', () => {
    const limiterA = createRateLimiter(60000, 1);
    const limiterB = createRateLimiter(60000, 1);

    // Route A request allowed
    limiterA(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Route A request blocked on next call
    const resA = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    limiterA(req as Request, resA, next);
    expect(resA.status).toHaveBeenCalledWith(429);
    expect(next).toHaveBeenCalledTimes(1); // Not called again

    // Route B request still allowed (isolated)
    limiterB(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should allow requests again after the time window expires', () => {
    const limiter = createRateLimiter(60000, 1);

    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Exceeding limit
    const resBlocked = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    limiter(req as Request, resBlocked, next);
    expect(resBlocked.status).toHaveBeenCalledWith(429);

    // Fast forward time by 61 seconds
    jest.advanceTimersByTime(61000);

    // Request should be allowed now
    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  it('should globally reset all rate limiters when resetAllRateLimiters is called', () => {
    const limiter = createRateLimiter(60000, 1);

    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Reset limiters
    resetAllRateLimiters();

    // Request should be allowed immediately
    limiter(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });
});
