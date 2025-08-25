const axios = require('axios');

class MCPClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000
    });
  }

  async processRequest(type, data) {
    try {
      console.log(`Sending ${type} request...`);
      const response = await this.client.post('/process', { type, data });
      console.log('Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Request failed:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  async testGenreSwap(audioUrl, genre) {
    return this.processRequest('current', { audioUrl, genre });
  }

  async testStylusTransfer(audioUrl, genre) {
    return this.processRequest('stylus', { 
      contentUrl: audioUrl,
      styleGenre: genre 
    });
  }
}

// Example usage
async function main() {
  const client = new MCPClient();
  
  // Test genre swap
  console.log('\n=== Testing Genre Swap ===');
  await client.testGenreSwap('https://example.com/audio1.mp3', 'pop');
  
  // Test Stylus transfer
  console.log('\n=== Testing Stylus Transfer ===');
  await client.testStylusTransfer('https://example.com/audio1.mp3', 'pop');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = MCPClient;
