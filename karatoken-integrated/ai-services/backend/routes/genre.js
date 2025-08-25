const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
// Hosted services (Replicate). Optional; code falls back if not configured.
let generateBacking;
let separateAudio;
let transcribeToLrc;
let remixTracks;
try {
  ({ generateBacking } = require('../services/musicgen'));
} catch (_) {}
try {
  ({ separateAudio } = require('../services/separation'));
} catch (_) {}
try {
  ({ transcribeToLrc } = require('../services/lyrics'));
} catch (_) {}
try {
  ({ remixTracks } = require('../services/remix'));
} catch (_) {}

// In-memory job store and statuses
const jobs = new Map();
const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// Optional: self-hosted local ML backend (instead of Replicate)
const LOCAL_ML_BASE_URL = process.env.LOCAL_ML_BASE_URL || null;
const USE_LOCAL = (process.env.AUDIO_BACKEND || '').toLowerCase() === 'local' && !!LOCAL_ML_BASE_URL;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

async function callLocal(endpoint, payload) {
  const urlStr = `${LOCAL_ML_BASE_URL}${endpoint}`;
  const u = new URL(urlStr);
  const isHttps = u.protocol === 'https:';
  const options = {
    method: 'POST',
    hostname: u.hostname,
    port: u.port ? Number(u.port) : (isHttps ? 443 : 80),
    path: u.pathname + (u.search || ''),
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const body = JSON.stringify(payload || {});
  options.headers['Content-Length'] = Buffer.byteLength(body);

  const mod = isHttps ? https : http;
  const TIMEOUT_MS = 30000;
  const resBody = await new Promise((resolve, reject) => {
    const req = mod.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(new Error(`Local ML ${endpoint} HTTP ${res.statusCode}`));
        }
        resolve(data);
      });
    });
    req.on('error', reject);
    req.setTimeout(TIMEOUT_MS, () => {
      try { req.destroy(new Error('Local ML request timeout')); } catch (_) {}
    });
    req.write(body);
    req.end();
  });
  let json = null;
  try { json = JSON.parse(resBody); } catch (e) {
    throw new Error(`Local ML ${endpoint} invalid JSON response`);
  }
  if (!json || json.ok === false) throw new Error(json?.error || `Local ML ${endpoint} failed`);
  return json;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function createJobId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function downloadToFile(url, dest) {
  const proto = url.startsWith('https') ? https : http;
  const TIMEOUT_MS = 20000; // 20s safety timeout to avoid hanging jobs
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = proto.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.on('error', (err) => {
        try { file.close(() => fs.unlink(dest, () => {})); } catch {}
        reject(err);
      });
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    // Abort if the request stalls too long
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error('Request timeout'));
    });
    req.on('error', (err) => {
      try { file.close(() => fs.unlink(dest, () => {})); } catch {}
      reject(err);
    });
  });
  return dest;
}

