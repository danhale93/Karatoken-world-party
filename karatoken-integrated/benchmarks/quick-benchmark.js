// Simple benchmark with mock data
const testCases = [
  { name: 'Pop Song', genre: 'pop' },
  { name: 'Rock Song', genre: 'rock' },
  { name: 'Jazz Song', genre: 'jazz' }
];

// Mock implementations
const mockApi = {
  current: {
    process: async (genre) => {
      console.log(`[Current] Processing ${genre}...`);
      await new Promise(r => setTimeout(r, 2000));
      return { success: true };
    }
  },
  stylus: {
    process: async (genre) => {
      console.log(`[Stylus] Processing ${genre}...`);
      await new Promise(r => setTimeout(r, 3000));
      return { success: true };
    }
  }
};

// Run benchmark
async function runBenchmark() {
  const results = [];
  
  for (const test of testCases) {
    console.log(`\n=== ${test.name} (${test.genre}) ===`);
    
    // Test current implementation
    console.log('Testing current implementation...');
    const currentStart = Date.now();
    await mockApi.current.process(test.genre);
    const currentTime = (Date.now() - currentStart) / 1000;
    
    // Test Stylus implementation
    console.log('Testing Stylus implementation...');
    const stylusStart = Date.now();
    await mockApi.stylus.process(test.genre);
    const stylusTime = (Date.now() - stylusStart) / 1000;
    
    // Calculate comparison
    const timeDiff = ((stylusTime - currentTime) / currentTime * 100).toFixed(1);
    
    // Add to results
    results.push({
      test: test.name,
      genre: test.genre,
      currentTime: currentTime.toFixed(2) + 's',
      stylusTime: stylusTime.toFixed(2) + 's',
      difference: `${timeDiff}% ${stylusTime > currentTime ? 'slower' : 'faster'}`
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
}

// Run the benchmark
runBenchmark()
  .then(showResults)
  .catch(console.error);
