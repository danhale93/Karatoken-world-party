#!/usr/bin/env node

const express = require('express');
const { router: genreSwapRouter } = require('./aiGenreSwapApi');
const axios = require('axios');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai/genre-swap', genreSwapRouter);

// Simple test function
async function testFixedAPI() {
  console.log('🎤 Testing Fixed Karatoken API...\n');

  // Test 1: Get genres
  console.log('📋 Testing genres endpoint...');
  try {
    const genresResponse = await axios.get('http://localhost:3000/api/ai/genre-swap/genres');
    console.log(`✅ Genres endpoint working! Found ${genresResponse.data.count} genres`);
    console.log(`   First 5: ${genresResponse.data.supportedGenres.slice(0, 5).join(', ')}`);
  } catch (error) {
    console.log(`❌ Genres endpoint error: ${error.message}`);
  }

  // Test 2: Submit a test job
  console.log('\n🎵 Testing job submission...');
  try {
    const jobResponse = await axios.post('http://localhost:3000/api/ai/genre-swap', {
      youtubeUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0', // PSY - GANGNAM STYLE
      targetGenre: 'rock'
    });

    console.log(`✅ Job submission working! Job ID: ${jobResponse.data.jobId}`);
    
    // Test 3: Check job status
    console.log('\n📊 Testing status endpoint...');
    setTimeout(async () => {
      try {
        const statusResponse = await axios.get(`http://localhost:3000/api/ai/genre-swap/status/${jobResponse.data.jobId}`);
        console.log(`✅ Status endpoint working! Status: ${statusResponse.data.status} (${statusResponse.data.progress}%)`);
        if (statusResponse.data.error) {
          console.log(`   Error: ${statusResponse.data.error}`);
        }
      } catch (error) {
        console.log(`❌ Status endpoint error: ${error.message}`);
      }
    }, 3000);
  } catch (error) {
    console.log(`❌ Job submission error: ${error.message}`);
  }

  console.log('\n🎉 Test completed! Check the server logs for processing details.');
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Fixed Karatoken Server running on http://localhost:${PORT}`);
  console.log('⏳ Starting test in 2 seconds...\n');
  
  setTimeout(() => {
    testFixedAPI().catch(console.error);
  }, 2000);
}); 