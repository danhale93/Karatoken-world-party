// Type definitions for Web Audio API
declare module 'web-audio-api' {
  export class AudioContext {
    sampleRate: number;
    createBufferSource(): AudioBufferSourceNode;
    createBuffer(
      numberOfChannels: number,
      length: number,
      sampleRate: number
    ): AudioBuffer;
    createAnalyser(): AnalyserNode;
    createGain(): GainNode;
    createBiquadFilter(): BiquadFilterNode;
    createConvolver(): ConvolverNode;
    createDelay(maxDelayTime?: number): DelayNode;
    destination: AudioDestinationNode;
    decodeAudioData(
      audioData: ArrayBuffer,
      successCallback: (decodedData: AudioBuffer) => void,
      errorCallback?: (error: DOMException) => void
    ): Promise<AudioBuffer>;
    close(): Promise<void>;
  }

  export class OfflineAudioContext extends AudioContext {
    constructor(
      numberOfChannels: number,
      length: number,
      sampleRate: number
    );
    startRendering(): Promise<AudioBuffer>;
  }

  export interface AudioBuffer {
    sampleRate: number;
    length: number;
    duration: number;
    numberOfChannels: number;
    getChannelData(channel: number): Float32Array;
    copyFromChannel(
      destination: Float32Array,
      channelNumber: number,
      startInChannel?: number
    ): void;
    copyToChannel(
      source: Float32Array,
      channelNumber: number,
      startInChannel?: number
    ): void;
  }

  export interface AudioNode {
    connect(destinationNode: AudioNode, output?: number, input?: number): void;
    connect(destinationParam: AudioParam, output?: number): void;
    disconnect(): void;
    disconnect(output: number): void;
    disconnect(destinationNode: AudioNode): void;
    disconnect(destinationNode: AudioNode, output: number): void;
    disconnect(destinationNode: AudioNode, output: number, input: number): void;
    disconnect(destinationParam: AudioParam): void;
    disconnect(destinationParam: AudioParam, output: number): void;
    context: AudioContext;
    numberOfInputs: number;
    numberOfOutputs: number;
  }

  export interface AudioBufferSourceNode extends AudioNode {
    buffer: AudioBuffer | null;
    playbackRate: AudioParam;
    start(when?: number, offset?: number, duration?: number): void;
    stop(when?: number): void;
    onended: ((this: AudioBufferSourceNode, ev: Event) => any) | null;
  }

  export interface AudioDestinationNode extends AudioNode {
    maxChannelCount: number;
  }

  export interface AudioParam {
    value: number;
    setValueAtTime(value: number, startTime: number): AudioParam;
    linearRampToValueAtTime(value: number, endTime: number): AudioParam;
    exponentialRampToValueAtTime(value: number, endTime: number): AudioParam;
    setTargetAtTime(
      target: number,
      startTime: number,
      timeConstant: number
    ): AudioParam;
  }

  export interface AnalyserNode extends AudioNode {
    fftSize: number;
    frequencyBinCount: number;
    getFloatFrequencyData(array: Float32Array): void;
    getByteFrequencyData(array: Uint8Array): void;
    getFloatTimeDomainData(array: Float32Array): void;
    getByteTimeDomainData(array: Uint8Array): void;
  }

  export interface BiquadFilterNode extends AudioNode {
    type: BiquadFilterType;
    frequency: AudioParam;
    detune: AudioParam;
    Q: AudioParam;
    gain: AudioParam;
  }

  export type BiquadFilterType =
    | 'lowpass'
    | 'highpass'
    | 'bandpass'
    | 'lowshelf'
    | 'highshelf'
    | 'peaking'
    | 'notch'
    | 'allpass';

  export interface ConvolverNode extends AudioNode {
    buffer: AudioBuffer | null;
    normalize: boolean;
  }

  export interface DelayNode extends AudioNode {
    delayTime: AudioParam;
  }

  export interface GainNode extends AudioNode {
    gain: AudioParam;
  }

  export const AudioContext: {
    new (contextOptions?: AudioContextOptions): AudioContext;
  };

  export const OfflineAudioContext: {
    new (
      contextOptions: AudioContextOptions | number,
      numberOfChannels: number,
      length: number,
      sampleRate: number
    ): OfflineAudioContext;
  };

  export interface AudioContextOptions {
    latencyHint?: 'balanced' | 'interactive' | 'playback' | number;
    sampleRate?: number;
  }
}

declare global {
  interface Window {
    AudioContext: typeof AudioContext;
    webkitAudioContext: typeof AudioContext;
  }
}
