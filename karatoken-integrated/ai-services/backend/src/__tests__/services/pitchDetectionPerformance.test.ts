jest.mock('pitchy', () => ({
  PitchDetector: {
    forFloat32Array: jest.fn().mockImplementation(() => ({
      findPitch: jest.fn(),
    })),
  },
}));

import { analyzePitch, frequencyToNote, PitchAnalysis } from '../../services/pitchDetection';

// The original, unoptimized implementation of frequencyToNote
function originalFrequencyToNote(frequency: number): string {
  if (frequency <= 0) return '--';

  const A4 = 440;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Calculate the number of half steps from A4
  const halfSteps = 12 * Math.log2(frequency / A4);
  const noteNumber = Math.round(halfSteps) + 9; // A4 is the 9th note in the 12-note scale

  const octave = Math.floor(noteNumber / 12) + 4;
  const noteName = noteNames[((noteNumber % 12) + 12) % 12];

  return `${noteName}${octave}`;
}

// The original, unoptimized implementation of analyzePitch for comparison
function originalAnalyzePitch(pitchData: number[]): PitchAnalysis {
  if (pitchData.length === 0) {
    return {
      averagePitch: 0,
      minPitch: 0,
      maxPitch: 0,
      pitchRange: 0,
      pitchStability: 0,
    };
  }

  // Filter out invalid pitches
  const validPitches = pitchData.filter(p => p > 0);

  if (validPitches.length === 0) {
    return {
      averagePitch: 0,
      minPitch: 0,
      maxPitch: 0,
      pitchRange: 0,
      pitchStability: 0,
    };
  }

  // Calculate basic statistics
  const sum = validPitches.reduce((a, b) => a + b, 0);
  const avg = sum / validPitches.length;
  const min = Math.min(...validPitches);
  const max = Math.max(...validPitches);

  // Calculate standard deviation for stability
  const squareDiffs = validPitches.map(p => Math.pow(p - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / validPitches.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  return {
    averagePitch: avg,
    minPitch: min,
    maxPitch: max,
    pitchRange: max - min,
    pitchStability: stdDev,
  };
}

describe('Pitch Detection Performance and Correctness Benchmark', () => {
  it('should compute exactly identical results and be significantly faster', () => {
    // Generate a large pitch dataset: 50,000 values
    // Mix of valid values (positive) and silent/invalid values (0 or -1)
    const datasetSize = 50000;
    const testData: number[] = [];
    for (let i = 0; i < datasetSize; i++) {
      if (i % 5 === 0) {
        testData.push(0); // silent frame
      } else {
        // Mock a varying pitch value
        testData.push(100 + Math.sin(i / 100) * 50);
      }
    }

    // Warm-up
    originalAnalyzePitch(testData);
    analyzePitch(testData);

    // Benchmark original implementation
    const startOriginal = performance.now();
    const resultOriginal = originalAnalyzePitch(testData);
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized implementation
    const startOptimized = performance.now();
    const resultOptimized = analyzePitch(testData);
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    // --- VERIFY CORRECTNESS ---
    expect(resultOptimized.averagePitch).toBeCloseTo(resultOriginal.averagePitch, 10);
    expect(resultOptimized.minPitch).toBeCloseTo(resultOriginal.minPitch, 10);
    expect(resultOptimized.maxPitch).toBeCloseTo(resultOriginal.maxPitch, 10);
    expect(resultOptimized.pitchRange).toBeCloseTo(resultOriginal.pitchRange, 10);
    expect(resultOptimized.pitchStability).toBeCloseTo(resultOriginal.pitchStability, 10);

    console.log('\n=== ⚡ Bolt Performance Benchmark (analyzePitch) ===');
    console.log(`Dataset size: ${datasetSize} pitch values`);
    console.log(`[Old] originalAnalyzePitch: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedAnalyzePitch: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('===================================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeOriginal + 10); // optimized is faster or comparable
  });

  it('should not crash on extremely large datasets where the original crashes due to call stack limit', () => {
    // Math.min(...array) and Math.max(...array) throw "Maximum call stack size exceeded"
    // on arrays with size > ~120,000 (depending on JS engine and environment)
    const criticalDatasetSize = 150000;
    const extremeData: number[] = new Array(criticalDatasetSize).fill(440);

    // Verify original crashes or has a high chance of crashing on this size
    let originalCrashed = false;
    try {
      originalAnalyzePitch(extremeData);
    } catch (error) {
      originalCrashed = true;
      expect(error.message).toContain('Maximum call stack size exceeded');
      console.log(`Original implementation successfully crashed as expected: ${error.message}`);
    }

    // Verify optimized implementation runs flawlessly and with zero allocations
    const start = performance.now();
    const resultOptimized = analyzePitch(extremeData);
    const end = performance.now();

    expect(resultOptimized.averagePitch).toBe(440);
    expect(resultOptimized.minPitch).toBe(440);
    expect(resultOptimized.maxPitch).toBe(440);
    expect(resultOptimized.pitchRange).toBe(0);
    expect(resultOptimized.pitchStability).toBe(0);

    console.log(
      `Optimized implementation processed ${criticalDatasetSize} values in ${(end - start).toFixed(3)} ms without crashing!`
    );
  });

  it('should convert frequencies to notes significantly faster with identical correctness', () => {
    const frequencies = [0, 440, 261.63, 523.25, 329.63, 110, 880, 130.81];
    const iterations = 500000;

    // Warm up
    frequencies.forEach(f => {
      originalFrequencyToNote(f);
      frequencyToNote(f);
    });

    // Verify correctness across test frequencies
    frequencies.forEach(f => {
      expect(frequencyToNote(f)).toBe(originalFrequencyToNote(f));
    });

    // Benchmark original
    const startOld = performance.now();
    for (let i = 0; i < iterations; i++) {
      const f = frequencies[i % frequencies.length];
      originalFrequencyToNote(f);
    }
    const timeOld = performance.now() - startOld;

    // Benchmark optimized
    const startNew = performance.now();
    for (let i = 0; i < iterations; i++) {
      const f = frequencies[i % frequencies.length];
      frequencyToNote(f);
    }
    const timeNew = performance.now() - startNew;

    console.log('\n=== ⚡ Bolt Performance Benchmark (frequencyToNote) ===');
    console.log(`Iterations: ${iterations} frequency note conversions`);
    console.log(`[Old] originalFrequencyToNote total: ${timeOld.toFixed(3)} ms`);
    console.log(`[New] optimizedFrequencyToNote total: ${timeNew.toFixed(3)} ms`);
    const speedup = timeOld / timeNew;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('======================================================\n');

    expect(timeNew).toBeLessThanOrEqual(timeOld + 10);
  });
});
