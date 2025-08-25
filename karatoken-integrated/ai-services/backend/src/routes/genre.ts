import fs from 'fs';
import { createServer } from 'http';
import path from 'path';

import express, { Request, Response, RequestHandler } from 'express';
import { Server } from 'socket.io';

// TODO: Uncomment when rate limiting is needed
// import rateLimit from 'express-rate-limit';

// Types
enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface JobResult {
  outputUrl?: string;
  lrcUrl?: string;
  vocalUrl?: string;
  instrumentalUrl?: string;
  newBackingUrl?: string;
}

interface Job {
  id: string;
  status: JobStatus;
  progress: number;
  params: {
    audioUrl: string;
    targetGenre: string;
    karaokeMode: boolean;
  };
  result: JobResult | null;
  error: string | null;
  log: string[];
  createdAt: string;
  updatedAt: string;
}

// Environment configuration - TODO: Implement these features
// const LYRICS_MODE = process.env.LYRICS_MODE || 'auto'; // local|cloud|auto
// const USE_OLLAMA = process.env.USE_OLLAMA === 'true';
// const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const CACHE_DIR = process.env.CACHE_DIR || path.join(process.cwd(), '.cache');
const ENABLE_CACHE = process.env.ENABLE_CACHE !== 'false';

// Ensure cache directory exists
if (ENABLE_CACHE && !fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const router = express.Router();
const jobs = new Map<string, Job>();

// TODO: Uncomment and implement rate limiting when needed
const apiLimiter: RequestHandler = (req, res, next) => next();
/*
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
});
*/

// Socket.IO setup
export let io: Server;

export const initSocketIO = (server: ReturnType<typeof createServer>) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  return io;
};


// Cache middleware
const cacheMiddleware: RequestHandler = async (req, res, next) => {
  if (!ENABLE_CACHE) return next();

  const { audioUrl, targetGenre } = req.body;
  if (!audioUrl || !targetGenre) return next();

  const cacheKey = `${audioUrl}-${targetGenre}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

  try {
    if (fs.existsSync(cachePath)) {
      const cachedData = JSON.parse(await fs.promises.readFile(cachePath, 'utf-8'));
      // eslint-disable-next-line no-console
      console.log(`Cache hit for ${cacheKey}`);
      return res.json({
        ...cachedData,
        cached: true,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Cache read error:', error);
  }

  next();
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const createJobId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

async function runGenreSwap(job: Job) {
  const { audioUrl, targetGenre } = job.params;

  try {
    job.status = JobStatus.PROCESSING;
    job.progress = 10;
    job.log.push('Downloading source audio...');
    await sleep(1000);

    const isLocalFile = !audioUrl.startsWith('http');
    let localAudioPath: string;

    if (isLocalFile) {
      localAudioPath = path.resolve(process.cwd(), audioUrl);
      if (!fs.existsSync(localAudioPath)) {
        throw new Error(`Local file not found: ${audioUrl}`);
      }
    } else {
      // Simulate download
      localAudioPath = path.join(process.cwd(), 'tmp', `download_${job.id}.mp3`);
    }

    job.progress = 25;
    job.log.push(`Source audio ready at: ${localAudioPath}`);
    await sleep(500);

    // Simulate AI processing steps
    job.log.push('Separating vocals and accompaniment...');
    await sleep(2000);
    job.progress = 50;
    const instrumentalPath = localAudioPath.replace('.mp3', '_instr.mp3');
    const vocalPath = localAudioPath.replace('.mp3', '_vocal.mp3');

    job.log.push(`Generating new ${targetGenre} backing track...`);
    await sleep(2000);
    job.progress = 75;
    const newBackingPath = localAudioPath.replace('.mp3', `_backing_${targetGenre}.mp3`);

    job.log.push('Transcribing lyrics...');
    await sleep(1500);
    job.progress = 90;
    const lrcPath = localAudioPath.replace('.mp3', '.lrc');

    job.log.push('Remixing final track...');
    await sleep(1000);
    job.progress = 95;
    const finalAudioPath = localAudioPath.replace('.mp3', `_final_${targetGenre}.mp3`);

    // Create dummy output files for simulation
    fs.writeFileSync(instrumentalPath, 'dummy instrumental');
    fs.writeFileSync(vocalPath, 'dummy vocal');
    fs.writeFileSync(newBackingPath, 'dummy backing');
    fs.writeFileSync(lrcPath, '[00:01.00] Hello world');
    fs.writeFileSync(finalAudioPath, 'dummy final audio');

    job.status = JobStatus.COMPLETED;
    job.progress = 100;
    job.result = {
      outputUrl: `/dl/${path.basename(finalAudioPath)}`,
      lrcUrl: `/dl/${path.basename(lrcPath)}`,
      vocalUrl: `/dl/${path.basename(vocalPath)}`,
      instrumentalUrl: `/dl/${path.basename(instrumentalPath)}`,
      newBackingUrl: `/dl/${path.basename(newBackingPath)}`,
    };
    job.log.push('Job completed successfully!');
  } catch (e: unknown) {
    const error = e as Error;
    job.status = JobStatus.FAILED;
    job.error = error.message;
    job.log.push(`Error: ${error.message}`);
  }
}

// Input validation middleware
const validateInput: RequestHandler = (req, res, next) => {
  const { audioUrl, targetGenre } = req.body;

  if (!audioUrl || typeof audioUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'Invalid audioUrl' });
  }
  if (!targetGenre || typeof targetGenre !== 'string') {
    return res.status(400).json({ ok: false, error: 'Invalid targetGenre' });
  }
  
  next();
};

router.post('/swap', apiLimiter, validateInput, cacheMiddleware, (req: Request, res: Response) => {
  const { audioUrl, targetGenre, karaokeMode = true } = req.body;

  const jobId = createJobId();
  const job: Job = {
    id: jobId,
    status: JobStatus.PENDING,
    progress: 0,
    params: { audioUrl, targetGenre, karaokeMode },
    result: null,
    error: null,
    log: [`Job created for ${audioUrl}`],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  jobs.set(jobId, job);

  // Do not await this, run in background
  runGenreSwap(job);

  return res.json({ ok: true, jobId });
});

router.get('/status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ ok: false, error: 'Job not found' });
  }

  return res.json({ ok: true, job });
});

export default router;
