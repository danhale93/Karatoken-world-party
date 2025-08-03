// Main backend server for Karatoken
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Routers
const { router: aiGenreSwapApi } = require('./aiGenreSwapApi');
const lyricsApi = require('./lyricsApi');
const youtubeAudioApi = require('./youtubeAudioApi');
const vocalIsolateApi = require('./vocalIsolateApi');
const battleApi = require('./battleApi');

// New AI integration routers
const vocalRemoverApi = require('./vocalRemoverApi');
const ultraSingerApi = require('./ultraSingerApi');
const aiScoringCoachApi = require('./aiScoringCoachApi');
const liveBattleApi = require('./liveBattleApi');
const tournamentApi = require('./tournamentApi');

// Use existing routers
app.use('/api/ai/genre-swap', aiGenreSwapApi);
app.use('/api/ai/vocal-isolate', vocalIsolateApi);
app.use('/api/lyrics', lyricsApi);
app.use('/api/youtube', youtubeAudioApi);
app.use('/api/battle', battleApi);

// Use new AI integration routers
app.use('/api/ai/vocal-remover', vocalRemoverApi);
app.use('/api/ai/ultra-singer', ultraSingerApi);
app.use('/api/ai/scoring-coach', aiScoringCoachApi);

// Live battle system
app.use('/api/live-battle', liveBattleApi);

// Tournament system
app.use('/api/tournaments', tournamentApi);

// Health check
app.get('/', (req, res) => res.send('Karatoken backend running'));

// Enhanced health check with AI services
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Karatoken Backend',
    version: '2.0.0',
    features: [
      'battle-system',
      'lyrics-api',
      'youtube-audio',
      'vocal-isolation',
      'ai-genre-swap',
      'vocal-remover',
      'ultra-singer',
      'ai-scoring-coach',
      'live-battle-system',
      'tournament-system'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
