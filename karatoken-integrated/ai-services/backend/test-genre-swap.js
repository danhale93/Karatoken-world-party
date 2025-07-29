#!/usr/bin/env node

const express = require('express');
const { router: genreSwapRouter } = require('./aiGenreSwapApi');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai/genre-swap', genreSwapRouter);

// Test the genre swap API
async function testGenreSwap() {
  console.log('🎤 Testing Karatoken Genre Swap API...\n');

  // Test 1: Get supported genres
  console.log('📋 Test 1: Getting supported genres...');
  const genresResponse = await fetch('http://localhost:3000/api/ai/genre-swap/genres');
  if (genresResponse.ok) {
    const genres = await genresResponse.json();
    console.log(`✅ Found ${genres.count} supported genres:`);
    console.log(`   ${genres.supportedGenres.slice(0, 10).join(', ')}...`);
  } else {
    console.log('❌ Failed to get genres');
  }

  // Test 2: Submit a genre swap job
  console.log('\n🎵 Test 2: Submitting genre swap job...');
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll
  const testGenre = 'rock';
  
  const jobResponse = await fetch('http://localhost:3000/api/ai/genre-swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      youtubeUrl: testUrl,
      targetGenre: testGenre
    })
  });

  if (jobResponse.ok) {
    const job = await jobResponse.json();
    console.log(`✅ Job submitted successfully!`);
    console.log(`   Job ID: ${job.jobId}`);
    console.log(`   Message: ${job.message}`);
    console.log(`   Estimated time: ${job.estimatedTime}`);

    // Test 3: Check job status
    console.log('\n📊 Test 3: Checking job status...');
    const statusResponse = await fetch(`http://localhost:3000/api/ai/genre-swap/status/${job.jobId}`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log(`✅ Job status: ${status.status} (${status.progress}%)`);
      if (status.error) {
        console.log(`   Error: ${status.error}`);
      }
    } else {
      console.log('❌ Failed to get job status');
    }
  } else {
    const error = await jobResponse.json();
    console.log(`❌ Failed to submit job: ${error.error}`);
  }

  console.log('\n🎉 Genre swap API test completed!');
}

// Start the server and run tests
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('⏳ Waiting 2 seconds for server to start...\n');
  
  setTimeout(() => {
    testGenreSwap().catch(console.error);
  }, 2000);
}); 