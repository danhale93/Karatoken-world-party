
const express = require('express');
const router = express.Router();
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const rateLimit = require('express-rate-limit');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ffmpeg = require('fluent-ffmpeg');

// Set FFmpeg path for Windows
const ffmpegPath = process.env.FFMPEG_PATH || `${process.env.LOCALAPPDATA}\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-7.1.1-full_build\\bin\\ffmpeg.exe`;
ffmpeg.setFfmpegPath(ffmpegPath);
const { PythonShell } = require('python-shell');
const temp = require('temp');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configure temp directory
temp.track();

const sanitizeGenre = (genre) => {
  return String(genre).replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
};

const isValidYouTubeUrl = (url) => {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url);
};

const SUPPORTED_GENRES = [
  'pop', 'rock', 'hiphop', 'jazz', 'classical', 'country', 'electronic', 'reggae', 'blues', 'funk',
  'soul', 'rnb', 'metal', 'punk', 'disco', 'folk', 'gospel', 'latin', 'kpop', 'jpop', 'edm', 'house',
  'techno', 'trance', 'dubstep', 'drumandbass', 'ambient', 'ska', 'bluegrass', 'opera', 'grunge',
  'indie', 'synthwave', 'trap', 'afrobeat', 'salsa', 'bossa', 'flamenco', 'tango', 'chillout',
  'lofi', 'world', 'celtic', 'march', 'polka', 'swing', 'motown', 'newage', 'soundtrack', 'children'
];

const isValidGenre = (genre) => SUPPORTED_GENRES.includes(genre);

// In-memory job status tracker (in production, use Redis or database)
const jobStatus = {};

// Rate limiting: 5 requests per 15 minutes per IP
const swapLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many genre swap requests, please try again later.'
});

class GenreSwapProcessor {
  constructor(jobId, youtubeUrl, targetGenre) {
    this.jobId = jobId;
    this.youtubeUrl = youtubeUrl;
    this.targetGenre = targetGenre;
    this.workDir = null;
    this.ytdlp = new YTDlpWrap();
  }

  async updateStatus(status, progress, error = null) {
    jobStatus[this.jobId] = { status, progress, error, timestamp: Date.now() };
    console.log(`Job ${this.jobId}: ${status} (${progress}%)`);
  }

