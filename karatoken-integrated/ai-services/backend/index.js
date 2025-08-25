require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve the web preview static assets from the web directory in the project root
const PROJECT_ROOT = path.resolve(__dirname, '../../../karatoken-integrated');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');
console.log('Project root:', PROJECT_ROOT);
console.log('Web directory:', WEB_DIR);
console.log('Directory exists:', require('fs').existsSync(WEB_DIR) ? 'Yes' : 'No');
app.use('/', express.static(WEB_DIR));
console.log('Serving static web from:', WEB_DIR);

// Fallback for root to ensure index.html is served
app.get('/', (req, res) => {
  res.sendFile(path.join(WEB_DIR, 'index.html'));
});

// Expose downloaded files under /tmp so web UI can reference them as URLs
const TMP_DIR = path.resolve(process.cwd(), 'tmp');
app.use('/tmp', express.static(TMP_DIR));
console.log('Exposing tmp files from:', TMP_DIR);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Simple health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'karatoken-backend', time: new Date().toISOString() });
});

// Force-download helper to avoid the browser trying to stream tiny/invalid files
function safeJoin(base, target) {
  const p = path.normalize(path.join(base, target));
  if (!p.startsWith(base)) throw new Error('Invalid path');
  return p;
}
app.get('/dl/*', (req, res) => {
  try {
    const rel = req.params[0] || '';
    const filePath = safeJoin(TMP_DIR, rel);
    return res.download(filePath, path.basename(filePath), (err) => {
      if (err) {
        if (!res.headersSent) res.status(404).json({ ok: false, error: 'File not found' });
      }
    });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e?.message || 'Bad path' });
  }
});

// Placeholder Spotify OAuth callback to validate redirect
// e.g., http://localhost:3000/api/spotify/callback?code=XYZ&state=ABC
app.get('/api/spotify/callback', (req, res) => {
  const { code, state, error } = req.query;
  if (error) {
    return res.status(400).json({ ok: false, error });
  }
  return res.json({ ok: true, received: { code, state } });
});

// YouTube routes (search, download)
const youtubeRouter = require('./routes/youtube');
app.use('/api/youtube', youtubeRouter);

// Genre routes (swap)
const genreRouter = require('./routes/genre');
app.use('/api/genre', genreRouter);

app.listen(PORT, () => {
  // Important: match VS Code problemMatcher begins/ends pattern
  console.log(`Backend listening on port ${PORT}`);
});

