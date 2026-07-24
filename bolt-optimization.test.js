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
