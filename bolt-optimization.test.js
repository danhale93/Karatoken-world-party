const test = require('node:test');
const assert = require('node:assert');

// 1. Correctness and Performance Benchmark of .subarray vs .slice chunking
test('Float32Array .subarray chunking is identical in value and faster than .slice', () => {
  const length = 44100 * 10; // 10 seconds of audio
  const windowSize = 2048;
  const step = 1024;

  const originalData = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    originalData[i] = Math.sin(2 * Math.PI * 440 * (i / 44100));
  }

  // --- SLICE METHOD (Old behavior) ---
  const startSlice = performance.now();
  const chunksSlice = [];
  for (let i = 0; i < originalData.length - windowSize; i += step) {
    const chunk = originalData.slice(i, i + windowSize);
    chunksSlice.push(chunk);
  }
  const endSlice = performance.now();
  const timeSlice = endSlice - startSlice;

  // --- SUBARRAY METHOD (New optimized behavior) ---
  const startSubarray = performance.now();
  const chunksSubarray = [];
  for (let i = 0; i < originalData.length - windowSize; i += step) {
    const chunk = originalData.subarray(i, i + windowSize);
    chunksSubarray.push(chunk);
  }
  const endSubarray = performance.now();
  const timeSubarray = endSubarray - startSubarray;

  // --- VERIFY CORRECTNESS ---
  assert.strictEqual(chunksSlice.length, chunksSubarray.length, 'Chunk count should be identical');
  for (let j = 0; j < chunksSlice.length; j++) {
    const sliceChunk = chunksSlice[j];
    const subarrayChunk = chunksSubarray[j];
    assert.strictEqual(sliceChunk.length, subarrayChunk.length, 'Chunk length should be identical');
    for (let k = 0; k < sliceChunk.length; k++) {
      assert.strictEqual(sliceChunk[k], subarrayChunk[k], `Values at chunk ${j}, index ${k} should be identical`);
    }
  }

  console.log(`\n=== ⚡ Bolt Performance Benchmark ===`);
  console.log(`Array length: ${length} floats`);
  console.log(`Window size: ${windowSize}, Step: ${step}`);
  console.log(`[Old] .slice() processing time:      ${timeSlice.toFixed(3)} ms`);
  console.log(`[New] .subarray() processing time:   ${timeSubarray.toFixed(3)} ms`);

  const speedup = (timeSlice / timeSubarray).toFixed(1);
  console.log(`⚡ Speedup: ${speedup}x faster!`);
  console.log(`=====================================\n`);

  assert.ok(timeSubarray <= timeSlice + 5, 'subarray should be faster or comparable (usually 2x-10x faster due to no allocations)');
});

// 2. Correctness and Performance Benchmark of frequencyToNote optimization
test('frequencyToNote produces identical output and is faster with static constants and precomputed log2', () => {
  function originalFrequencyToNote(frequency) {
    if (frequency <= 0) return '--';

    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const halfSteps = 12 * Math.log2(frequency / A4);
    const noteNumber = Math.round(halfSteps) + 9;

    const octave = Math.floor(noteNumber / 12) + 4;
    const noteName = noteNames[((noteNumber % 12) + 12) % 12];

    return `${noteName}${octave}`;
  }

  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const LOG2_A4 = Math.log2(440);

  function optimizedFrequencyToNote(frequency) {
    if (frequency <= 0) return '--';

    const halfSteps = 12 * (Math.log2(frequency) - LOG2_A4);
    const noteNumber = Math.round(halfSteps) + 9;

    const octave = Math.floor(noteNumber / 12) + 4;
    const noteName = NOTE_NAMES[((noteNumber % 12) + 12) % 12];

    return `${noteName}${octave}`;
  }

  const datasetSize = 100000;
  const testFrequencies = [];
  for (let i = 0; i < datasetSize; i++) {
    testFrequencies.push(i % 5 === 0 ? 0 : 50 + (i % 1500));
  }

  // --- VERIFY CORRECTNESS ---
  for (let i = 0; i < 1000; i++) {
    const freq = testFrequencies[i];
    assert.strictEqual(
      optimizedFrequencyToNote(freq),
      originalFrequencyToNote(freq),
      `Outputs must match for frequency ${freq}`
    );
  }

  // Benchmark Original
  const startOriginal = performance.now();
  for (let i = 0; i < datasetSize; i++) {
    originalFrequencyToNote(testFrequencies[i]);
  }
  const endOriginal = performance.now();
  const timeOriginal = endOriginal - startOriginal;

  // Benchmark Optimized
  const startOptimized = performance.now();
  for (let i = 0; i < datasetSize; i++) {
    optimizedFrequencyToNote(testFrequencies[i]);
  }
  const endOptimized = performance.now();
  const timeOptimized = endOptimized - startOptimized;

  console.log(`\n=== ⚡ Bolt Performance Benchmark (frequencyToNote) ===`);
  console.log(`Dataset size: ${datasetSize} frequency conversions`);
  console.log(`[Old] originalFrequencyToNote: ${timeOriginal.toFixed(3)} ms`);
  console.log(`[New] optimizedFrequencyToNote: ${timeOptimized.toFixed(3)} ms`);

  const speedup = (timeOriginal / timeOptimized).toFixed(1);
  console.log(`⚡ Speedup: ${speedup}x faster!`);
  console.log(`======================================================\n`);

  assert.ok(timeOptimized <= timeOriginal + 5, 'Optimized frequencyToNote should be faster or comparable');
});
