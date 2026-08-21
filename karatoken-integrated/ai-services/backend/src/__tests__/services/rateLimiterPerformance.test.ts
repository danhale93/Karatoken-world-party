const test = require('node:test');
const assert = require('node:assert');

// 1. Legacy filter-based rate limiter implementation (creates new Array on every request)
function createLegacyFilterRateLimiter(windowMs, maxRequests) {
  const tracker = new Map();

  return (ip, nowMs) => {
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

// 2. Optimized in-place splice rate limiter implementation (zero allocations)
function createOptimizedSpliceRateLimiter(windowMs, maxRequests) {
  const tracker = new Map();

  return (ip, nowMs) => {
    let timestamps = tracker.get(ip);
    if (!timestamps) {
      timestamps = [];
      tracker.set(ip, timestamps);
    }

    // Optimized: in-place index scanning and .splice()
    const cutoff = nowMs - windowMs;
    let expiredCount = 0;
    while (expiredCount < timestamps.length && timestamps[expiredCount] <= cutoff) {
      expiredCount++;
    }

    if (expiredCount > 0) {
      timestamps.splice(0, expiredCount);
    }

    if (timestamps.length >= maxRequests) {
      return false; // rate-limited
    }

    timestamps.push(nowMs);
    return true; // allowed
  };
}

test('Rate Limiter Performance and Correctness Benchmark', () => {
  const windowMs = 60000;
  const maxRequests = 1000;
  const legacyLimiter = createLegacyFilterRateLimiter(windowMs, maxRequests);
  const optimizedLimiter = createOptimizedSpliceRateLimiter(windowMs, maxRequests);

  const testRequestsCount = 100000;
  const testIp = '192.168.1.100';

  // --- BENCHMARK LEGACY IMPLEMENTATION ---
  let timeStamp = 1000000;
  const legacyAllowed = [];
  const startLegacy = performance.now();
  for (let i = 0; i < testRequestsCount; i++) {
    timeStamp += 10; // 10ms per request
    const allowed = legacyLimiter(testIp, timeStamp);
    legacyAllowed.push(allowed);
  }
  const endLegacy = performance.now();
  const timeLegacy = endLegacy - startLegacy;

  // --- BENCHMARK OPTIMIZED IMPLEMENTATION ---
  timeStamp = 1000000;
  const optimizedAllowed = [];
  const startOptimized = performance.now();
  for (let i = 0; i < testRequestsCount; i++) {
    timeStamp += 10; // 10ms per request
    const allowed = optimizedLimiter(testIp, timeStamp);
    optimizedAllowed.push(allowed);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  // --- VERIFY CORRECTNESS ---
  assert.strictEqual(legacyAllowed.length, optimizedAllowed.length, 'Request count should match');
  for (let i = 0; i < legacyAllowed.length; i++) {
    assert.strictEqual(
      optimizedAllowed[i],
      legacyAllowed[i],
      `Rate limiter decision at request ${i} should be identical`
    );
  }

  const speedup = timeLegacy / timeOptimized;

  console.log('\n=== ⚡ Bolt Performance Benchmark (rateLimiter) ===');
  console.log(`Evaluated ${testRequestsCount.toLocaleString()} request evaluations`);
  console.log(`[Old] .filter() legacy duration:     ${timeLegacy.toFixed(3)} ms`);
  console.log(`[New] .splice() in-place duration:   ${timeOptimized.toFixed(3)} ms`);
  console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
  console.log('===================================================\n');

  assert.ok(
    timeOptimized <= timeLegacy + 50,
    'Optimized rate limiter should be faster or comparable to legacy'
  );
});
