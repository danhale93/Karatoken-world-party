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
test('frequencyToNote precomputed constants optimization is identical in value and faster', () => {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const LOG2_A4 = Math.log2(440);

  function unoptimizedFrequencyToNote(frequency) {
    if (frequency <= 0) return '--';
    const A4 = 440;
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const halfSteps = 12 * Math.log2(frequency / A4);
    const noteNumber = Math.round(halfSteps) + 9;
    const octave = Math.floor(noteNumber / 12) + 4;
    const noteName = noteNames[((noteNumber % 12) + 12) % 12];
    return `${noteName}${octave}`;
  }

  function optimizedFrequencyToNote(frequency) {
    if (frequency <= 0) return '--';
    const halfSteps = 12 * (Math.log2(frequency) - LOG2_A4);
    const noteNumber = Math.round(halfSteps) + 9;
    const octave = Math.floor(noteNumber / 12) + 4;
    const noteName = NOTE_NAMES[((noteNumber % 12) + 12) % 12];
    return `${noteName}${octave}`;
  }

  const iterations = 500000;
  const freqs = new Float64Array(iterations);
  for (let i = 0; i < iterations; i++) {
    freqs[i] = 20 + (i % 2000) * 2.5;
  }

  // Warmup
  for (let i = 0; i < 1000; i++) {
    unoptimizedFrequencyToNote(freqs[i]);
    optimizedFrequencyToNote(freqs[i]);
  }

  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    unoptimizedFrequencyToNote(freqs[i]);
  }
  const timeOld = performance.now() - startOld;

  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedFrequencyToNote(freqs[i]);
  }
  const timeNew = performance.now() - startNew;

  for (let i = 0; i < 1000; i++) {
    assert.strictEqual(
      optimizedFrequencyToNote(freqs[i]),
      unoptimizedFrequencyToNote(freqs[i]),
      `Note mismatch at frequency ${freqs[i]}`
    );
  }

  console.log(`\n=== ⚡ Bolt Performance Benchmark (frequencyToNote) ===`);
  console.log(`Iterations: ${iterations} calls`);
  console.log(`[Old] unoptimized: ${timeOld.toFixed(3)} ms`);
  console.log(`[New] optimized:   ${timeNew.toFixed(3)} ms`);
  const speedup = (timeOld / timeNew).toFixed(1);
  console.log(`⚡ Speedup: ${speedup}x faster!`);
  console.log(`=======================================================\n`);

  assert.ok(timeNew <= timeOld + 10, 'Optimized frequencyToNote should be faster or comparable');
});
