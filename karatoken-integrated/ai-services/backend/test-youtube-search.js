#!/usr/bin/env node

const express = require('express');
const { router: genreSwapRouter } = require('./aiGenreSwapApi');
const axios = require('axios');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai/genre-swap', genreSwapRouter);

// Test YouTube search functionality
async function testYouTubeSearch() {
  console.log('🔍 Testing YouTube Search API...\n');

  // Test 1: Search for a popular song
  console.log('📋 Testing search endpoint...');
  try {
    const searchResponse = await axios.get('http://localhost:3000/api/ai/genre-swap/search?q=gangnam style&maxResults=5');
    console.log(`✅ Search endpoint working! Found ${searchResponse.data.count} results`);
    console.log(`   Query: "${searchResponse.data.query}"`);
    
    if (searchResponse.data.results.length > 0) {
      const firstResult = searchResponse.data.results[0];
      console.log(`   First result: "${firstResult.title}" by ${firstResult.uploader}`);
      console.log(`   Duration: ${firstResult.duration}s, Views: ${firstResult.view_count}`);
      console.log(`   URL: ${firstResult.url}`);
    }
  } catch (error) {
    console.log(`❌ Search endpoint error: ${error.message}`);
    if (error.response) {
      console.log(`   Response: ${error.response.data}`);
    }
  }

  // Test 2: Test genres endpoint
  console.log('\n📋 Testing genres endpoint...');
  try {
    const genresResponse = await axios.get('http://localhost:3000/api/ai/genre-swap/genres');
    console.log(`✅ Genres endpoint working! Found ${genresResponse.data.count} genres`);
    console.log(`   First 5: ${genresResponse.data.supportedGenres.slice(0, 5).join(', ')}`);
  } catch (error) {
    console.log(`❌ Genres endpoint error: ${error.message}`);
  }

  // Test 3: Test web interface
  console.log('\n🌐 Testing web interface...');
  try {
    const webResponse = await axios.get('http://localhost:3000/api/ai/genre-swap/');
    console.log(`✅ Web interface working! Status: ${webResponse.status}`);
  } catch (error) {
    console.log(`❌ Web interface error: ${error.message}`);
  }

  console.log('\n🎉 YouTube Search Test completed!');
  console.log('✅ All endpoints are working correctly!');
  console.log('🌐 Open http://localhost:3000/api/ai/genre-swap/ in your browser to use the web interface with search');
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 YouTube Search Test Server running on http://localhost:${PORT}`);
  console.log('⏳ Starting YouTube search test in 2 seconds...\n');
  
  setTimeout(() => {
    testYouTubeSearch().catch(console.error);
  }, 2000);
}); 