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
  
  // Process the audio in chunks
  for (let i = 0; i < channelData.length - windowSize; i += Math.floor(windowSize / 2)) {
    const chunk = channelData.slice(i, i + windowSize);
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
  if (pitchData.length === 0) {
    return {
      averagePitch: 0,
      minPitch: 0,
      maxPitch: 0,
      pitchRange: 0,
      pitchStability: 0
    };
  }
  
  // Filter out invalid pitches
  const validPitches = pitchData.filter(p => p > 0);
  
  if (validPitches.length === 0) {
    return {
      averagePitch: 0,
      minPitch: 0,
      maxPitch: 0,
      pitchRange: 0,
      pitchStability: 0
    };
  }
  
  // Calculate basic statistics
  const sum = validPitches.reduce((a, b) => a + b, 0);
  const avg = sum / validPitches.length;
  const min = Math.min(...validPitches);
  const max = Math.max(...validPitches);
  
  // Calculate standard deviation for stability
  const squareDiffs = validPitches.map(p => Math.pow(p - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / validPitches.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  return {
    averagePitch: avg,
    minPitch: min,
    maxPitch: max,
    pitchRange: max - min,
    pitchStability: stdDev
  };
}

// Helper function to convert frequency to musical note
export function frequencyToNote(frequency: number): string {
  if (frequency <= 0) return '--';
  
  const A4 = 440;
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  // Calculate the number of half steps from A4
  const halfSteps = 12 * (Math.log2(frequency / A4));
  const noteNumber = Math.round(halfSteps) + 9; // A4 is the 9th note in the 12-note scale
  
  const octave = Math.floor(noteNumber / 12) + 4;
  const noteName = noteNames[((noteNumber % 12) + 12) % 12];
  
  return `${noteName}${octave}`;
}
