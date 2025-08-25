import { pipeline } from 'transformers';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface EmotionResult {
  dominantEmotion: string;
  confidence: number;
  emotions: {
    [emotion: string]: number;
  };
}

// Cache for the classifier to avoid reloading
let emotionClassifier: any = null;

// Initialize the emotion classifier
async function getEmotionClassifier() {
  if (!emotionClassifier) {
    emotionClassifier = await pipeline(
      'text-classification',
      'finiteautomata/bertweet-base-emotion-analysis'
    );
  }
  return emotionClassifier;
}

export async function analyzeEmotion(text: string): Promise<EmotionResult> {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      dominantEmotion: 'neutral',
      confidence: 0,
      emotions: { neutral: 0 }
    };
  }

  try {
    const classifier = await getEmotionClassifier();
    const results = await classifier(text, { topk: 5 });
    
    // Process the results
    const emotions: { [key: string]: number } = {};
    let dominantEmotion = 'neutral';
    let maxScore = 0;
    
    results.forEach((result: { label: string; score: number }) => {
      const emotion = result.label.toLowerCase();
      const score = result.score;
      emotions[emotion] = score;
      
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    });
    
    return {
      dominantEmotion,
      confidence: maxScore,
      emotions
    };
  } catch (error) {
    console.error('Error in emotion analysis:', error);
    return {
      dominantEmotion: 'error',
      confidence: 0,
      emotions: { error: 0 }
    };
  }
}

// Cache layer for emotion analysis
const emotionCache: { [key: string]: EmotionResult } = {};
const CACHE_DIR = path.join(process.cwd(), '.cache', 'emotion');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export async function analyzeEmotionWithCache(text: string): Promise<EmotionResult> {
  const hash = createHash('md5').update(text).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  
  try {
    // Check in-memory cache first
    if (emotionCache[hash]) {
      return emotionCache[hash];
    }
    
    // Check disk cache
    if (fs.existsSync(cacheFile)) {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
      emotionCache[hash] = cached;
      return cached;
    }
    
    // Analyze and cache the result
    const result = await analyzeEmotion(text);
    
    // Update caches
    emotionCache[hash] = result;
    fs.writeFileSync(cacheFile, JSON.stringify(result), 'utf-8');
    
    return result;
  } catch (error) {
    console.error('Error in cached emotion analysis:', error);
    return analyzeEmotion(text); // Fall back to non-cached version
  }
}
