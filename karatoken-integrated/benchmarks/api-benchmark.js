const axios = require('axios');
const fs = require('fs').promises;

// Configuration
const API_BASE = 'http://localhost:3000/api'; // Update with your actual API URL
const TEST_SAMPLES = [
  {
    name: 'Pop Sample',
    genre: 'pop',
    youtubeUrl: 'https://www.youtube.com/watch?v=example_pop' // Replace with actual test URLs
  },
  {
    name: 'Rock Sample',
    genre: 'rock',
    youtubeUrl: 'https://www.youtube.com/watch?v=example_rock'
  },
  {
    name: 'Jazz Sample',
    genre: 'jazz',
    youtubeUrl: 'https://www.youtube.com/watch?v=example_jazz'
  }
];

// Helper function to poll job status
async function pollJobStatus(jobId, endpoint) {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max (5s * 60 = 300s)
  
  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(`${API_BASE}${endpoint}/${jobId}`);
      const { status, progress, outputUrl, lrcUrl } = response.data;
      
      if (status === 'completed') {
        return { status: 'completed', outputUrl, lrcUrl };
      } else if (status === 'failed') {
        throw new Error(`Job ${jobId} failed`);
      }
      
      console.log(`  Progress: ${progress || 0}%`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5 seconds
      attempts++;
    } catch (error) {
      console.error('  Error polling job status:', error.message);
      throw error;
    }
  }
  
  throw new Error('Job timed out');
}

// Current implementation test
async function testCurrentImplementation(sample) {
  console.log(`\n[Current] Testing ${sample.name} (${sample.genre})`);
  
  try {
    // 1. Download audio from YouTube
    console.log('  1. Downloading audio...');
    const downloadRes = await axios.post(`${API_BASE}/youtube/download`, {
      url: sample.youtubeUrl
    });
    
    // 2. Start genre swap
    console.log('  2. Starting genre swap...');
    const swapRes = await axios.post(`${API_BASE}/genre/swap`, {
      audioUrl: downloadRes.data.url,
      genre: sample.genre
    });
    
    // 3. Poll for completion
    console.log('  3. Processing...');
    const startTime = Date.now();
    const result = await pollJobStatus(swapRes.data.jobId, '/genre/status');
    const processingTime = (Date.now() - startTime) / 1000; // in seconds
    
    console.log(`  ✓ Completed in ${processingTime.toFixed(2)}s`);
    return {
      success: true,
      processingTime,
      outputUrl: result.outputUrl,
      lrcUrl: result.lrcUrl
    };
  } catch (error) {
    console.error('  ✗ Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Stylus implementation test
async function testStylusImplementation(sample) {
  console.log(`\n[Stylus] Testing ${sample.name} (${sample.genre})`);
  
  try {
    // 1. Download audio from YouTube
    console.log('  1. Downloading audio...');
    const downloadRes = await axios.post(`${API_BASE}/youtube/download`, {
      url: sample.youtubeUrl
    });
    
    // 2. Start Stylus transfer
    console.log('  2. Starting style transfer...');
    const transferRes = await axios.post(`${API_BASE}/stylus/transfer`, {
      contentUrl: downloadRes.data.url,
      styleGenre: sample.genre,
      intensity: 0.7
    });
    
    // 3. Poll for completion
    console.log('  3. Processing...');
    const startTime = Date.now();
    const result = await pollJobStatus(transferRes.data.jobId, '/stylus/status');
    const processingTime = (Date.now() - startTime) / 1000; // in seconds
    
    console.log(`  ✓ Completed in ${processingTime.toFixed(2)}s`);
    return {
      success: true,
      processingTime,
      outputUrl: result.outputUrl
    };
  } catch (error) {
    console.error('  ✗ Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Main benchmark function
async function runBenchmark() {
  console.log('Starting Karatoken Benchmark\n');
  
  const results = [];
  
  for (const sample of TEST_SAMPLES) {
    console.log(`\n=== ${sample.name} (${sample.genre}) ===`);
    
    // Test current implementation
    const currentResult = await testCurrentImplementation(sample);
    
    // Test Stylus implementation
    const stylusResult = await testStylusImplementation(sample);
    
    if (currentResult.success && stylusResult.success) {
      const timeDiff = ((stylusResult.processingTime - currentResult.processingTime) / 
                       currentResult.processingTime * 100).toFixed(2);
      
      results.push({
        testCase: sample.name,
        genre: sample.genre,
        current: {
          processingTime: currentResult.processingTime.toFixed(2) + 's',
          outputUrl: currentResult.outputUrl,
          lrcUrl: currentResult.lrcUrl
        },
        stylus: {
          processingTime: stylusResult.processingTime.toFixed(2) + 's',
          outputUrl: stylusResult.outputUrl
        },
        difference: `${timeDiff}% ${stylusResult.processingTime > currentResult.processingTime ? 'slower' : 'faster'}`
      });
    }
  }
  
  return results;
}

// Display results
function displayResults(results) {
  console.log('\n=== Benchmark Results ===\n');
  
  // Calculate averages
  const avgCurrent = results.reduce((sum, r) => 
    sum + parseFloat(r.current.processingTime), 0) / results.length;
  const avgStylus = results.reduce((sum, r) => 
    sum + parseFloat(r.stylus.processingTime), 0) / results.length;
  const avgDiff = ((avgStylus - avgCurrent) / avgCurrent * 100).toFixed(2);
  
  // Display table
  console.table(results.map(r => ({
    'Test Case': r.testCase,
    'Genre': r.genre,
    'Current Time': r.current.processingTime,
    'Stylus Time': r.stylus.processingTime,
    'Difference': r.difference
  })));
  
  // Display summary
  console.log('\n=== Summary ===');
  console.log(`Average Current: ${avgCurrent.toFixed(2)}s`);
  console.log(`Average Stylus: ${avgStylus.toFixed(2)}s`);
  console.log(`Average Difference: ${avgDiff}% ${avgStylus > avgCurrent ? 'slower' : 'faster'}`);
  
  return {
    avgCurrent,
    avgStylus,
    avgDiff
  };
}

// Run the benchmark
runBenchmark()
  .then(displayResults)
  .then(async (summary) => {
    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const result = {
      timestamp,
      summary,
      details: TEST_SAMPLES.map((test, i) => ({
        ...test,
        ...(summary.details?.[i] || {})
      }))
    };
    
    await fs.writeFile(`benchmark-results-${timestamp}.json`, JSON.stringify(result, null, 2));
    console.log(`\nResults saved to benchmark-results-${timestamp}.json`);
  })
  .catch(console.error);
