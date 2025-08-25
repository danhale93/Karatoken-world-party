// Simple local benchmark that simulates API calls
const fs = require('fs').promises;

// Configuration
const config = {
  testSamples: [
    { name: 'Pop', genre: 'pop' },
    { name: 'Rock', genre: 'rock' },
    { name: 'Jazz', genre: 'jazz' }
  ],
  // Simulated processing times (in seconds)
  simulatedTimes: {
    current: 2.0,  // Current implementation time
    stylus: 3.0    // Stylus implementation time
  },
  // Add some random variation to make it more realistic
  variation: 0.3   // ±30% variation
};

// Simulate an API call with random variation
function simulateApiCall(baseTime) {
  const variation = (Math.random() * 2 - 1) * config.variation * baseTime;
  return baseTime + variation;
}

// Simulate current implementation
async function simulateCurrent(sample) {
  console.log(`\n[Current] ${sample.name} (${sample.genre})`);
  
  // Simulate processing steps
  console.log('  Downloading...');
  await new Promise(r => setTimeout(r, 1000 * simulateApiCall(0.5)));
  
  console.log('  Processing...');
  await new Promise(r => setTimeout(r, 1000 * simulateApiCall(config.simulatedTimes.current - 0.5)));
  
  const time = (Math.random() * 0.5 + 2.0).toFixed(1);
  console.log(`  Done in ${time}s`);
  return parseFloat(time);
}

// Simulate Stylus implementation
async function simulateStylus(sample) {
  console.log(`\n[Stylus] ${sample.name} (${sample.genre})`);
  
  // Simulate processing steps
  console.log('  Downloading...');
  await new Promise(r => setTimeout(r, 1000 * simulateApiCall(0.5)));
  
  console.log('  Processing style transfer...');
  await new Promise(r => setTimeout(r, 1000 * simulateApiCall(config.simulatedTimes.stylus - 0.5)));
  
  const time = (Math.random() * 0.5 + 3.0).toFixed(1);
  console.log(`  Done in ${time}s`);
  return parseFloat(time);
}

// Run benchmark
async function runBenchmark() {
  const results = [];
  
  for (const sample of config.testSamples) {
    console.log(`\n=== ${sample.name} ===`);
    
    const currentTime = await simulateCurrent(sample);
    const stylusTime = await simulateStylus(sample);
    
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
  console.log('\n=== Benchmark Results ===\n');
  
  // Calculate averages
  const avgCurrent = results.reduce((sum, r) => 
    sum + parseFloat(r.currentTime), 0) / results.length;
  const avgStylus = results.reduce((sum, r) => 
    sum + parseFloat(r.stylusTime), 0) / results.length;
  const avgDiff = ((avgStylus - avgCurrent) / avgCurrent * 100).toFixed(1);
  
  // Display table
  console.table(results);
  
  // Display summary
  console.log('\n=== Summary ===');
  console.log(`Average Current: ${avgCurrent.toFixed(2)}s`);
  console.log(`Average Stylus: ${avgStylus.toFixed(2)}s`);
  console.log(`Average Difference: ${avgDiff}% ${avgStylus > avgCurrent ? 'slower' : 'faster'}`);
  
  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const result = {
    timestamp,
    summary: {
      avgCurrent,
      avgStylus,
      avgDiff: parseFloat(avgDiff)
    },
    details: results
  };
  
  fs.writeFileSync(`benchmark-simulated-${timestamp}.json`, JSON.stringify(result, null, 2));
  console.log(`\nResults saved to benchmark-simulated-${timestamp}.json`);
}

// Run the benchmark
runBenchmark()
  .then(showResults)
  .catch(console.error);
