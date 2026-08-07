// Import TensorFlow.js with dynamic import to handle Node.js vs browser environments
let tf: any;
if (typeof window === 'undefined') {
  try {
    tf = require('@tensorflow/tfjs-node');
  } catch (err) {
    // Fallback to pure-JS @tensorflow/tfjs if the native module cannot be loaded
    tf = require('@tensorflow/tfjs');
  }
} else {
  tf = require('@tensorflow/tfjs');
}

// Type declarations for Web Audio API
declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}

// Remove duplicate OfflineAudioContext
// eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-unused-vars
interface OfflineAudioContext {}

// Workaround for no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _unused = 0;

interface AudioBuffer {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
  copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel?: number): void;
  copyToChannel(source: Float32Array, channelNumber: number, startInChannel?: number): void;
}

interface AudioContext {
  sampleRate: number;
  createBufferSource(): AudioBufferSourceNode;
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer;
  createAnalyser(): AnalyserNode;
  close(): Promise<void>;
}

interface OfflineAudioContext extends AudioContext {
  startRendering(): Promise<AudioBuffer>;
}

interface AudioNode {
  connect(destinationNode: AudioNode, output?: number, input?: number): void;
  connect(destinationParam: AudioParam, output?: number): void;
  disconnect(): void;
}

interface AudioBufferSourceNode extends AudioNode {
  buffer: AudioBuffer | null;
  start(when?: number, offset?: number, duration?: number): void;
  stop(when?: number): void;
}

interface AnalyserNode extends AudioNode {
  fftSize: number;
  frequencyBinCount: number;
  getFloatFrequencyData(array: Float32Array): void;
}

interface AudioProcessorConfig {
  sampleRate: number;
  bufferSize: number;
  numChannels: number;
  useGPU: boolean;
}

export interface AudioEffect {
  type: 'pitchShift' | 'reverb' | 'eq' | 'compressor';
  value: number;
}

export interface ProcessOptions {
  onProgress?: (progress: number) => void;
  chunkSize?: number;
  effects?: AudioEffect[];
}

export class AudioProcessor {
  private config: AudioProcessorConfig;

  constructor(config: Partial<AudioProcessorConfig> = {}) {
    this.config = {
      sampleRate: config.sampleRate || 44100,
      bufferSize: config.bufferSize || 4096,
      numChannels: config.numChannels || 1,
      useGPU: config.useGPU !== undefined ? config.useGPU : true,
    };

    // Initialize TensorFlow.js backend
    this.initializeBackend();
  }

  private async initializeBackend(): Promise<void> {
    try {
      if (this.config.useGPU && tf.findBackend('tensorflow')) {
        await tf.setBackend('tensorflow');
        await tf.ready();
      } else {
        await tf.setBackend('cpu');
      }
    } catch (e) {
      console.warn('Failed to initialize TF backend tensorflow, falling back to cpu:', e);
      try {
        await tf.setBackend('cpu');
      } catch (_) {
        // Fallback already attempted, ignore subsequent error
      }
    }
  }

  async process(audioBuffer: AudioBuffer, options: ProcessOptions = {}): Promise<Float32Array[]> {
    if (audioBuffer.length === 0) {
      return [];
    }

    const { onProgress, chunkSize = this.config.bufferSize, effects = [] } = options;
    const result: Float32Array[] = [];

    // Process each channel separately
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const processedChannel = new Float32Array(channelData.length);

      // Process in chunks
      for (let i = 0; i < channelData.length; i += chunkSize) {
        // ⚡ Bolt Optimization: Use .subarray() to create a zero-allocation view of the chunk
        const chunk = channelData.subarray(i, i + chunkSize);
        // Create an independent Float32Array copy to satisfy TypeScript types and protect against tfjs buffer-sharing issues
        const processedChunk: Float32Array = new Float32Array(chunk.length);
        processedChunk.set(chunk);

        // Apply effects in sequence
        let currentChunk: Float32Array = processedChunk;
        for (const effect of effects) {
          currentChunk = await this.applyEffect(currentChunk, effect);
        }

        // Copy processed chunk to result
        processedChannel.set(currentChunk, i);

        // Report progress
        if (onProgress) {
          const progress = Math.min(1, (i + chunkSize) / channelData.length);
          onProgress(progress);
        }
      }

      result.push(processedChannel);
    }

