// Express router for lyrics fetching
const express = require('express');
const router = express.Router();

// POST /api/lyrics/fetch
router.post('/fetch', async (req, res) => {
  // TODO: Integrate with a real lyrics API or YouTube captions
  // Accepts: youtubeUrl
  // Returns: { lines: [{ time, text }] }
  const { youtubeUrl } = req.body;
  // Stub: return dummy lyrics
  res.json({
    lines: [
      { time: 0, text: 'Sample lyric line 1' },
      { time: 5, text: 'Sample lyric line 2' },
      { time: 10, text: 'Sample lyric line 3' },
    ]
  });
});

module.exports = router;