// POST /api/genre/swap
// Creates an async job that simulates the multi-step genre swap pipeline.
router.post('/swap', async (req, res) => {
  try {
    const { audioUrl, targetGenre, karaokeMode = true } = req.body || {};
    if (!audioUrl || !targetGenre) {
      return res.status(400).json({ ok: false, error: 'Missing audioUrl or targetGenre' });
    }

    const jobId = createJobId();
    const now = Date.now();
    const outDir = path.resolve(process.cwd(), 'tmp', 'genre', jobId);
    fs.mkdirSync(outDir, { recursive: true });

    const job = {
      id: jobId,
      status: JOB_STATUS.PENDING,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      audioUrl,
      targetGenre,
      karaokeMode: Boolean(karaokeMode),
      outputDir: outDir,
      outputPath: null,
      lrcPath: null,
      error: null,
    };
    jobs.set(jobId, job);

    // Respond immediately with job info and status URL
    res.json({ ok: true, jobId, statusUrl: `/api/genre/status/${jobId}` });

    // Background simulated processing
    (async () => {
      try {
        // 1. Start processing
        job.status = JOB_STATUS.PROCESSING;
        job.progress = 10;
        job.updatedAt = Date.now();
        jobs.set(jobId, job);

        // 2. Validate/prepare audio: copy local /tmp file or download remote URL
        await sleep(500);
        const TMP_DIR = path.resolve(process.cwd(), 'tmp');
        try {
          const inUrl = String(job.audioUrl || '');
          const urlObj = new URL(inUrl, 'http://localhost:3000');
          let srcLocalPath = null;
          if (urlObj.pathname.startsWith('/tmp/')) {
            const base = path.basename(urlObj.pathname);
            const candidate = path.join(TMP_DIR, base);
            if (fs.existsSync(candidate)) srcLocalPath = candidate;
          }
          let preparedPath;
          if (srcLocalPath) {
            preparedPath = path.join(outDir, path.basename(srcLocalPath));
            try { fs.copyFileSync(srcLocalPath, preparedPath); } catch (_) {}
          } else {
            const ext = path.extname(urlObj.pathname) || '.bin';
            preparedPath = path.join(outDir, `source${ext}`);
            try { await downloadToFile(inUrl, preparedPath); } catch (_) { /* ignore for simulation */ }
          }
          if (preparedPath && fs.existsSync(preparedPath)) {
            job.sourcePath = preparedPath;
          }
        } catch (_) {}
        job.progress = 30;
        job.updatedAt = Date.now();
        jobs.set(jobId, job);

        // 3. Separation (Demucs hosted if available)
        await sleep(200);
        try {
          // Prefer local ML if configured
          if (USE_LOCAL && job.sourcePath && fs.existsSync(job.sourcePath)) {
            job.progress = 42;
            job.updatedAt = Date.now();
            jobs.set(jobId, job);

            try {
              const srcUrl = `${PUBLIC_BASE_URL}/tmp/genre/${job.id}/${path.basename(job.sourcePath)}`;
              const resp = await callLocal('/separate', { audio_url: srcUrl });
              // Expect resp to contain vocals_url and/or instrumental_url
              if (resp.vocals_url) {
                const p = path.join(outDir, 'vocals.wav');
                await downloadToFile(resp.vocals_url, p);
                job.vocalsPath = p;
              }
              if (resp.instrumental_url) {
                const p = path.join(outDir, 'instrumental_sep.wav');
                await downloadToFile(resp.instrumental_url, p);
                job.instrumentalSepPath = p;
              }
            } catch (e) {
              console.warn('[genre] Local separation failed, trying Replicate/fallback:', e?.message || e);
            }
          }

          const token = process.env.REPLICATE_API_TOKEN;
          const demucsModel = process.env.REPLICATE_DEMUCS_MODEL;
          if (!job.vocalsPath && !job.instrumentalSepPath && token && demucsModel && typeof separateAudio === 'function' && job.sourcePath && fs.existsSync(job.sourcePath)) {
            job.progress = 45;
            job.updatedAt = Date.now();
            jobs.set(jobId, job);

            try {
              const { vocalsPath, instrumentalPath } = await separateAudio({ sourcePath: job.sourcePath, outDir });
              if (vocalsPath) job.vocalsPath = vocalsPath;
              if (instrumentalPath) job.instrumentalSepPath = instrumentalPath;
            } catch (sepErr) {
              console.warn('[genre] Demucs separation failed, continuing:', sepErr?.message || sepErr);
            }
          }
        } catch (_) {}
        job.progress = 55;
        job.updatedAt = Date.now();
        jobs.set(jobId, job);

        // 4. Genre generation
        // Try hosted MusicGen when configured, otherwise fallback to copying source
        await sleep(200);
        let instrumentalPath = null;
        try {
          // Prefer local ML MusicGen if configured
          if (USE_LOCAL) {
            job.progress = 60;
            job.updatedAt = Date.now();
            jobs.set(jobId, job);

            try {
              const prompt = `${job.targetGenre} backing track, no vocals, clean mix, radio ready`;
              const resp = await callLocal('/musicgen', { prompt });
              if (resp && resp.audio_url) {
                const outWav = path.join(outDir, 'instrumental_processed.wav');
                await downloadToFile(resp.audio_url, outWav);
                instrumentalPath = outWav;
              }
            } catch (e) {
              console.warn('[genre] Local MusicGen failed, trying Replicate/fallback:', e?.message || e);
            }
          }

          const token = process.env.REPLICATE_API_TOKEN;
          const mgModel = process.env.REPLICATE_MUSICGEN_MODEL;
          if (!instrumentalPath && token && mgModel && typeof generateBacking === 'function') {
            job.progress = 62;
            job.updatedAt = Date.now();
            jobs.set(jobId, job);

            const prompt = `${job.targetGenre} backing track, no vocals, clean mix, radio ready`;
            const outWav = path.join(outDir, 'instrumental_processed.wav');
            try {
              instrumentalPath = await generateBacking({ prompt, outPath: outWav });
            } catch (genErr) {
              console.warn('[genre] MusicGen failed, falling back:', genErr?.message || genErr);
            }
          }

          // Fallback: copy prepared source as processed output
          if (!instrumentalPath) {
            const outExt = job.sourcePath ? (path.extname(job.sourcePath) || '.webm') : '.webm';
            instrumentalPath = path.join(outDir, `instrumental_processed${outExt}`);
            if (job.sourcePath && fs.existsSync(job.sourcePath)) {
              fs.copyFileSync(job.sourcePath, instrumentalPath);
            } else {
              // If no source is available, leave a small placeholder so the flow completes
              fs.writeFileSync(instrumentalPath, Buffer.from('processed'));
            }
          }
        } catch (_) {}
        // 4b. Remix vocals over generated backing if we have separated vocals
        let finalOutputPath = instrumentalPath;
        try {
          if (typeof remixTracks === 'function' && job.vocalsPath && fs.existsSync(job.vocalsPath) && instrumentalPath && fs.existsSync(instrumentalPath)) {
            job.progress = 75;
            job.updatedAt = Date.now();
            jobs.set(jobId, job);

            const mixOut = path.join(outDir, 'genre_mix.wav');
            try {
              finalOutputPath = await remixTracks({ vocalsPath: job.vocalsPath, backingPath: instrumentalPath, outPath: mixOut });
            } catch (mixErr) {
              console.warn('[genre] Remix failed, using backing only:', mixErr?.message || mixErr);
            }
          }
        } catch (_) {}
        job.outputPath = finalOutputPath;
        job.progress = 80;
        job.updatedAt = Date.now();
        jobs.set(jobId, job);

        // 5. Lyrics transcription -> LRC (Whisper hosted if available)
        if (job.karaokeMode) {
          const token = process.env.REPLICATE_API_TOKEN;
          const whisperModel = process.env.REPLICATE_WHISPER_MODEL;
          const transcriptSource = job.vocalsPath && fs.existsSync(job.vocalsPath) ? job.vocalsPath : job.sourcePath;
          let lrcPath = null;
          // Prefer local ML transcription if configured
          if (USE_LOCAL && transcriptSource && fs.existsSync(transcriptSource)) {
            try {
              job.progress = 86;
              job.updatedAt = Date.now();
              jobs.set(jobId, job);

              const srcUrl = `${PUBLIC_BASE_URL}/tmp/genre/${job.id}/${path.basename(transcriptSource)}`;
              const resp = await callLocal('/transcribe', { audio_url: srcUrl, format: 'lrc' });
              // Accept lrc text directly, or srt_url, or text
              let lrcContent = null;
              if (typeof resp.lrc === 'string' && resp.lrc.trim()) {
                lrcContent = resp.lrc;
              } else if (resp.srt_url) {
                const tmpSrt = path.join(outDir, 'whisper_output.txt');
                await downloadToFile(resp.srt_url, tmpSrt);
                try { lrcContent = require('../services/lyrics').srtToLrc(fs.readFileSync(tmpSrt, 'utf8')); } catch {}
              } else if (typeof resp.text === 'string') {
                lrcContent = `[00:00.00] ${resp.text.replace(/\r?\n/g, ' ').trim()}`;
              }
              if (lrcContent) {
                const p = path.join(outDir, 'lyrics.lrc');
                fs.writeFileSync(p, lrcContent);
                lrcPath = p;
              }
            } catch (e) {
              console.warn('[genre] Local transcription failed, trying Replicate/mock:', e?.message || e);
            }
          }

          if (!lrcPath && token && whisperModel && typeof transcribeToLrc === 'function' && transcriptSource && fs.existsSync(transcriptSource)) {
            try {
              job.progress = 88;
              job.updatedAt = Date.now();
              jobs.set(jobId, job);
              lrcPath = await transcribeToLrc({ sourcePath: transcriptSource, outDir });
            } catch (txErr) {
              console.warn('[genre] Whisper transcription failed, falling back to mock:', txErr?.message || txErr);
            }
          }
          if (!lrcPath) {
            // Fallback mock LRC
            await sleep(300);
            lrcPath = path.join(outDir, 'lyrics_mock.lrc');
            const lrcContent = `[ar:Unknown]\n[ti:Generated]\n[00:00.00] Karaoke lyrics will appear here...`;
            try { fs.writeFileSync(lrcPath, lrcContent); } catch (_) {}
          }
          job.lrcPath = lrcPath;
        }

        // 6. Complete
        job.status = JOB_STATUS.COMPLETED;
        job.progress = 100;
        job.updatedAt = Date.now();
        jobs.set(jobId, job);
      } catch (err) {
        job.status = JOB_STATUS.FAILED;
        job.error = err && err.message ? err.message : String(err);
        job.updatedAt = Date.now();
        jobs.set(jobId, job);
      }
    })();
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

// GET /api/genre/status/:jobId
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobs.get(jobId);
    if (!job) return res.status(404).json({ ok: false, error: 'Job not found' });

    // Hide internal paths; expose web-accessible URLs when available
    const response = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      targetGenre: job.targetGenre,
      karaokeMode: job.karaokeMode,
      // If files exist, expose them via /tmp static route
      outputUrl: job.outputPath ? `/tmp/genre/${job.id}/${path.basename(job.outputPath)}` : null,
      lrcUrl: job.lrcPath ? `/tmp/genre/${job.id}/${path.basename(job.lrcPath)}` : null,
      error: job.error,
    };
    return res.json({ ok: true, job: response });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e?.message || 'Internal error' });
  }
});

module.exports = router;
