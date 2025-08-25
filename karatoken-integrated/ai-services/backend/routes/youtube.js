const express = require('express');
const ytsr = require('ytsr');
let ytdl;
try {
  // Prefer maintained fork when available
  // eslint-disable-next-line import/no-extraneous-dependencies
  ytdl = require('@distube/ytdl-core');
  // eslint-disable-next-line no-console
  console.log('[youtube] Using @distube/ytdl-core');
} catch (_) {
  // Fallback to ytdl-core
  // eslint-disable-next-line import/no-extraneous-dependencies
  ytdl = require('ytdl-core');
  // eslint-disable-next-line no-console
  console.log('[youtube] Using ytdl-core');
}
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Use modern browser-like headers to avoid YouTube blocking and signature issues
const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

// GET /api/youtube/search?q=QUERY
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ ok: false, error: 'Missing q' });
  try {
    const search = await ytsr(q, { limit: 10 });
    const videos = (search.items || [])
      .filter((it) => it.type === 'video')
      .map((v) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        duration: v.duration,
        thumbnails: v.thumbnails,
        author: v.author && { name: v.author.name, url: v.author.url },
      }));
    res.json({ ok: true, count: videos.length, items: videos });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// POST /api/youtube/download { url }
// Downloads best audio to tmp and returns file path
router.post('/download', async (req, res) => {
  try {
    const url = (req.body && req.body.url) ? String(req.body.url) : '';
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ ok: false, error: 'Invalid YouTube URL' });
    }
    // Try fetching info with headers; ytdl-core sometimes fails without UA headers
    const info = await ytdl.getInfo(url, { requestOptions: { headers: DEFAULT_HEADERS } });
    const titleSafe = (info.videoDetails.title || 'audio')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 80);
    const outDir = path.resolve(process.cwd(), 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${titleSafe}-${Date.now()}.mp3`);

    const stream = ytdl(url, { quality: 'highestaudio', requestOptions: { headers: DEFAULT_HEADERS } });

    // If ffmpeg is available, you could transcode to mp3; as a simple start, just pipe as-is (may be webm).
    // For now, write the stream raw and use .webm extension; then we can add ffmpeg later.
    const tmpPath = outPath.replace(/\.mp3$/i, '.webm');
    const write = fs.createWriteStream(tmpPath);

    await new Promise((resolve, reject) => {
      stream.pipe(write);
      stream.on('error', reject);
      write.on('finish', resolve);
      write.on('error', reject);
    });

    const fileUrl = `/tmp/${path.basename(tmpPath)}`;
    return res.json({ ok: true, file: tmpPath, url: fileUrl, title: info.videoDetails.title, id: info.videoDetails.videoId });
  } catch (e) {
    // Surface a clearer message for common ytdl-core failures
    const msg = (e && e.message) ? e.message : String(e);
    if (/Could not extract functions/i.test(msg) || /signature/i.test(msg)) {
      return res.status(500).json({ ok: false, error: 'YouTube changed its player. Try updating ytdl-core to latest.' });
    }
    return res.status(500).json({ ok: false, error: msg });
  }
});

module.exports = router;
