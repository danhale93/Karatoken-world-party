const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const config = {
  api: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 30000
  },
  testSamples: [
    { name: 'Pop', genre: 'pop', youtubeUrl: 'https://www.youtube.com/watch?v=example_pop' },
    { name: 'Rock', genre: 'rock', youtubeUrl: 'https://www.youtube.com/watch?v=example_rock' }
  ]
};

// Configure axios
const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeout
});

// Poll job status
async function pollJob(jobId, endpoint) {
  let attempts = 0;
  while (attempts < 12) { // 1 minute max
    try {
      const res = await api.get(`${endpoint}/${jobId}`);
      if (res.data.status === 'completed') return res.data;
      if (res.data.status === 'failed') throw new Error('Job failed');
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
    } catch (error) {
      console.error('\nError:', error.message);
      throw error;
    }
  }
  throw new Error('Job timed out');
}

// Test current implementation
async function testCurrent(sample) {
  console.log(`\n[Current] ${sample.name} (${sample.genre})`);
  
  // 1. Download audio
  console.log('  Downloading...');
  const dlRes = await api.post('/youtube/download', { url: sample.youtubeUrl });
  
  // 2. Start genre swap
  console.log('  Swapping genre...');
  const start = Date.now();
  const swapRes = await api.post('/genre/swap', {
    audioUrl: dlRes.data.url,
    genre: sample.genre
  });
  
  // 3. Poll status
  console.log('  Processing');
  await pollJob(swapRes.data.jobId, '/genre/status');
  
  const time = (Date.now() - start) / 1000;
  console.log(`\n  Done in ${time.toFixed(1)}s`);
  return time;
}

// Test Stylus implementation
async function testStylus(sample) {
  console.log(`\n[Stylus] ${sample.name} (${sample.genre})`);
  
  // 1. Download audio
  console.log('  Downloading...');
  const dlRes = await api.post('/youtube/download', { url: sample.youtubeUrl });
  
  // 2. Start style transfer
  console.log('  Transferring style...');
  const start = Date.now();
  const transferRes = await api.post('/stylus/transfer', {
    contentUrl: dlRes.data.url,
    styleGenre: sample.genre
  });
  
  // 3. Poll status
  console.log('  Processing');
  await pollJob(transferRes.data.jobId, '/stylus/status');
  
  const time = (Date.now() - start) / 1000;
  console.log(`\n  Done in ${time.toFixed(1)}s`);
  return time;
}

// Run benchmark
async function runBenchmark() {
  const results = [];
  
  for (const sample of config.testSamples) {
    console.log(`\n=== ${sample.name} ===`);
    
    const currentTime = await testCurrent(sample);
    const stylusTime = await testStylus(sample);
    const diff = ((stylusTime - currentTime) / currentTime * 100).toFixed(1);
    
    results.push({
      test: sample.name,
      genre: sample.genre,
      currentTime: currentTime.toFixed(1) + 's',
      stylusTime: stylusTime.toFixed(1) + 's',
      difference: `${diff}% ${stylusTime > currentTime ? 'slower' : 'faster'}`
    });
  }
  
  return results;
}

// Display results
function showResults(results) {
  console.log('\n=== Results ===\n');
  console.table(results);
  
  // Save to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(`benchmark-${timestamp}.json`, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to benchmark-${timestamp}.json`);
}

// Run the benchmark
runBenchmark()
  .then(showResults)
  .catch(err => console.error('Benchmark failed:', err));