    return result;
  }

  private async applyEffect(audioData: Float32Array, effect: AudioEffect): Promise<Float32Array> {
    switch (effect.type) {
      case 'pitchShift': {
        const params =
          typeof effect.value === 'number'
            ? { semitones: effect.value }
            : (effect.value as { semitones: number });
        return this.applyPitchShift(audioData, params);
      }
      case 'reverb': {
        const params = effect.value as {
          decay?: number;
          seconds?: number;
          reverse?: boolean;
        };
        return this.applyReverb(audioData, params);
      }
      case 'eq': {
        const params = effect.value as { frequency?: number };
        return this.applyEQ(audioData, params);
      }
      case 'compressor': {
        const params = effect.value as {
          threshold?: number;
          ratio?: number;
          attack?: number;
          release?: number;
        };
        return this.applyCompressor(audioData, params);
      }
      default: {
        console.warn(`Unknown effect type: ${effect.type}`);
        return audioData;
      }
    }
  }

  private sampleRate = 44100; // Default sample rate, can be set via constructor

  private async applyPitchShift(
    audioData: Float32Array,
    params: { semitones: number } = { semitones: 0 }
  ): Promise<Float32Array> {
    const rate = Math.pow(2, params.semitones / 12);
    const inputTensor = tf.tensor2d([audioData]);

    // Simple resampling using TensorFlow (size parameter must be 2D)
    const resized = tf.image.resizeBilinear(inputTensor.reshape([1, -1, 1, 1]), [
      1,
      Math.floor(audioData.length / rate),
    ]);

    // ⚡ Bolt Optimization: Replace slow .array() serialization with direct, high-performance .data() binary buffer transfer.
    // This completely bypasses standard JS Array allocation and string/number parsing overhead.
    const resultData = await resized.reshape([-1]).data();
    const result = resultData instanceof Float32Array ? resultData : new Float32Array(resultData);
    inputTensor.dispose();
    resized.dispose();
    return result;
  }

  private async applyReverb(
    audioData: Float32Array,
    params: {
      decay?: number;
      seconds?: number;
      reverse?: boolean;
    } = {}
  ): Promise<Float32Array> {
    const decay = Math.max(0, Math.min(1, params.decay || 0.5));
    const seconds = Math.max(0.1, Math.min(10, params.seconds || 2));
    const reverse = !!params.reverse;

    // Simple reverb using delay lines
    // ⚡ Bolt Optimization: Allocate wet output matching the exact input audioData length
    // since the extra samples are never used when mixing. This saves massive memory allocations.
    const delaySamples = Math.floor(this.sampleRate * seconds);
    const wet = new Float32Array(audioData.length);

    // ⚡ Bolt Optimization: Use high-performance native typed array .set() method
    // which operates on native C++ memory level (like memcpy), rather than slow JS loop copying.
    wet.set(audioData);

    // ⚡ Bolt Optimization: Start the loop at delaySamples. This completely avoids branch/conditional
    // checks "if (i >= delaySamples)" inside the processing loop, speeding up execution.
    for (let i = delaySamples; i < audioData.length; i += 1) {
      wet[i] += wet[i - delaySamples] * decay;
    }

    // Mix wet and dry signals
    // ⚡ Bolt Optimization: Access audioData directly as the dry signal.
    // This avoids allocating a second "dry" Float32Array altogether, saving substantial memory.
    const result = new Float32Array(audioData.length);
    for (let i = 0; i < result.length; i += 1) {
      result[i] = audioData[i] * 0.7 + wet[i] * 0.3; // 70% dry, 30% wet
    }

    if (reverse) {
      result.reverse();
    }

    return result;
  }

  private applyEQ(audioData: Float32Array, params: { frequency?: number } = {}): Float32Array {
    // Frequency parameter is kept for future use in more advanced EQ implementation
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _frequency = params.frequency || 1000; // Hz
    const result = new Float32Array(audioData.length);
    const boost = 2.0; // 6dB boost

    // Simple IIR filter implementation
    let x1 = 0;
    let y1 = 0;
    const alpha = 0.1; // Smoothing factor
    // ⚡ Bolt Optimization: Precompute (1 - alpha) outside the loop to avoid subtraction and optimize multiplications
    const beta = 1 - alpha;

    for (let i = 0; i < audioData.length; i++) {
      const x = audioData[i];
      // ⚡ Bolt Optimization: Simplify floating point arithmetic to reduce arithmetic instructions inside the hot loop
      const y = alpha * x + beta * (x1 + y1);
      result[i] = y * boost;
      x1 = x;
      y1 = y;
    }

    return result;
  }

  private async applyCompressor(
    audioData: Float32Array,
    params: {
      threshold?: number;
      ratio?: number;
      attack?: number;
      release?: number;
    } = {}
  ): Promise<Float32Array> {
    const threshold = params.threshold || -24; // dB
    const ratio = params.ratio || 4;
    const attack = params.attack || 0.003; // seconds
    const release = params.release || 0.25; // seconds

    // Simple compression algorithm
    const result = new Float32Array(audioData.length);
    let envelope = 0;
    const attackCoef = Math.exp(-1 / (this.sampleRate * attack));
    const releaseCoef = Math.exp(-1 / (this.sampleRate * release));

    // ⚡ Bolt Optimization: Precompute the threshold amplitude in linear scale outside the loop.
    // By checking if envelope > thresholdEnv, we can completely bypass heavy transcendental
    // calculations (Math.log10 and Math.pow) for all non-triggering samples.
    const thresholdEnv = Math.pow(10, threshold / 20);
    // ⚡ Bolt Optimization: Precompute the ratio reduction factor outside the loop
    const factor = 1 - 1 / ratio;

    for (let i = 0; i < audioData.length; i += 1) {
      const envIn = Math.abs(audioData[i]);

      if (envelope < envIn) {
        envelope = attackCoef * envelope + (1 - attackCoef) * envIn;
      } else {
        envelope = releaseCoef * envelope + (1 - releaseCoef) * envIn;
      }

      // ⚡ Bolt Optimization: Avoid expensive Math.log10 and Math.pow(10, ...) calculations.
      // By mathematically simplifying the gain formula to Math.pow(thresholdEnv / envelope, factor),
      // we reduce two transcendental function calls per triggering sample to exactly one Math.pow call.
      if (envelope > thresholdEnv) {
        result[i] = audioData[i] * Math.pow(thresholdEnv / envelope, factor);
      } else {
        result[i] = audioData[i];
      }
    }

    return result;
  }
}
