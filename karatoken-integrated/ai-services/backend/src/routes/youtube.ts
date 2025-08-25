import ytdl from '@distube/ytdl-core';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import ytsr from 'ytsr';

const router = express.Router();

const DEFAULT_HEADERS = {
  'user-agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'accept-language': 'en-US,en;q=0.9',
};

router.get('/search', async (req: Request, res: Response) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.status(400).json({ ok: false, error: 'Missing q' });
  try {
    const search = await ytsr(q, { limit: 10 });
    const videos = (search.items || [])
      .filter(it => it.type === 'video')
      .map((v: any) => ({
        id: v.id,
        title: v.title,
        url: v.url,
        duration: v.duration,
        thumbnails: v.thumbnails,
        author: v.author && { name: v.author.name, url: v.author.url },
      }));
    return res.json({ ok: true, count: videos.length, items: videos });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

router.post('/download', async (req: Request, res: Response) => {
  try {
    const url = req.body && req.body.url ? String(req.body.url) : '';
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ ok: false, error: 'Invalid YouTube URL' });
    }
    const info = await ytdl.getInfo(url, { requestOptions: { headers: DEFAULT_HEADERS } });
    const titleSafe = (info.videoDetails.title || 'audio')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 80);
    const outDir = path.resolve(process.cwd(), 'tmp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${titleSafe}-${Date.now()}.mp3`);

    const stream = ytdl(url, {
      quality: 'highestaudio',
      requestOptions: { headers: DEFAULT_HEADERS },
    });
    const tmpPath = outPath.replace(/\.mp3$/i, '.webm');
    const write = fs.createWriteStream(tmpPath);

    await new Promise<void>((resolve, reject) => {
      stream.pipe(write);
      stream.on('error', reject);
      write.on('finish', () => resolve());
      write.on('error', reject);
    });

    const fileUrl = `/tmp/${path.basename(tmpPath)}`;
    return res.json({
      ok: true,
      file: tmpPath,
      url: fileUrl,
      title: info.videoDetails.title,
      id: info.videoDetails.videoId,
    });
  } catch (e: any) {
    const msg = e && e.message ? e.message : String(e);
    if (/Could not extract functions/i.test(msg) || /signature/i.test(msg)) {
      return res.status(500).json({
        ok: false,
        error: 'YouTube changed its player. Try updating ytdl-core to latest.',
      });
    }
    return res.status(500).json({ ok: false, error: msg });
  }
});

export default router;
