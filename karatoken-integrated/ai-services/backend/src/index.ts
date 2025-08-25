import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import fs from 'fs';
import morgan from 'morgan';
import path from 'path';

import genreRouter from './routes/genre';
import youtubeRouter from './routes/youtube';

dotenv.config();

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Serve the web preview static assets from the web directory in the project root
const PROJECT_ROOT = path.resolve(__dirname, '../../../../karatoken-integrated');
const WEB_DIR = path.join(PROJECT_ROOT, 'web');

if (fs.existsSync(WEB_DIR)) {
  console.log('Serving static web from:', WEB_DIR);
  app.use('/', express.static(WEB_DIR));
  // Fallback for root to ensure index.html is served
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(WEB_DIR, 'index.html'));
  });
} else {
  console.warn('Web directory not found, skipping static file serving:', WEB_DIR);
}

// Expose downloaded files under /tmp so web UI can reference them as URLs
const TMP_DIR = path.resolve(process.cwd(), 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
app.use('/tmp', express.static(TMP_DIR));
console.log('Exposing tmp files from:', TMP_DIR);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// API Routers
app.use('/api/youtube', youtubeRouter);
app.use('/api/genre', genreRouter);

// Simple health endpoint
app.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'karatoken-backend', time: new Date().toISOString() });
});

// Force-download helper
function safeJoin(base: string, target: string): string {
  const p = path.normalize(path.join(base, target));
  if (!p.startsWith(base)) throw new Error('Invalid path');
  return p;
}

app.get('/dl/*', (req: Request, res: Response) => {
  try {
    const rel = req.params[0] || '';
    const filePath = safeJoin(TMP_DIR, rel);
    return res.download(filePath, path.basename(filePath), err => {
      if (err) {
        if (!res.headersSent) res.status(404).json({ ok: false, error: 'File not found' });
      }
    });
  } catch (e: any) {
    return res.status(400).json({ ok: false, error: e?.message || 'Bad path' });
  }
});

// Placeholder Spotify OAuth callback
app.get('/api/spotify/callback', (req: Request, res: Response) => {
  const { code, state, error } = req.query;
  if (error) {
    return res.status(400).json({ ok: false, error });
  }
  return res.json({ ok: true, received: { code, state } });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

export default app; // Export for testing purposes
