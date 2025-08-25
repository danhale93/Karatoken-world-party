const { performance } = require('perf_hooks');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_SAMPLES = {
  pop: {
    url: 'https://www.youtube.com/watch?v=example_pop',
    genre: 'pop'
  },
  rock: {
    url: 'https://www.youtube.com/watch?v=example_rock',
    genre: 'rock'
  }
};

// Benchmark results
const results = [];

// Helper functions
async function testCurrentImplementation(sample) {
  console.log(`Testing current implementation with ${sample.genre}...`);
  
  // 1. Download audio
  const downloadStart = performance.now();
  const downloadRes = await axios.post(`${API_BASE}/youtube/download`, {
    url: sample.url
  });
  const audioUrl = downloadRes.data.url;
  
  // 2. Process genre swap
  const swapRes = await axios.post(`${API_BASE}/genre/swap`, {
    audioUrl,
    genre: sample.genre
  });
  
  // 3. Poll for completion
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 2000));
    status = await axios.get(`${API_BASE}/genre/status/${swapRes.data.jobId}`);
  } while (status.data.status !== 'completed');
  
  const endTime = performance.now();
  
  return {
    processingTime: (endTime - downloadStart) / 1000, // in seconds
    resultUrl: status.data.outputUrl,
    lrcUrl: status.data.lrcUrl
  };
}

async function testStylusImplementation(sample) {
  console.log(`Testing Stylus with ${sample.genre}...`);
  
  // 1. Download audio
  const downloadRes = await axios.post(`${API_BASE}/youtube/download`, {
    url: sample.url
  });
  
  // 2. Get style reference (using a predefined style for this genre)
  const styleAudio = await getStyleReference(sample.genre);
  
  // 3. Process with Stylus
  const startTime = performance.now();
  const stylusRes = await axios.post(`${API_BASE}/stylus/transfer`, {
    contentUrl: downloadRes.data.url,
    styleUrl: styleAudio,
    intensity: 0.7
  });
  
  // 4. Poll for completion
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 2000));
    status = await axios.get(`${API_BASE}/stylus/status/${stylusRes.data.jobId}`);
  } while (status.data.status !== 'completed');
  
  const endTime = performance.now();
  
  return {
    processingTime: (endTime - startTime) / 1000, // in seconds
    resultUrl: status.data.outputUrl
  };
}

async function getStyleReference(genre) {
  // In a real implementation, this would return a URL to a style reference audio
  // For now, we'll use a placeholder
  return `https://example.com/styles/${genre}_reference.wav`;
}

async function runBenchmark() {
  console.log('Starting benchmark...');
  
  for (const [name, sample] of Object.entries(TEST_SAMPLES)) {
    console.log(`\n--- Testing ${name.toUpperCase()} ---`);
    
    // Run current implementation
    console.log('\n[Current Implementation]');
    const current = await testCurrentImplementation(sample);
    
    // Run Stylus implementation
    console.log('\n[Stylus Implementation]');
    const stylus = await testStylusImplementation(sample);
    
    // Compare results
    results.push({
      genre: sample.genre,
      current: {
        processingTime: current.processingTime,
        resultUrl: current.resultUrl,
        lrcUrl: current.lrcUrl
      },
      stylus: {
        processingTime: stylus.processingTime,
        resultUrl: stylus.resultUrl
      },
      timeComparison: (current.processingTime / stylus.processingTime * 100).toFixed(2) + '%'
    });
  }
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await fs.writeFile(
    `benchmark-results-${timestamp}.json`,
    JSON.stringify(results, null, 2)
  );
  
  console.log('\nBenchmark completed!');
  console.log('Results:', results);
  return results;
}

// Run the benchmark
runBenchmark().catch(console.error);
