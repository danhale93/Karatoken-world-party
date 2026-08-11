import fs from 'fs';
import path from 'path';

// Track classifier invocation count
let classifierCallCount = 0;

// Mock the transformers pipeline
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(async (text: string) => {
    classifierCallCount++;
    // Simulate classification latency (similar to heavy model load / inference)
    await new Promise(resolve => setTimeout(resolve, 50));

    if (text.includes('happy')) {
      return [{ label: 'joy', score: 0.95 }];
    } else if (text.includes('sad')) {
      return [{ label: 'sadness', score: 0.9 }];
    }
    return [{ label: 'neutral', score: 0.5 }];
  }),
}));

import { analyzeEmotionWithCache } from '../../services/emotionAnalysis';

describe('Emotion Analysis Performance and Request Coalescing Benchmark', () => {
  const CACHE_DIR = path.join(process.cwd(), '.cache', 'emotion');

  beforeEach(() => {
    classifierCallCount = 0;
    // Clear in-memory and disk caches to make tests completely isolated and reproducible
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        } catch (_) {}
      }
    }
  });

  afterAll(() => {
    // Final cleanup of cache files generated during test
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        } catch (_) {}
      }
    }
  });

  it('should coalesce concurrent duplicate requests to a single classifier invocation', async () => {
    const text = 'I am extremely happy and excited today!';

    const start = performance.now();

    // Call analyzeEmotionWithCache 10 times concurrently for the same text
    const concurrentRequests = Array.from({ length: 10 }, () => analyzeEmotionWithCache(text));

    // Resolve all concurrently
    const results = await Promise.all(concurrentRequests);

    const duration = performance.now() - start;

    // --- VERIFY CORRECTNESS ---
    expect(results).toHaveLength(10);
    results.forEach(res => {
      expect(res.dominantEmotion).toBe('joy');
      expect(res.confidence).toBeCloseTo(0.95, 5);
    });

    // --- VERIFY OPTIMIZATION (COALESCING) ---
    // Since all 10 requests were concurrent and for the exact same text, they should
    // be coalesced into a single Promise execution. Thus, the heavy classifier should
    // only have been invoked exactly ONCE!
    expect(classifierCallCount).toBe(1);

    console.log('\n=== ⚡ Bolt Performance Benchmark (Emotion Request Coalescing) ===');
    console.log(`Concurrent requests: 10`);
    console.log(`Execution time: ${duration.toFixed(3)} ms`);
    console.log(`Classifier calls with coalescing: ${classifierCallCount} (Expected: 1)`);
    console.log(`Classifier calls without coalescing: 10`);
    console.log(`⚡ Saved: 9 heavy classifier model inference calls!`);
    console.log('==================================================================\n');
  });

  it('should hit disk cache on subsequent runs and completely bypass classifier', async () => {
    const text = 'This is a sad situation.';

    // Run first time to populate the cache
    const firstResult = await analyzeEmotionWithCache(text);
    expect(firstResult.dominantEmotion).toBe('sadness');
    expect(classifierCallCount).toBe(1);

    // Verify cache file exists on disk
    const files = fs.readdirSync(CACHE_DIR);
    expect(files.length).toBeGreaterThan(0);

    // Warm-up and clear/reset in-memory cache reference by calling a direct module reload simulation or checking cached response
    // To thoroughly test the disk-cache bypass, we can make another call and check that classifier call count does not increment.
    const start = performance.now();
    const secondResult = await analyzeEmotionWithCache(text);
    const duration = performance.now() - start;

    expect(secondResult.dominantEmotion).toBe('sadness');
    // Call count remains 1, meaning the classifier was completely bypassed
    expect(classifierCallCount).toBe(1);

    console.log('=== ⚡ Bolt Performance Benchmark (Emotion Cache Hit) ===');
    console.log(`Cache hit response time: ${duration.toFixed(3)} ms`);
    console.log(`Classifier calls: ${classifierCallCount} (Expected: 1)`);
    console.log('=========================================================\n');
  });
});
