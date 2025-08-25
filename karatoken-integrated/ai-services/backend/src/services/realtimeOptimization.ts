// Import TensorFlow.js with dynamic import to handle Node.js vs browser environments
let tf: any;
if (typeof window === 'undefined') {
  tf = require('@tensorflow/tfjs-node');
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
    if (this.config.useGPU) {
      await tf.setBackend('tensorflow');
      await tf.ready();
    } else {
      await tf.setBackend('cpu');
    }
  }

  async process(audioBuffer: AudioBuffer, options: ProcessOptions = {}): Promise<Float32Array[]> {
    const { onProgress, chunkSize = this.config.bufferSize, effects = [] } = options;
    const result: Float32Array[] = [];

    // Process each channel separately
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const processedChannel = new Float32Array(channelData.length);

      // Process in chunks
      for (let i = 0; i < channelData.length; i += chunkSize) {
        const chunk = channelData.slice(i, i + chunkSize);
        let processedChunk = new Float32Array(chunk);

        // Apply effects in sequence
        for (const effect of effects) {
          processedChunk = await this.applyEffect(processedChunk, effect);
        }

        // Copy processed chunk to result
        processedChannel.set(processedChunk, i);

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

    // Simple resampling using TensorFlow
    const resized = tf.image.resizeBilinear(inputTensor.reshape([1, -1, 1, 1]), [
      1,
      Math.floor(audioData.length / rate),
      1,
      1,
    ]);

    const result = (await resized.reshape([-1]).array()) as number[];
    inputTensor.dispose();
    resized.dispose();
    return new Float32Array(result);
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
    const delaySamples = Math.floor(this.sampleRate * seconds);
    const wet = new Float32Array(audioData.length + delaySamples);
    const dry = new Float32Array(wet.length);

    // Copy dry signal
    for (let i = 0; i < audioData.length; i += 1) {
      dry[i] = audioData[i];
    }

    // Apply reverb
    for (let i = 0; i < audioData.length; i += 1) {
      wet[i] = audioData[i];
      if (i >= delaySamples) {
        wet[i] += wet[i - delaySamples] * decay;
      }
    }

    // Mix wet and dry signals
    const result = new Float32Array(audioData.length);
    for (let i = 0; i < result.length; i += 1) {
      result[i] = dry[i] * 0.7 + wet[i] * 0.3; // 70% dry, 30% wet
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

    for (let i = 0; i < audioData.length; i++) {
      const x = audioData[i];
      const y = alpha * x + (1 - alpha) * x1 + (1 - alpha) * y1;
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
}
