const axios = require('axios');

async function checkHealth() {
  console.log('Checking API health...');
  
  try {
    // Test base URL
    console.log(`Testing connection to: http://localhost:3000`);
    const baseResponse = await axios.get('http://localhost:3000', { timeout: 5000 });
    console.log('✓ Base URL accessible');
    
    // Test API endpoints
    console.log('\nTesting API endpoints...');
    
    // Test YouTube download endpoint
    try {
      const ytResponse = await axios.get('http://localhost:3000/api/youtube/health', { timeout: 5000 });
      console.log('✓ YouTube endpoint:', ytResponse.data.status || 'OK');
    } catch (error) {
      console.log('✗ YouTube endpoint:', error.message);
    }
    
    // Test genre swap endpoint
    try {
      const genreResponse = await axios.get('http://localhost:3000/api/genre/health', { timeout: 5000 });
      console.log('✓ Genre endpoint:', genreResponse.data.status || 'OK');
    } catch (error) {
      console.log('✗ Genre endpoint:', error.message);
    }
    
    // Test Stylus endpoint
    try {
      const stylusResponse = await axios.get('http://localhost:3000/api/stylus/health', { timeout: 5000 });
      console.log('✓ Stylus endpoint:', stylusResponse.data.status || 'OK');
    } catch (error) {
      console.log('✗ Stylus endpoint:', error.message);
    }
    
  } catch (error) {
    console.error('\n❌ API is not accessible');
    console.error('Error:', error.message);
    console.log('\nPlease make sure the API server is running on http://localhost:3000');
    process.exit(1);
  }
}

checkHealth();
