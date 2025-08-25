import { AudioProcessor } from '../../services/realtimeOptimization';
import { AudioBuffer } from 'web-audio-api';

describe('Real-time Audio Processing', () => {
  let audioProcessor: AudioProcessor;
  
  // Create a mock AudioBuffer
  const createMockAudioBuffer = (sampleRate: number, length: number, frequency: number) => {
    return {
      sampleRate,
      length,
      duration: length / sampleRate,
      getChannelData: () => {
        const data = new Float32Array(length);
        for (let i = 0; i < length; i++) {
          data[i] = Math.sin(2 * Math.PI * frequency * (i / sampleRate));
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
      useGPU: false
    });
  });

  it('should process audio in real-time', async () => {
    const audioBuffer = createMockAudioBuffer(44100, 44100, 440);
    const chunkSize = 1024;
    
    const result = await audioProcessor.process(audioBuffer, {
      onProgress: (progress) => {
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
      },
      chunkSize
    });
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle empty audio buffer', async () => {
    const audioBuffer = createMockAudioBuffer(44100, 0, 0);
    
    const result = await audioProcessor.process(audioBuffer);
    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });

  it('should apply effects if specified', async () => {
    const audioBuffer = createMockAudioBuffer(44100, 44100, 440);
    
    const result = await audioProcessor.process(audioBuffer, {
      effects: [
        { type: 'pitchShift', value: 2 },
        { type: 'reverb', value: 0.5 }
      ]
    });
    
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});
