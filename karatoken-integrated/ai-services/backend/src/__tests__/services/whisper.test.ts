import { transcribeAudio } from '../../services/whisper';
import fs from 'fs';
import path from 'path';

// Mock whisper-node module
jest.mock('whisper-node', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((audioPath, options) => {
    // Mock implementation that returns a simple transcription
    if (!fs.existsSync(audioPath)) {
      throw new Error('Audio file not found');
    }
    return '1\n00:00:00,000 --> 00:00:05,000\nThis is a test transcription\n';
  })
}));

describe('Whisper Transcription Service', () => {
  const testAudioPath = path.join(__dirname, '../../test-data/audio/test.wav');

  beforeAll(() => {
    // Create test directory if it doesn't exist
    const testDir = path.join(__dirname, '../../test-data/audio');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create a small test audio file
    if (!fs.existsSync(testAudioPath)) {
      fs.writeFileSync(testAudioPath, Buffer.alloc(1024)); // 1KB dummy audio file
    }
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testAudioPath)) {
      fs.unlinkSync(testAudioPath);
    }
  });

  it('should transcribe audio file successfully', async () => {
    const result = await transcribeAudio(testAudioPath);
    expect(result).toContain('This is a test transcription');
    expect(result).toMatch(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/);
  });

  it('should throw error for non-existent file', async () => {
    await expect(transcribeAudio('nonexistent.wav')).rejects.toThrow('Audio file not found');
  });
});
