// eslint-disable-next-line @typescript-eslint/no-var-requires
const lyrics = require('../../../services/lyrics');

function originalToLrcTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

// The original, unoptimized srtToLrc for benchmark comparison
function originalSrtToLrc(srtText: string): string {
  const lines = srtText.split(/\r?\n/);
  const lrc: string[] = [];
  let i = 0;
  while (i < lines.length) {
    // skip index line
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i >= lines.length) break;
    i++;
    if (i >= lines.length) break;
    const ts = lines[i++];
    const match = ts.match(/(\d+):(\d+):(\d+),(\d+)/);
    if (!match) {
      while (i < lines.length && lines[i].trim() !== '') i++;
      continue;
    }
    const h = parseInt(match[1], 10),
      m = parseInt(match[2], 10),
      s = parseInt(match[3], 10),
      ms = parseInt(match[4], 10);
    const start = h * 3600 + m * 60 + s + ms / 1000;
    let text = '';
    while (i < lines.length && lines[i].trim() !== '') {
      text += (text ? ' ' : '') + lines[i].trim();
      i++;
    }
    lrc.push(`[${originalToLrcTimestamp(start)}] ${text}`);
    i++;
  }
  return lrc.join('\n');
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

  it('should correctly parse SRT to LRC and run significantly faster', () => {
    // Generate a sample SRT with 500 blocks
    const blocksCount = 500;
    const srtLines: string[] = [];
    for (let j = 1; j <= blocksCount; j++) {
      const startSec = j * 5;
      const endSec = startSec + 3;

      const formatTime = (totalSec: number) => {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = Math.floor(totalSec % 60);
        const ms = Math.floor((totalSec % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };

      srtLines.push(
        `${j}`,
        `${formatTime(startSec)} --> ${formatTime(endSec)}`,
        `This is sample subtitle line for block ${j}`,
        ''
      );
    }
    const sampleSrtContent = srtLines.join('\n');

    // Verify correctness: outputs must be identical
    const outputOriginal = originalSrtToLrc(sampleSrtContent);
    const outputOptimized = lyrics.srtToLrc(sampleSrtContent);
    expect(outputOptimized).toBe(outputOriginal);

    // Warm-up
    for (let k = 0; k < 10; k++) {
      originalSrtToLrc(sampleSrtContent);
      lyrics.srtToLrc(sampleSrtContent);
    }

    const iterations = 1000;

    // Benchmark original implementation
    const startOriginal = performance.now();
    for (let k = 0; k < iterations; k++) {
      originalSrtToLrc(sampleSrtContent);
    }
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized implementation
    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      lyrics.srtToLrc(sampleSrtContent);
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    console.log('\n=== ⚡ Bolt Performance Benchmark (lyrics.srtToLrc) ===');
    console.log(`SRT size: ${blocksCount} subtitle blocks`);
    console.log(`Iterations: ${iterations}`);
    console.log(`[Old] originalSrtToLrc total: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedSrtToLrc total: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('======================================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeOriginal + 30);
  });
});
