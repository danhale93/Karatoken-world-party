// Simple performance comparison

// Test cases
const tests = [
  { name: 'Pop', genre: 'pop' },
  { name: 'Rock', genre: 'rock' },
  { name: 'Jazz', genre: 'jazz' }
];

// Simulated processing times (ms)
const TIMES = {
  current: 2000,  // Current implementation
  stylus: 3000    // Stylus implementation
};

// Run a single test
function runTest(impl, test) {
  console.log(`[${impl.toUpperCase()}] ${test.name} (${test.genre})`);
  return new Promise(resolve => {
    setTimeout(() => {
      const time = (TIMES[impl] / 1000).toFixed(1);
      console.log(`  ✓ Done in ${time}s`);
      resolve(time);
    }, TIMES[impl]);
  });
}

// Main function
async function main() {
  console.log('Starting performance comparison...\n');
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n=== ${test.name} ===`);
    
    // Test current implementation
    const currentTime = await runTest('current', test);
    
    // Test Stylus implementation
    const stylusTime = await runTest('stylus', test);
    
    // Calculate difference
    const diff = ((TIMES.stylus - TIMES.current) / TIMES.current * 100).toFixed(0);
    
    results.push({
      test: test.name,
      current: currentTime + 's',
      stylus: stylusTime + 's',
      difference: `${diff}% ${diff > 0 ? 'slower' : 'faster'}`
    });
  }
  
  // Show results
  console.log('\n=== Results ===\n');
  console.table(results);
  
  // Show summary
  console.log('\n=== Summary ===');
  console.log(`Current: ~${(TIMES.current/1000).toFixed(1)}s per track`);
  console.log(`Stylus:  ~${(TIMES.stylus/1000).toFixed(1)}s per track`);
  console.log(`Stylus is ${diff}% ${diff > 0 ? 'slower' : 'faster'}`);
}

// Run the comparison
main().catch(console.error);
