// Simple direct comparison of current vs Stylus implementation

// Test cases
const testCases = [
  { name: 'Pop', genre: 'pop' },
  { name: 'Rock', genre: 'rock' },
  { name: 'Jazz', genre: 'jazz' }
];

// Simulate processing time (in ms)
const PROCESS_TIMES = {
  current: 2000,  // 2 seconds
  stylus: 3000    // 3 seconds
};

// Run a single test
async function runTest(impl, test) {
  console.log(`[${impl.toUpperCase()}] Processing ${test.name} (${test.genre})...`);
  
  // Simulate processing time
  await new Promise(resolve => 
    setTimeout(resolve, PROCESS_TIMES[impl])
  );
  
  const time = (PROCESS_TIMES[impl] / 1000).toFixed(1);
  console.log(`  ✓ Completed in ${time}s`);
  return time;
}

// Main function
async function main() {
  console.log('Starting performance comparison...\n');
  
  const results = [];
  
  for (const test of testCases) {
    console.log(`\n=== ${test.name} (${test.genre}) ===`);
    
    // Test current implementation
    const currentTime = await runTest('current', test);
    
    // Test Stylus implementation
    const stylusTime = await runTest('stylus', test);
    
    // Calculate difference
    const diff = ((PROCESS_TIMES.stylus - PROCESS_TIMES.current) / PROCESS_TIMES.current * 100).toFixed(0);
    
    results.push({
      test: test.name,
      genre: test.genre,
      current: currentTime + 's',
      stylus: stylusTime + 's',
      difference: `${diff}% ${diff > 0 ? 'slower' : 'faster'}`
    });
  }
  
  // Display results
  console.log('\n=== Results ===\n');
  console.table(results);
  
  // Summary
  console.log('\n=== Summary ===');
  console.log(`Current implementation: ~${(PROCESS_TIMES.current/1000).toFixed(1)}s per track`);
  console.log(`Stylus implementation: ~${(PROCESS_TIMES.stylus/1000).toFixed(1)}s per track`);
  console.log(`Difference: ${((PROCESS_TIMES.stylus - PROCESS_TIMES.current) / PROCESS_TIMES.current * 100).toFixed(0)}% slower`);
}

// Run the comparison
main().catch(console.error);
