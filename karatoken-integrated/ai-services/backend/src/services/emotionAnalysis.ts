import { pipeline } from '@xenova/transformers';
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
      emotions: { neutral: 0 },
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
      emotions,
    };
  } catch (error) {
    console.error('Error in emotion analysis:', error);
    return {
      dominantEmotion: 'error',
      confidence: 0,
      emotions: { error: 0 },
    };
  }
}

// Cache layer for emotion analysis (allows caching both completed EmotionResult and active Promise<EmotionResult> to coalesce concurrent lookups)
const emotionCache: { [key: string]: EmotionResult | Promise<EmotionResult> } = {};
const CACHE_DIR = path.join(process.cwd(), '.cache', 'emotion');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export async function analyzeEmotionWithCache(text: string): Promise<EmotionResult> {
  const hash = createHash('md5').update(text).digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);

  // Check in-memory cache first (could be a concrete result or a Promise of an active inflight request)
  if (emotionCache[hash]) {
    return emotionCache[hash];
  }

  // Create an async operation to load/analyze/write and store it in-memory as a Promise immediately.
  // This coalesces any concurrent, duplicate incoming requests for the same text to a single execution.
  const promise = (async (): Promise<EmotionResult> => {
    try {
      // ⚡ Bolt Optimization: Asynchronously read disk cache using fs.promises.readFile.
      // This prevents blocking the main thread (event loop) with synchronous I/O system calls.
      const cacheData = await fs.promises.readFile(cacheFile, 'utf-8');
      const cached = JSON.parse(cacheData) as EmotionResult;
      // Replace the Promise in cache with the concrete result for faster subsequent accesses
      emotionCache[hash] = cached;
      return cached;
    } catch (readError: any) {
      if (readError.code !== 'ENOENT') {
        console.warn('Disk cache read error:', readError);
      }
    }

    // Run the actual classifier analysis
    const result = await analyzeEmotion(text);

    try {
      // ⚡ Bolt Optimization: Asynchronously write to disk cache using fs.promises.writeFile.
      // This avoids blocking the event loop when writing new results.
      await fs.promises.writeFile(cacheFile, JSON.stringify(result), 'utf-8');
    } catch (writeError) {
      console.warn('Disk cache write error:', writeError);
    }

    // Replace the Promise in cache with the concrete result
    emotionCache[hash] = result;
    return result;
  })();

  emotionCache[hash] = promise;

  try {
    return await promise;
  } catch (error) {
    // If anything fails during the caching flow, clear the cache entry so future retries can run
    delete emotionCache[hash];
    console.error('Error in cached emotion analysis:', error);
    return analyzeEmotion(text); // Fall back to non-cached version
  }
}
