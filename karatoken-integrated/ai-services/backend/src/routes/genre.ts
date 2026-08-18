import express, { Request, RequestHandler, Response } from 'express';
import fs from 'fs';
import { createServer } from 'http';
import path from 'path';
import { Server } from 'socket.io';

import { createRateLimiter } from '../services/rateLimiter';

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
const INITIAL_CWD = process.cwd();
const CACHE_DIR = process.env.CACHE_DIR || path.join(INITIAL_CWD, '.cache');
const ENABLE_CACHE = process.env.ENABLE_CACHE !== 'false';

// Ensure cache directory exists
if (ENABLE_CACHE && !fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const router = express.Router();
const jobs = new Map<string, Job>();

// In-memory rate limiting to mitigate DoS/abuse on the CPU-intensive genre swap route (CWE-400)
const apiLimiter = createRateLimiter(60000, 15); // 15 requests per minute

// Socket.IO setup
export let io: Server;

export const initSocketIO = (server: ReturnType<typeof createServer>) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  return io;
};

// Cache middleware
const cacheMiddleware: RequestHandler = async (req, res, next) => {
  if (!ENABLE_CACHE) return next();

  const { audioUrl, targetGenre } = req.body;
  if (!audioUrl || !targetGenre) return next();

  const cacheKey = `${audioUrl}-${targetGenre}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const cacheDir = process.env.CACHE_DIR || path.join(process.cwd(), '.cache');
  const cachePath = path.join(cacheDir, `${cacheKey}.json`);

  try {
    if (fs.existsSync(cachePath)) {
      const cachedData = JSON.parse(await fs.promises.readFile(cachePath, 'utf-8'));
      // eslint-disable-next-line no-console
      console.log(`Cache hit for ${cacheKey}`);

      // ⚡ Bolt Optimization: Add the cached job to the in-memory map so `/status/:jobId` works instantly
      if (cachedData && cachedData.jobId && cachedData.job) {
        jobs.set(cachedData.jobId, cachedData.job);
      }

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
  // ⚡ Bolt Optimization: Fast resolution in test environment to avoid stalling tests
  const duration = process.env.NODE_ENV === 'test' ? 5 : ms;
  return new Promise(resolve => setTimeout(resolve, duration));
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
      localAudioPath = path.resolve(INITIAL_CWD, audioUrl);
      // Ensure the resolved path remains within the project directory to prevent path traversal
      const relative = path.relative(INITIAL_CWD, localAudioPath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error('Access denied: Invalid file path');
      }
      if (!fs.existsSync(localAudioPath)) {
        throw new Error(`Local file not found: ${audioUrl}`);
      }
      // Ensure the path is actually a regular file and not a directory to prevent arbitrary directory manipulation
      const stat = fs.statSync(localAudioPath);
      if (!stat.isFile()) {
        throw new Error('Access denied: Path is not a regular file');
      }
      // Ensure the file has a valid audio extension to prevent no-op replacements overwriting critical project files
      const allowedExtensions = ['.mp3', '.wav', '.webm', '.ogg', '.m4a', '.aac', '.flac'];
      const ext = path.extname(localAudioPath).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        throw new Error(
          'Access denied: File must be a valid audio file (.mp3, .wav, .webm, .ogg, .m4a, .aac, .flac)'
        );
      }
    } else {
      // Simulate download
      localAudioPath = path.join(INITIAL_CWD, 'tmp', `download_${job.id}.mp3`);
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

    // ⚡ Bolt Optimization: Cache the completed job parameters and result to disk
    if (ENABLE_CACHE) {
      const cacheKey = `${audioUrl}-${targetGenre}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const cacheDir = process.env.CACHE_DIR || path.join(process.cwd(), '.cache');
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      const cachePath = path.join(cacheDir, `${cacheKey}.json`);
      try {
        const cacheData = {
          ok: true,
          jobId: job.id,
          job,
        };
        await fs.promises.writeFile(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
      } catch (cacheError) {
        // eslint-disable-next-line no-console
        console.error('Cache write error:', cacheError);
      }
    }
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

  // Validate targetGenre characters to prevent command injection, traversal, or special characters injection
  if (!/^[a-zA-Z0-9\s_-]+$/.test(targetGenre)) {
    return res.status(400).json({ ok: false, error: 'Invalid targetGenre format' });
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
