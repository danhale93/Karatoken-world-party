import { detectPitch, analyzePitch } from '../../services/pitchDetection';
import { AudioBuffer } from 'web-audio-api';

describe('Pitch Detection Service', () => {
  // Create a mock AudioBuffer
  const createMockAudioBuffer = (sampleRate: number, length: number, frequency: number) => {
    const audioBuffer = {
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
    };
    return (audioBuffer as unknown) as AudioBuffer;
  };

  describe('detectPitch', () => {
    it('should detect pitch of a pure sine wave', () => {
      const sampleRate = 44100;
      const testFreq = 440; // A4 note
      const audioBuffer = createMockAudioBuffer(sampleRate, sampleRate, testFreq);
      
      const pitches = detectPitch(audioBuffer);
      
      // Should have detected pitch for each analysis window
      expect(pitches.length).toBeGreaterThan(0);
      
      // The detected pitch should be close to the test frequency
      const avgPitch = pitches.reduce((a, b) => a + b, 0) / pitches.length;
      expect(avgPitch).toBeCloseTo(testFreq, -1); // Within 10Hz
    });

    it('should handle silent audio', () => {
      const audioBuffer = {
        sampleRate: 44100,
        length: 44100,
        duration: 1,
        getChannelData: () => new Float32Array(44100), // Silent
        numberOfChannels: 1,
      } as unknown as AudioBuffer;
      
      const pitches = detectPitch(audioBuffer);
      expect(pitches.every(p => p === 0)).toBe(true);
    });
  });

  describe('analyzePitch', () => {
    it('should analyze pitch data and return metrics', () => {
      // Create pitch data that goes from 220Hz to 440Hz
      const pitchData = Array.from({ length: 100 }, (_, i) => 220 + (i * 2.2));
      
      const analysis = analyzePitch(pitchData);
      
      expect(analysis.averagePitch).toBeCloseTo(330, -1);
      expect(analysis.minPitch).toBeCloseTo(220, -1);
      expect(analysis.maxPitch).toBeCloseTo(440, -1);
      expect(analysis.pitchRange).toBeCloseTo(220, -1);
      expect(analysis.pitchStability).toBeGreaterThan(0);
    });

    it('should handle empty pitch data', () => {
      const analysis = analyzePitch([]);
      
      expect(analysis.averagePitch).toBe(0);
      expect(analysis.minPitch).toBe(0);
      expect(analysis.maxPitch).toBe(0);
      expect(analysis.pitchRange).toBe(0);
      expect(analysis.pitchStability).toBe(0);
    });
  });
});