  async downloadFromYouTube() {
    await this.updateStatus('downloading', 10);
    
    const options = {
      format: 'bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio/best',
      extractAudio: true,
      audioFormat: 'wav',
      audioQuality: '0',
      output: path.join(this.workDir, 'original_audio.%(ext)s')
    };

    try {
      // Use python -m yt_dlp instead of direct yt-dlp
      const ytdlpArgs = [
        '-m', 'yt_dlp',
        this.youtubeUrl,
        ...this.buildYtdlpArgs(options)
      ];
      
      await new Promise((resolve, reject) => {
        console.log('Starting yt-dlp with args:', ytdlpArgs.join(' '));
        const ytdlpProcess = spawn('python', ytdlpArgs, { cwd: this.workDir });
        
        ytdlpProcess.stdout.on('data', (data) => {
          console.log(`yt-dlp: ${data}`);
        });
        
        ytdlpProcess.stderr.on('data', (data) => {
          console.log(`yt-dlp stderr: ${data}`);
        });
        
        ytdlpProcess.on('close', (code) => {
          console.log(`yt-dlp process exited with code: ${code}`);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`yt-dlp failed with code ${code}`));
          }
        });
        
        ytdlpProcess.on('error', (error) => {
          console.log(`yt-dlp spawn error: ${error.message}`);
          reject(new Error(`yt-dlp error: ${error.message}`));
        });
      });
      
      // Wait a moment for file to be written
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if file exists, if not, look for alternative names
      let audioPath = path.join(this.workDir, 'original_audio.wav');
      if (!await fs.pathExists(audioPath)) {
        // Look for any audio file in the directory
        const files = await fs.readdir(this.workDir);
        const audioFile = files.find(f => 
          f.endsWith('.wav') || 
          f.endsWith('.m4a') || 
          f.endsWith('.mp3') || 
          f.endsWith('.webm') ||
          f.endsWith('.ogg')
        );
        if (audioFile) {
          audioPath = path.join(this.workDir, audioFile);
          console.log(`Found audio file: ${audioFile}`);
        } else {
          console.log('Available files:', files);
          throw new Error('No audio file found after download');
        }
      }
      
      await this.updateStatus('downloading', 20);
      
      // Convert to WAV if needed
      if (!audioPath.endsWith('.wav')) {
        const wavPath = path.join(this.workDir, 'original_audio.wav');
        console.log(`Converting ${audioPath} to WAV format...`);
        await this.convertToWav(audioPath, wavPath);
        audioPath = wavPath;
      }
      
      return audioPath;
    } catch (error) {
      throw new Error(`YouTube download failed: ${error.message}`);
    }
  }

  async convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('ffmpeg', [
        '-i', inputPath,
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '2',
        outputPath,
        '-y'
      ]);

      ffmpegProcess.stdout.on('data', (data) => {
        console.log(`FFmpeg: ${data}`);
      });

      ffmpegProcess.stderr.on('data', (data) => {
        console.log(`FFmpeg stderr: ${data}`);
      });

      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Audio conversion completed');
          resolve();
        } else {
          reject(new Error(`FFmpeg conversion failed with code ${code}`));
        }
      });

      ffmpegProcess.on('error', (error) => {
        reject(new Error(`FFmpeg error: ${error.message}`));
      });
    });
  }

  buildYtdlpArgs(options) {
    const args = [];
    if (options.format) args.push('-f', options.format);
    if (options.extractAudio) args.push('--extract-audio');
    if (options.audioFormat) args.push('--audio-format', options.audioFormat);
    if (options.audioQuality) args.push('--audio-quality', options.audioQuality);
    if (options.output) args.push('-o', options.output);
    // Add additional arguments to ensure we get audio
    args.push('--no-playlist'); // Don't download playlists
    args.push('--no-warnings'); // Reduce warning spam
    args.push('--quiet'); // Reduce output
    args.push('--extract-audio'); // Force audio extraction
    args.push('--audio-format', 'wav'); // Force WAV format
    args.push('--audio-quality', '0'); // Best quality
    return args;
  }

  async separateStems() {
    await this.updateStatus('separating_stems', 30);
    
    // Find the actual audio file name
    const files = await fs.readdir(this.workDir);
    const audioFile = files.find(f => 
      f.endsWith('.wav') || 
      f.endsWith('.m4a') || 
      f.endsWith('.mp3') || 
      f.endsWith('.webm') ||
      f.endsWith('.ogg')
    );
    if (!audioFile) {
      console.log('Available files for separation:', files);
      throw new Error('No audio file found for separation');
    }
    const audioPath = path.join(this.workDir, audioFile);
    console.log(`Using audio file for separation: ${audioFile}`);
    
    return new Promise((resolve, reject) => {
      const demucsProcess = spawn('python', ['-m', 'demucs',
        '--two-stems=vocals',
        '--out', this.workDir,
        audioPath
      ]);

      demucsProcess.stdout.on('data', (data) => {
        console.log(`Demucs: ${data}`);
      });

      demucsProcess.stderr.on('data', (data) => {
        console.log(`Demucs stderr: ${data}`);
      });

             demucsProcess.on('close', async (code) => {
         if (code === 0) {
           try {
             // Find the separated files
             const separatedDir = path.join(this.workDir, 'separated', 'htdemucs');
             if (await fs.pathExists(separatedDir)) {
               const subdirs = await fs.readdir(separatedDir);
               if (subdirs.length > 0) {
                 const subdir = subdirs[0];
                 const vocalsPath = path.join(separatedDir, subdir, 'vocals.wav');
                 const instrumentalPath = path.join(separatedDir, subdir, 'no_vocals.wav');
                 
                 if (await fs.pathExists(vocalsPath) && await fs.pathExists(instrumentalPath)) {
                   resolve({
                     vocals: vocalsPath,
                     instrumental: instrumentalPath
                   });
                 } else {
                   reject(new Error('Separated audio files not found'));
                 }
               } else {
                 reject(new Error('No separation subdirectory found'));
               }
             } else {
               reject(new Error('Separation directory not found'));
             }
           } catch (error) {
             reject(new Error(`Error finding separated files: ${error.message}`));
           }
         } else {
           reject(new Error(`Demucs failed with code ${code}`));
         }
       });
    });
  }

  async transcribeLyrics(audioPath) {
    await this.updateStatus('transcribing', 50);
    
    // Use the vocals file if it exists, otherwise use the original audio
    let transcriptionAudioPath = audioPath;
    const separatedDir = path.join(this.workDir, 'separated', 'htdemucs');
    if (await fs.pathExists(separatedDir)) {
      const subdirs = await fs.readdir(separatedDir);
      if (subdirs.length > 0) {
        const vocalsPath = path.join(separatedDir, subdirs[0], 'vocals.wav');
        if (await fs.pathExists(vocalsPath)) {
          transcriptionAudioPath = vocalsPath;
        }
      }
    }
    
    return new Promise((resolve, reject) => {
      const whisperProcess = spawn('python', ['-m', 'whisper',
        transcriptionAudioPath,
        '--model', 'base',
        '--output_format', 'json',
        '--output_dir', this.workDir
      ]);

      whisperProcess.stdout.on('data', (data) => {
        console.log(`Whisper: ${data}`);
      });

      whisperProcess.stderr.on('data', (data) => {
        console.log(`Whisper stderr: ${data}`);
      });

             whisperProcess.on('close', async (code) => {
         if (code === 0) {
           try {
             // Find the transcription file
             const files = await fs.readdir(this.workDir);
             const jsonFile = files.find(f => f.endsWith('.json'));
             if (!jsonFile) {
               reject(new Error('No transcription file found'));
               return;
             }
             const transcriptionPath = path.join(this.workDir, jsonFile);
             const transcription = JSON.parse(fs.readFileSync(transcriptionPath, 'utf8'));
             resolve(transcription);
           } catch (error) {
             reject(new Error(`Failed to read transcription: ${error.message}`));
           }
         } else {
           reject(new Error(`Whisper failed with code ${code}`));
         }
       });
    });
  }

  async applyGenreTransfer(instrumentalPath) {
    await this.updateStatus('applying_genre_transfer', 70);
    
    // This is where you'd integrate with a genre transfer model
    // For now, we'll use a simplified approach with audio effects
    const outputPath = path.join(this.workDir, 'genre_swapped_instrumental.wav');
    
    return new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(instrumentalPath);
      
      // Apply genre-specific audio effects
      switch (this.targetGenre) {
        case 'rock':
          ffmpegCommand = ffmpegCommand
            .audioFilters('highpass=f=200', 'lowpass=f=8000', 'volume=1.2');
          break;
        case 'jazz':
          ffmpegCommand = ffmpegCommand
            .audioFilters('highpass=f=100', 'lowpass=f=6000', 'volume=0.9');
          break;
        case 'electronic':
          ffmpegCommand = ffmpegCommand
            .audioFilters('highpass=f=50', 'lowpass=f=10000', 'volume=1.1');
          break;
        case 'classical':
          ffmpegCommand = ffmpegCommand
            .audioFilters('highpass=f=80', 'lowpass=f=5000', 'volume=0.8');
          break;
        default:
          // Default processing
          ffmpegCommand = ffmpegCommand.audioFilters('volume=1.0');
      }
      
      ffmpegCommand
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`FFmpeg failed: ${err.message}`)))
        .run();
    });
  }

  async mixVocalsAndInstrumental(vocalsPath, instrumentalPath) {
    await this.updateStatus('mixing_audio', 85);
    
    const outputPath = path.join(this.workDir, 'final_mix.wav');
    
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(vocalsPath)
        .input(instrumentalPath)
        .complexFilter([
          '[0:a][1:a]amix=inputs=2:duration=longest[mixed]'
        ])
        .outputOptions(['-map', '[mixed]'])
        .output(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(new Error(`Mixing failed: ${err.message}`)))
        .run();
    });
  }

  async generateLRCFile(transcription) {
    const lrcPath = path.join(this.workDir, 'lyrics.lrc');
    let lrcContent = '';
    
    if (transcription.segments) {
      transcription.segments.forEach(segment => {
        const startTime = this.formatTime(segment.start);
        const endTime = this.formatTime(segment.end);
        const text = segment.text.trim();
        if (text) {
          lrcContent += `[${startTime}]${text}\n`;
        }
      });
    }
    
    await fs.writeFile(lrcPath, lrcContent);
    return lrcPath;
  }

  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const centisecs = Math.floor((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centisecs.toString().padStart(2, '0')}`;
  }

  async process() {
    try {
      // Create working directory
      this.workDir = await fs.mkdtemp(path.join(temp.dir, 'genre-swap-'));
      await this.updateStatus('initializing', 5);

      // Step 1: Download from YouTube
      const audioPath = await this.downloadFromYouTube();

      // Step 2: Separate vocals and instrumental
      const { vocals, instrumental } = await this.separateStems();

      // Step 3: Transcribe lyrics
      const transcription = await this.transcribeLyrics(vocals);

      // Step 4: Apply genre transfer to instrumental
      const genreSwappedInstrumental = await this.applyGenreTransfer(instrumental);

      // Step 5: Mix vocals with new instrumental
      const finalMix = await this.mixVocalsAndInstrumental(vocals, genreSwappedInstrumental);

      // Step 6: Generate LRC file
      const lrcPath = await this.generateLRCFile(transcription);

      // Step 7: Copy files to public directory
      const publicDir = path.join(process.cwd(), 'public', 'genre-swaps');
      await fs.ensureDir(publicDir);
      
      const finalAudioPath = path.join(publicDir, `${this.jobId}_${this.targetGenre}.wav`);
      const finalLrcPath = path.join(publicDir, `${this.jobId}_${this.targetGenre}.lrc`);
      
      await fs.copy(finalMix, finalAudioPath);
      await fs.copy(lrcPath, finalLrcPath);

      // Step 8: Clean up working directory
      await fs.remove(this.workDir);

      // Step 9: Update final status
      await this.updateStatus('done', 100, null, {
        swappedAudioUrl: `/public/genre-swaps/${this.jobId}_${this.targetGenre}.wav`,
        lrcUrl: `/public/genre-swaps/${this.jobId}_${this.targetGenre}.lrc`,
        transcription: transcription
      });

    } catch (error) {
      await this.updateStatus('error', 100, error.message);
      // Clean up on error
      if (this.workDir && await fs.pathExists(this.workDir)) {
        await fs.remove(this.workDir);
      }
      throw error;
    }
  }
}

// POST /api/ai/genre-swap
router.post('/', swapLimiter, async (req, res) => {
  const { youtubeUrl, targetGenre } = req.body;
  
  if (!youtubeUrl || !targetGenre) {
    return res.status(400).json({ error: 'youtubeUrl and targetGenre are required' });
  }
  
  if (!isValidYouTubeUrl(youtubeUrl)) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }
  
  const safeGenre = sanitizeGenre(targetGenre);
  if (!safeGenre || !isValidGenre(safeGenre)) {
    return res.status(400).json({ 
      error: 'Invalid genre', 
      supportedGenres: SUPPORTED_GENRES 
    });
  }
  
  const jobId = uuidv4();
  jobStatus[jobId] = { 
    status: 'queued', 
    progress: 0, 
    error: null, 
    timestamp: Date.now() 
  };
  
  // Respond immediately with jobId
  res.json({ 
    jobId, 
    message: 'Genre swap job queued successfully',
    estimatedTime: '5-10 minutes'
  });

  // Process the job asynchronously
  const processor = new GenreSwapProcessor(jobId, youtubeUrl, safeGenre);
  processor.process().catch(error => {
    console.error(`Job ${jobId} failed:`, error);
  });
});

// GET /api/ai/genre-swap/status/:jobId
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  if (!jobStatus[jobId]) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(jobStatus[jobId]);
});

// GET /api/ai/genre-swap/genres
router.get('/genres', (req, res) => {
  res.json({ 
    supportedGenres: SUPPORTED_GENRES,
    count: SUPPORTED_GENRES.length
  });
});

// YouTube Search API
router.get('/search', async (req, res) => {
  const { q, maxResults = 10 } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }
  
  try {
    // Use yt-dlp to search YouTube
    const searchResults = await searchYouTube(q, parseInt(maxResults));
    res.json({
      query: q,
      results: searchResults,
      count: searchResults.length
    });
  } catch (error) {
    console.error('YouTube search error:', error);
    res.status(500).json({ error: `Search failed: ${error.message}` });
  }
});

// YouTube search function
async function searchYouTube(query, maxResults = 10) {
  return new Promise((resolve, reject) => {
    const searchArgs = [
      '-m', 'yt_dlp',
      `ytsearch${maxResults}:${query}`,
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--quiet'
    ];
    
    console.log('Searching YouTube with args:', searchArgs.join(' '));
    
    const searchProcess = spawn('python', searchArgs);
    
    let stdout = '';
    let stderr = '';
    
    searchProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    searchProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    searchProcess.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse each line as a separate JSON object
          const results = stdout.trim().split('\n')
            .filter(line => line.trim())
            .map(line => {
              try {
                return JSON.parse(line);
              } catch (e) {
                console.warn('Failed to parse search result:', line);
                return null;
              }
            })
            .filter(result => result !== null)
            .map(result => ({
              id: result.id,
              title: result.title,
              duration: result.duration,
              uploader: result.uploader,
              view_count: result.view_count,
              thumbnail: result.thumbnail,
              url: `https://www.youtube.com/watch?v=${result.id}`,
              description: result.description?.substring(0, 200) + '...'
            }));
          
          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to parse search results: ${error.message}`));
        }
      } else {
        reject(new Error(`YouTube search failed with code ${code}: ${stderr}`));
      }
    });
    
    searchProcess.on('error', (error) => {
      reject(new Error(`Search process error: ${error.message}`));
    });
  });
}

// Serve the web interface
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = { router, GenreSwapProcessor };
