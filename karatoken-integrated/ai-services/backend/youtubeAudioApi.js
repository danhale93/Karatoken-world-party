// Express router for YouTube audio extraction
const express = require('express');
const router = express.Router();
const ytdl = require('ytdl-core');

// POST /api/youtube/extract-audio
router.post('/extract-audio', async (req, res) => {
  const { youtubeUrl } = req.body;
  if (!youtubeUrl || !ytdl.validateURL(youtubeUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  try {
    const info = await ytdl.getInfo(youtubeUrl);
    // Find the best audio-only format
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    if (!audioFormats.length) {
      return res.status(404).json({ error: 'No audio stream found' });
    }
    // Return the first audio format URL
    const audioUrl = audioFormats[0].url;
    res.json({ audioUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to extract audio', details: err.message });
  }
});

// GET /api/youtube/proxy-audio?youtubeUrl=...
// Streams the audio through the backend
router.get('/proxy-audio', async (req, res) => {
  const { youtubeUrl } = req.query;
  if (!youtubeUrl || !ytdl.validateURL(youtubeUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  try {
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    res.setHeader('Content-Type', 'audio/mpeg');
    ytdl(youtubeUrl, { filter: 'audioonly', quality: 'highestaudio' }).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to stream audio', details: err.message });
  }
});

module.exports = router;
