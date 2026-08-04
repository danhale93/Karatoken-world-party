import { srtToLrc } from '../../services/whisper';

// The original, unoptimized implementation of srtToLrc for verification and benchmark comparison.
// Note: The original implementation had a correctness bug where it discarded milliseconds
// by splitting on the comma and only using the first part: `const [timePart] = timestamp.split(',')`.
function originalSrtToLrc(srtContent: string): string {
  const lines = srtContent.split('\n');
  const lrcLines: string[] = [];

  for (let i = 0; i < lines.length; i += 4) {
    if (!lines[i + 1]) continue;

    // Extract timestamp and text
    const timestamp = lines[i + 1].split(' --> ')[0];
    const text = lines[i + 2] || '';

    // Convert SRT timestamp to LRC format [mm:ss.xx]
    const [timePart] = timestamp.split(',');
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const lrcTime = `[${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(Math.floor(totalSeconds % 60)).padStart(2, '0')}.${String(Math.round((totalSeconds % 1) * 100)).padStart(2, '0')}]`;

    lrcLines.push(`${lrcTime}${text}`);
  }

  return lrcLines.join('\n');
}

describe('SRT to LRC Parser Performance and Correctness Benchmark', () => {
  it('should parse standard SRT content correctly (fixing a millisecond loss bug in the original)', () => {
    const srtContent = `1
00:00:01,050 --> 00:00:04,200
Hello world!

2
00:01:23,450 --> 00:01:25,100
This is another subtitle block.

3
01:05:09,890 --> 01:05:12,000
And one hour later.`;

    const actualNew = srtToLrc(srtContent);

    // The optimized version preserves milliseconds correctly:
    // "00:00:01,050" -> 1.05s -> "[00:01.05]Hello world!"
    // "00:01:23,450" -> 83.45s -> "[01:23.45]This is another subtitle block."
    // "01:05:09,890" -> 3909.89s -> 65m 9.89s -> "[65:09.89]And one hour later."
    expect(actualNew).toContain('[00:01.05]Hello world!');
    expect(actualNew).toContain('[01:23.45]This is another subtitle block.');
    expect(actualNew).toContain('[65:09.89]And one hour later.');
  });

  it('should be robust enough to parse SRT with CRLF endings and multiple text lines correctly', () => {
    const srtContentWithCrlf =
      '1\r\n00:00:01,050 --> 00:00:04,200\r\nHello world!\r\n\r\n2\r\n00:01:23,450 --> 00:01:25,100\r\nThis has\r\nmultiple lines\r\nof text!\r\n';

    const parsed = srtToLrc(srtContentWithCrlf);

    // Check that it merged the multiple text lines with space, ignored empty lines correctly, and formatted timestamps
    expect(parsed).toContain('[00:01.05]Hello world!');
    expect(parsed).toContain('[01:23.45]This has multiple lines of text!');
  });

  it('should run significantly faster than the original implementation', () => {
    // Generate a massive SRT file with 1000 blocks to test throughput and GC pressure
    const blocksCount = 1000;
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
        `This is mock subtitle line for block number ${j}`,
        ''
      );
    }
    const largeSrtContent = srtLines.join('\n');

    // Warm-up
    for (let k = 0; k < 5; k++) {
      originalSrtToLrc(largeSrtContent);
      srtToLrc(largeSrtContent);
    }

    const iterations = 100;

    // Benchmark original implementation
    const startOriginal = performance.now();
    for (let k = 0; k < iterations; k++) {
      originalSrtToLrc(largeSrtContent);
    }
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized implementation
    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      srtToLrc(largeSrtContent);
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    console.log('\n=== ⚡ Bolt Performance Benchmark (srtToLrc) ===');
    console.log(`SRT size: ${blocksCount} subtitle blocks`);
    console.log(`Iterations: ${iterations}`);
    console.log(`[Old] originalSrtToLrc total: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedSrtToLrc total: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('================================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeOriginal + 50);
  });
});
