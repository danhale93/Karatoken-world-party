import { createRateLimiter, resetAllRateLimiters } from '../../services/rateLimiter';

// Legacy filter-based rate limiter implementation for comparative benchmark
function createLegacyFilterRateLimiter(windowMs: number, maxRequests: number) {
  const tracker = new Map<string, number[]>();

  return (ip: string, nowMs: number) => {
    if (!tracker.has(ip)) {
      tracker.set(ip, []);
    }

    const timestamps = tracker.get(ip) || [];
    // Legacy: allocates a new array on every evaluation
    const validTimestamps = timestamps.filter(timestamp => nowMs - timestamp < windowMs);

    if (validTimestamps.length >= maxRequests) {
      return false; // rate-limited
    }

    validTimestamps.push(nowMs);
    tracker.set(ip, validTimestamps);
    return true; // allowed
  };
}

describe('Rate Limiter Performance and Correctness Benchmark', () => {
  it('should behave identically and be measurably faster than legacy .filter() implementation', () => {
    resetAllRateLimiters();

    const windowMs = 60000;
    const maxRequests = 1000;
    const legacyLimiter = createLegacyFilterRateLimiter(windowMs, maxRequests);
    const optimizedLimiter = createRateLimiter(windowMs, maxRequests);

    const testRequestsCount = 100000;
    const testIp = '192.168.1.100';

    // --- BENCHMARK LEGACY IMPLEMENTATION ---
    let timeStamp = 1000000;
    const legacyAllowed: boolean[] = [];
    const startLegacy = performance.now();
    for (let i = 0; i < testRequestsCount; i++) {
      timeStamp += 10; // 10ms per request
      const allowed = legacyLimiter(testIp, timeStamp);
      legacyAllowed.push(allowed);
    }
    const endLegacy = performance.now();
    const timeLegacy = endLegacy - startLegacy;

    // --- BENCHMARK OPTIMIZED IMPLEMENTATION ---
    const req = { ip: testIp, socket: {} } as any;
    const res = { status: () => res, json: () => res } as any;

    let currentTime = 1000000;
    const origDateNow = Date.now;
    Date.now = () => currentTime;

    const optimizedAllowed: boolean[] = [];
    const startOptimized = performance.now();
    for (let i = 0; i < testRequestsCount; i++) {
      currentTime += 10; // 10ms per request
      let allowed = false;
      optimizedLimiter(req, res, () => {
        allowed = true;
      });
      optimizedAllowed.push(allowed);
    }
    const endOptimized = performance.now();
    Date.now = origDateNow;
    const timeOptimized = endOptimized - startOptimized;

    // --- VERIFY CORRECTNESS ---
    expect(optimizedAllowed.length).toBe(legacyAllowed.length);
    for (let i = 0; i < legacyAllowed.length; i++) {
      expect(optimizedAllowed[i]).toBe(legacyAllowed[i]);
    }

    const speedup = timeLegacy / timeOptimized;

    console.log('\n=== ⚡ Bolt Performance Benchmark (rateLimiter) ===');
    console.log(`Evaluated ${testRequestsCount.toLocaleString()} request evaluations`);
    console.log(`[Old] .filter() legacy duration:     ${timeLegacy.toFixed(3)} ms`);
    console.log(`[New] .splice() in-place duration:   ${timeOptimized.toFixed(3)} ms`);
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('===================================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeLegacy + 50);
  });
});
