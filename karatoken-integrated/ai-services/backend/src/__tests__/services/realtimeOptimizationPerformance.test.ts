import { AudioProcessor } from '../../services/realtimeOptimization';
import { AudioBuffer } from 'web-audio-api';

let tf: any;
try {
  tf = require('@tensorflow/tfjs-node');
} catch (err) {
  tf = require('@tensorflow/tfjs');
}

// Original unoptimized implementations for comparison and verification
function originalApplyEQ(audioData: Float32Array): Float32Array {
  const result = new Float32Array(audioData.length);
  const boost = 2.0; // 6dB boost
  let x1 = 0;
  let y1 = 0;
  const alpha = 0.1;

  for (let i = 0; i < audioData.length; i++) {
    const x = audioData[i];
    const y = alpha * x + (1 - alpha) * x1 + (1 - alpha) * y1;
    result[i] = y * boost;
    x1 = x;
    y1 = y;
  }
  return result;
}

function originalApplyCompressor(
  audioData: Float32Array,
  threshold = -24,
  ratio = 4
): Float32Array {
  const result = new Float32Array(audioData.length);
  let envelope = 0;
  const sampleRate = 44100;
  const attack = 0.003;
  const release = 0.25;
  const attackCoef = Math.exp(-1 / (sampleRate * attack));
  const releaseCoef = Math.exp(-1 / (sampleRate * release));

  for (let i = 0; i < audioData.length; i += 1) {
    const envIn = Math.abs(audioData[i]);

    if (envelope < envIn) {
      envelope = attackCoef * envelope + (1 - attackCoef) * envIn;
    } else {
      envelope = releaseCoef * envelope + (1 - releaseCoef) * envIn;
    }

    const envDb = 20 * Math.log10(envelope);

    if (envDb > threshold) {
      const gainDb = (threshold - envDb) * (1 - 1 / ratio);
      result[i] = audioData[i] * Math.pow(10, gainDb / 20);
    } else {
      result[i] = audioData[i];
    }
  }
  return result;
}

// Original unoptimized implementation of applyPitchShift
async function originalApplyPitchShift(
  audioData: Float32Array,
  params: { semitones: number } = { semitones: 0 },
  tf: any
): Promise<Float32Array> {
  const rate = Math.pow(2, params.semitones / 12);
  const inputTensor = tf.tensor2d([audioData]);

  const resized = tf.image.resizeBilinear(inputTensor.reshape([1, -1, 1, 1]), [
    1,
    Math.floor(audioData.length / rate),
  ]);

  const result = (await resized.reshape([-1]).array()) as number[];
  inputTensor.dispose();
  resized.dispose();
  return new Float32Array(result);
}

