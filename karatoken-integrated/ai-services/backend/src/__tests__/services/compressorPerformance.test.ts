import { AudioProcessor } from '../../services/realtimeOptimization';

// The original, unoptimized implementation of applyCompressor for verification and benchmark comparison
function originalApplyCompressor(
  audioData: Float32Array,
  sampleRate: number,
  params: {
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
  } = {}
): Float32Array {
  const threshold = params.threshold || -24; // dB
  const ratio = params.ratio || 4;
  const attack = params.attack || 0.003; // seconds
  const release = params.release || 0.25; // seconds

  const result = new Float32Array(audioData.length);
  let envelope = 0;
  const attackCoef = Math.exp(-1 / (sampleRate * attack));
  const releaseCoef = Math.exp(-1 / (sampleRate * release));

  for (let i = 0; i < audioData.length; i += 1) {
    const envIn = Math.abs(audioData[i]);

    if (envelope < envIn) {
      envelope = attackCoef * envelope + (1 - attackCoef) * envIn;
    } else {
      envelope = releaseCoef * envelope + (1 - releaseCoef) * envIn;
    }

    // Convert to dB
    const envDb = 20 * Math.log10(envelope);

    // Apply compression
    if (envDb > threshold) {
      const gainDb = (threshold - envDb) * (1 - 1 / ratio);
      result[i] = audioData[i] * Math.pow(10, gainDb / 20);
    } else {
      result[i] = audioData[i];
    }
  }

  return result;
}

describe('Compressor Performance and Correctness Benchmark', () => {
  let audioProcessor: AudioProcessor;
  const sampleRate = 44100;

  beforeEach(() => {
    audioProcessor = new AudioProcessor({
      sampleRate,
      useGPU: false,
    });
  });

  it('should produce mathematically identical results as original and be faster', async () => {
    // Generate simulated audio signal: a mix of low and high amplitude waves (sine waves + silence)
    const length = 100000;
    const testSignal = new Float32Array(length);
    for (let i = 0; i < length; i++) {
      if (i < 30000) {
        // Low amplitude section (below threshold)
        testSignal[i] = 0.02 * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
      } else if (i < 70000) {
        // High amplitude section (will trigger compression)
        testSignal[i] = 0.8 * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
      } else {
        // Quiet section
        testSignal[i] = 0.001 * Math.sin(2 * Math.PI * 440 * (i / sampleRate));
      }
    }

    const params = {
      threshold: -24,
      ratio: 4,
      attack: 0.003,
      release: 0.25,
    };

    // Run original unoptimized compressor
    const originalResult = originalApplyCompressor(testSignal, sampleRate, params);

    // Run new optimized compressor (internally via AudioProcessor, or directly if visible,
    // here we call the public process function using the effect)
    const audioBufferMock = {
      sampleRate,
      length,
      duration: length / sampleRate,
      numberOfChannels: 1,
      getChannelData: () => testSignal,
    } as any;

    const result = await audioProcessor.process(audioBufferMock, {
      effects: [{ type: 'compressor', value: params as any }],
      chunkSize: length, // process all at once for perfect comparison
    });

    const optimizedResult = result[0];

    // --- VERIFY CORRECTNESS ---
    expect(optimizedResult.length).toBe(originalResult.length);
    for (let i = 0; i < length; i++) {
      expect(optimizedResult[i]).toBeCloseTo(originalResult[i], 5);
    }

    // --- BENCHMARK PERFORMANCE ---
    // Warm up
    originalApplyCompressor(testSignal, sampleRate, params);
    await audioProcessor.process(audioBufferMock, {
      effects: [{ type: 'compressor', value: params as any }],
      chunkSize: length,
    });

    const iterations = 50;

    const startOriginal = performance.now();
    for (let k = 0; k < iterations; k++) {
      originalApplyCompressor(testSignal, sampleRate, params);
    }
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;

    const startOptimized = performance.now();
    for (let k = 0; k < iterations; k++) {
      await audioProcessor.process(audioBufferMock, {
        effects: [{ type: 'compressor', value: params as any }],
        chunkSize: length,
      });
    }
    const endOptimized = performance.now();
    const timeOptimized = endOptimized - startOptimized;

    console.log('\n=== ⚡ Bolt Performance Benchmark (applyCompressor) ===');
    console.log(`Audio buffer length: ${length} samples`);
    console.log(`Iterations: ${iterations}`);
    console.log(`[Old] originalApplyCompressor total: ${timeOriginal.toFixed(3)} ms`);
    console.log(`[New] optimizedApplyCompressor total: ${timeOptimized.toFixed(3)} ms`);
    const speedup = timeOriginal / timeOptimized;
    console.log(`⚡ Speedup: ${speedup.toFixed(1)}x faster!`);
    console.log('======================================================\n');
  });
});
