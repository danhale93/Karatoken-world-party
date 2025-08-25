import { analyzeEmotion } from '../../services/emotionAnalysis';

// Mock the transformers pipeline
jest.mock('transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(async (text: string) => {
    // Mock response based on input text
    if (text.includes('happy')) {
      return [{ label: 'joy', score: 0.95 }];
    } else if (text.includes('sad')) {
      return [{ label: 'sadness', score: 0.9 }];
    } else if (text.includes('angry')) {
      return [{ label: 'anger', score: 0.88 }];
    }
    return [{ label: 'neutral', score: 0.5 }];
  })
}));

describe('Emotion Analysis Service', () => {
  it('should detect happy emotion', async () => {
    const result = await analyzeEmotion('I am so happy today!');
    expect(result.dominantEmotion).toBe('joy');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should detect sad emotion', async () => {
    const result = await analyzeEmotion('I feel sad about this situation');
    expect(result.dominantEmotion).toBe('sadness');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle empty text', async () => {
    const result = await analyzeEmotion('');
    expect(result.dominantEmotion).toBe('neutral');
    expect(result.confidence).toBe(0);
  });

  it('should handle very short text', async () => {
    const result = await analyzeEmotion('Great!');
    expect(result.confidence).toBeGreaterThan(0);
  });
});