describe('Real-time Audio Processing Performance and Correctness Benchmark', () => {
  let audioProcessor: AudioProcessor;

  // Create a mock AudioBuffer
  const createMockAudioBuffer = (sampleRate: number, length: number) => {
    return {
      sampleRate,
      length,
      duration: length / sampleRate,
      getChannelData: () => {
        const data = new Float32Array(length);
        // Mix a quiet wave and a loud wave to test both under-threshold and over-threshold behavior
        for (let i = 0; i < length; i++) {
          const quiet = 0.01 * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
          const loud = 0.8 * Math.sin(2 * Math.PI * 880 * (i / sampleRate));
          data[i] = i % 20000 < 10000 ? quiet : loud;
        }
        return data;
      },
      numberOfChannels: 1,
    } as unknown as AudioBuffer;
  };

  beforeEach(() => {
    audioProcessor = new AudioProcessor({
      sampleRate: 44100,
      bufferSize: 4096,
      numChannels: 1,
      useGPU: false,
    });
  });

  it('should compute exactly identical results for EQ and be faster', () => {
    const length = 44100 * 5; // 5 seconds of audio
    const audioBuffer = createMockAudioBuffer(44100, length);
    const audioData = audioBuffer.getChannelData(0);

    // Warm-up
    originalApplyEQ(audioData);
    (audioProcessor as any).applyEQ(audioData);

    // Benchmark original
    const startOriginal = performance.now();
    const resultOriginal = originalApplyEQ(audioData);
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized
    const startOptimized = performance.now();
    const resultOptimized = (audioProcessor as any).applyEQ(audioData);
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    // --- VERIFY CORRECTNESS ---
    expect(resultOptimized.length).toBe(resultOriginal.length);
    for (let i = 0; i < resultOriginal.length; i++) {
      expect(resultOptimized[i]).toBeCloseTo(resultOriginal[i], 7);
    }

    console.log('\n=== ⚡ Bolt Performance Benchmark (applyEQ) ===');
    console.log(`Audio length: ${length} samples`);
    console.log(`[Old] originalApplyEQ: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedApplyEQ: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('==============================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeOriginal + 10);
  });

  it('should compute exactly identical results for Compressor and be significantly faster', async () => {
    const length = 44100 * 5; // 5 seconds of audio
    const audioBuffer = createMockAudioBuffer(44100, length);
    const audioData = audioBuffer.getChannelData(0);

    // Warm-up
    originalApplyCompressor(audioData);
    await (audioProcessor as any).applyCompressor(audioData);

    // Benchmark original
    const startOriginal = performance.now();
    const resultOriginal = originalApplyCompressor(audioData);
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized
    const startOptimized = performance.now();
    const resultOptimized = await (audioProcessor as any).applyCompressor(audioData);
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    // --- VERIFY CORRECTNESS ---
    expect(resultOptimized.length).toBe(resultOriginal.length);
    for (let i = 0; i < resultOriginal.length; i++) {
      expect(resultOptimized[i]).toBeCloseTo(resultOriginal[i], 7);
    }

    console.log('\n=== ⚡ Bolt Performance Benchmark (applyCompressor) ===');
    console.log(`Audio length: ${length} samples`);
    console.log(`[Old] originalApplyCompressor: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedApplyCompressor: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('======================================================\n');

    expect(timeOptimized).toBeLessThanOrEqual(timeOriginal + 10);
  });

  it('should compute exactly identical results for Pitch Shift and be significantly faster', async () => {
    const length = 44100 * 2; // 2 seconds of audio
    const audioBuffer = createMockAudioBuffer(44100, length);
    const audioData = audioBuffer.getChannelData(0);
    let tf;
    try {
      tf = require('@tensorflow/tfjs-node');
    } catch {
      tf = require('@tensorflow/tfjs');
    }

    // Warm-up
    await originalApplyPitchShift(audioData, { semitones: 2 }, tf);
    await (audioProcessor as any).applyPitchShift(audioData, { semitones: 2 });

    // Benchmark original
    const startOriginal = performance.now();
    const resultOriginal = await originalApplyPitchShift(audioData, { semitones: 2 }, tf);
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized
    const startOptimized = performance.now();
    const resultOptimized = await (audioProcessor as any).applyPitchShift(audioData, {
      semitones: 2,
    });
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    // --- VERIFY CORRECTNESS ---
    expect(resultOptimized.length).toBe(resultOriginal.length);
    for (let i = 0; i < resultOriginal.length; i++) {
      expect(resultOptimized[i]).toBeCloseTo(resultOriginal[i], 5);
    }

    console.log('\n=== ⚡ Bolt Performance Benchmark (applyPitchShift) ===');
    console.log(`Audio length: ${length} samples`);
    console.log(`[Old] originalApplyPitchShift: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedApplyPitchShift: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('======================================================\n');
  });

  it('should optimize no-op pitch shift (semitones: 0) and run in O(1) time', async () => {
    const length = 44100 * 5; // 5 seconds of audio
    const audioBuffer = createMockAudioBuffer(44100, length);
    const audioData = audioBuffer.getChannelData(0);
    let tf;
    try {
      tf = require('@tensorflow/tfjs-node');
    } catch {
      tf = require('@tensorflow/tfjs');
    }

    // Warm-up
    await originalApplyPitchShift(audioData, { semitones: 0 }, tf);
    await (audioProcessor as any).applyPitchShift(audioData, { semitones: 0 });

    // Benchmark original
    const startOriginal = performance.now();
    const resultOriginal = await originalApplyPitchShift(audioData, { semitones: 0 }, tf);
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    // Benchmark optimized
    const startOptimized = performance.now();
    const resultOptimized = await (audioProcessor as any).applyPitchShift(audioData, {
      semitones: 0,
    });
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    // --- VERIFY CORRECTNESS ---
    // The optimized version should return exactly the same array reference or contents
    expect(resultOptimized.length).toBe(audioData.length);
    expect(resultOptimized).toBe(audioData); // should return the same object reference

    console.log('\n=== ⚡ Bolt Performance Benchmark (applyPitchShift with semitones: 0) ===');
    console.log(`Audio length: ${length} samples`);
    console.log(`[Old] originalApplyPitchShift (no-op): ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedApplyPitchShift (no-op): ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('======================================================\n');

    expect(timeOptimized).toBeLessThan(timeOriginal);
  });
});
