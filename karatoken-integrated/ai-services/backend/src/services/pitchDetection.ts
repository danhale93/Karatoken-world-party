import { PitchDetector } from 'pitchy';
import { AudioBuffer } from 'web-audio-api';

export interface PitchAnalysis {
  averagePitch: number;
  minPitch: number;
  maxPitch: number;
  pitchRange: number;
  pitchStability: number; // Lower is more stable (standard deviation)
}

export function detectPitch(audioBuffer: AudioBuffer, windowSize = 2048): number[] {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const pitches: number[] = [];

  // Create a pitch detector for the given sample rate
  const detector = PitchDetector.forFloat32Array(windowSize);
  const hopSize = Math.floor(windowSize / 2);

  // Process the audio in chunks
  for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
    // ⚡ Bolt Optimization: Use .subarray() instead of .slice() to avoid data copy allocation overhead
    const chunk = channelData.subarray(i, i + windowSize);
    const [pitch, clarity] = detector.findPitch(chunk, sampleRate);

    // Only include pitches with sufficient clarity
    if (clarity > 0.8) {
      pitches.push(pitch);
    } else {
      pitches.push(0); // Indicate no pitch detected
    }
  }

  return pitches;
}

export function analyzePitch(pitchData: number[]): PitchAnalysis {
  const len = pitchData.length;
  if (len === 0) {
    return {
      averagePitch: 0,
      minPitch: 0,
      maxPitch: 0,
      pitchRange: 0,
      pitchStability: 0,
    };
  }

  // ⚡ Bolt Optimization: 2-pass iterative calculation with ZERO allocations.
  // This avoids multi-pass array allocations (filter, map) and prevents stack overflow
  // caused by spreading potentially massive pitch arrays (Math.min(...), Math.max(...)).
  let sum = 0;
  let count = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < len; i++) {
    const p = pitchData[i];
    if (p > 0) {
      sum += p;
      count++;
      if (p < min) min = p;
      if (p > max) max = p;
    }
  }

  if (count === 0) {
    return {
      averagePitch: 0,
      minPitch: 0,
      maxPitch: 0,
      pitchRange: 0,
      pitchStability: 0,
    };
  }

  const avg = sum / count;

  let sumOfSquaredDiffs = 0;
  for (let i = 0; i < len; i++) {
    const p = pitchData[i];
    if (p > 0) {
      const diff = p - avg;
      sumOfSquaredDiffs += diff * diff;
    }
  }

  const stdDev = Math.sqrt(sumOfSquaredDiffs / count);

  return {
    averagePitch: avg,
    minPitch: min,
    maxPitch: max,
    pitchRange: max - min,
    pitchStability: stdDev,
  };
}

// Helper function to convert frequency to musical note
export function frequencyToNote(frequency: number): string {
  if (frequency <= 0) return '--';

  const A4 = 440;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Calculate the number of half steps from A4
  const halfSteps = 12 * Math.log2(frequency / A4);
  const noteNumber = Math.round(halfSteps) + 9; // A4 is the 9th note in the 12-note scale

  const octave = Math.floor(noteNumber / 12) + 4;
  const noteName = noteNames[((noteNumber % 12) + 12) % 12];

  return `${noteName}${octave}`;
}
