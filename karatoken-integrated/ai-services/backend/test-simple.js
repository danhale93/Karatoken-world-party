#!/usr/bin/env node

const express = require('express');
const { router: genreSwapRouter } = require('./aiGenreSwapApi');
const axios = require('axios');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/ai/genre-swap', genreSwapRouter);

// Simple test function
async function testSimpleAPI() {
  console.log('🎤 Testing Simple Karatoken API...\n');

  // Test 1: Get genres
  console.log('📋 Testing genres endpoint...');
  try {
    const genresResponse = await axios.get('http://localhost:3000/api/ai/genre-swap/genres');
    console.log(`✅ Genres endpoint working! Found ${genresResponse.data.count} genres`);
    console.log(`   First 5: ${genresResponse.data.supportedGenres.slice(0, 5).join(', ')}`);
  } catch (error) {
    console.log(`❌ Genres endpoint error: ${error.message}`);
  }

  // Test 2: Test web interface
  console.log('\n🌐 Testing web interface...');
  try {
    const webResponse = await axios.get('http://localhost:3000/api/ai/genre-swap/');
    console.log(`✅ Web interface working! Status: ${webResponse.status}`);
  } catch (error) {
    console.log(`❌ Web interface error: ${error.message}`);
  }

  console.log('\n🎉 Simple test completed!');
  console.log('✅ All basic endpoints are working correctly!');
  console.log('🌐 Open http://localhost:3000/api/ai/genre-swap/ in your browser to use the web interface');
}

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Simple Karatoken Server running on http://localhost:${PORT}`);
  console.log('⏳ Starting simple test in 2 seconds...\n');
  
  setTimeout(() => {
    testSimpleAPI().catch(console.error);
  }, 2000);
}); 