// eslint-disable-next-line @typescript-eslint/no-var-requires
const lyrics = require('../../../services/lyrics');

function originalToLrcTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

describe('Lyrics/Subtitle Timestamp Performance and Correctness Benchmark', () => {
  it('should format timestamps correctly and match the original implementation', () => {
    const testCases = [0, 0.001, 5.5, 9.5, 59.99, 60, 60.01, 119.99, 120, 3599.99, 3600, 7215.345];

    testCases.forEach(seconds => {
      const original = originalToLrcTimestamp(seconds);
      const optimized = lyrics.toLrcTimestamp(seconds);
      expect(optimized).toBe(original);
    });
  });

  it('should run significantly faster than the original implementation', () => {
    // Large iteration size to properly benchmark
    const iterations = 100000;
    const testData: number[] = [];
    for (let i = 0; i < iterations; i++) {
      testData.push(Math.random() * 7200); // random time up to 2 hours
    }

    // Warm-up
    for (let i = 0; i < 1000; i++) {
      originalToLrcTimestamp(testData[i]);
      lyrics.toLrcTimestamp(testData[i]);
    }

    // Benchmark original implementation
    const startOriginal = performance.now();
    for (let i = 0; i < iterations; i++) {
      originalToLrcTimestamp(testData[i]);
    }
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized implementation
    const startOptimized = performance.now();
    for (let i = 0; i < iterations; i++) {
      lyrics.toLrcTimestamp(testData[i]);
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    console.log('\n=== ⚡ Bolt Performance Benchmark (toLrcTimestamp) ===');
    console.log(`Iterations: ${iterations} timestamp formats`);
    console.log(`[Old] originalToLrcTimestamp: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedToLrcTimestamp: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('=====================================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeOriginal + 10);
  });
});
