module.exports = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:3000/api',
    endpoints: {
      youtube: {
        download: '/youtube/download'
      },
      genre: {
        swap: '/genre/swap',
        status: '/genre/status'
      },
      stylus: {
        transfer: '/stylus/transfer',
        status: '/stylus/status'
      }
    },
    timeout: 30000, // 30 seconds
    maxRetries: 3
  },
  
  // Test samples
  testSamples: [
    {
      name: 'Pop Sample',
      genre: 'pop',
      youtubeUrl: 'https://www.youtube.com/watch?v=example_pop',
      description: 'Upbeat pop song with clear vocals'
    },
    {
      name: 'Rock Sample',
      genre: 'rock',
      youtubeUrl: 'https://www.youtube.com/watch?v=example_rock',
      description: 'Classic rock track with electric guitars'
    },
    {
      name: 'Jazz Sample',
      genre: 'jazz',
      youtubeUrl: 'https://www.youtube.com/watch?v=example_jazz',
      description: 'Smooth jazz piece with piano and saxophone'
    }
  ],
  
  // Benchmark settings
  benchmark: {
    maxJobPollingAttempts: 60, // 5 minutes (5s * 60)
    pollingInterval: 5000, // 5 seconds
    outputDir: './results'
  }
};
