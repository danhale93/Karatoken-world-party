#!/usr/bin/env node

const express = require('express');
const { router: genreSwapRouter } = require('./aiGenreSwapApi');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai/genre-swap', genreSwapRouter);

// Simple test function
async function quickTest() {
  console.log('🎤 Quick Genre Swap Test...\n');

  // Test 1: Get genres
  console.log('📋 Getting supported genres...');
  const genresResponse = await fetch('http://localhost:3000/api/ai/genre-swap/genres');
  if (genresResponse.ok) {
    const genres = await genresResponse.json();
    console.log(`✅ Found ${genres.count} genres!`);
    console.log(`   First 5: ${genres.supportedGenres.slice(0, 5).join(', ')}`);
  }

  // Test 2: Submit a quick job
  console.log('\n🎵 Submitting test job...');
  const jobResponse = await fetch('http://localhost:3000/api/ai/genre-swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      targetGenre: 'rock'
    })
  });

  if (jobResponse.ok) {
    const job = await jobResponse.json();
    console.log(`✅ Job submitted! ID: ${job.jobId}`);
    
    // Wait a moment and check status
    setTimeout(async () => {
      const statusResponse = await fetch(`http://localhost:3000/api/ai/genre-swap/status/${job.jobId}`);
      if (statusResponse.ok) {
        const status = await statusResponse.json();
        console.log(`📊 Status: ${status.status} (${status.progress}%)`);
        if (status.error) {
          console.log(`   Error: ${status.error}`);
        }
      }
    }, 3000);
  }

  console.log('\n🎉 Test completed! Check the server logs for processing details.');
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('⏳ Starting test in 2 seconds...\n');
  
  setTimeout(() => {
    quickTest().catch(console.error);
  }, 2000);
}); 