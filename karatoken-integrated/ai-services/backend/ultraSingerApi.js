const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

/**
 * Process UltraSinger AI analysis
 */
async function processUltraSinger(inputFile, options) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const outputDir = path.join(__dirname, 'uploads', 'ultra_singer');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${Date.now()}_${uuidv4()}.${options.outputFormat}`);
    
    // UltraSinger command
    const args = [
      '--input', inputFile,
      '--output', outputFile,
      '--format', options.outputFormat,
      '--language', options.language,
      '--pitch-detection', options.pitchDetection,
      '--lyrics-extraction', options.lyricsExtraction,
      '--auto-tapping', options.autoTapping ? 'true' : 'false',
      '--add-chords', options.addChords ? 'true' : 'false'
    ];

    console.log(`Starting UltraSinger: ${options.outputFormat} format, ${options.language} language`);
    
    const ultraSinger = spawn('python', ['-m', 'ultra_singer', ...args], {
      cwd: path.join(__dirname, 'ai_models'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    ultraSinger.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`UltraSinger stdout: ${data}`);
    });

    ultraSinger.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`UltraSinger stderr: ${data}`);
    });

    ultraSinger.on('close', (code) => {
      const processingTime = Date.now() - startTime;
      
      if (code === 0 && fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        
        // Parse output for additional data
        let lyrics = '';
        let pitchData = [];
        let midiNotes = [];
        let timing = [];
        
        try {
          // Try to read additional data files
          const lyricsFile = outputFile.replace(`.${options.outputFormat}`, '_lyrics.txt');
          const pitchFile = outputFile.replace(`.${options.outputFormat}`, '_pitch.json');
          const midiFile = outputFile.replace(`.${options.outputFormat}`, '_midi.json');
          const timingFile = outputFile.replace(`.${options.outputFormat}`, '_timing.json');
          
          if (fs.existsSync(lyricsFile)) {
            lyrics = fs.readFileSync(lyricsFile, 'utf8');
          }
          
          if (fs.existsSync(pitchFile)) {
            pitchData = JSON.parse(fs.readFileSync(pitchFile, 'utf8'));
          }
          
          if (fs.existsSync(midiFile)) {
            midiNotes = JSON.parse(fs.readFileSync(midiFile, 'utf8'));
          }
          
          if (fs.existsSync(timingFile)) {
            timing = JSON.parse(fs.readFileSync(timingFile, 'utf8'));
          }
        } catch (error) {
          console.warn('Failed to parse additional UltraSinger data:', error);
        }
        
        resolve({
          success: true,
          outputFile: outputFile,
          lyrics,
          pitchData,
          midiNotes,
          timing,
          processingTime,
          originalSize: fs.statSync(inputFile).size,
          processedSize: stats.size,
          format: options.outputFormat,
          language: options.language
        });
      } else {
        reject(new Error(`UltraSinger failed with code ${code}: ${stderr}`));
      }
    });

    ultraSinger.on('error', (error) => {
      reject(new Error(`Failed to start UltraSinger: ${error.message}`));
    });

    // Timeout after 15 minutes
    setTimeout(() => {
      ultraSinger.kill();
      reject(new Error('UltraSinger timed out after 15 minutes'));
    }, 900000);
  });
}

/**
 * POST /api/ai/ultra-singer
 * Process UltraSinger AI analysis
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    const {
      outputFormat = 'ultrastar',
      language = 'en',
      pitchDetection = 'ai',
      lyricsExtraction = 'ai',
      autoTapping = true,
      addChords = false
    } = req.body;
    
    // Validate parameters
    const validFormats = ['ultrastar', 'midi', 'lrc', 'json'];
    const validLanguages = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'];
    const validPitchDetection = ['basic', 'advanced', 'ai'];
    const validLyricsExtraction = ['basic', 'ai', 'manual'];

    if (!validFormats.includes(outputFormat)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid output format. Must be one of: ${validFormats.join(', ')}` 
      });
    }

    if (!validLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid language. Must be one of: ${validLanguages.join(', ')}` 
      });
    }

    if (!validPitchDetection.includes(pitchDetection)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid pitch detection. Must be one of: ${validPitchDetection.join(', ')}` 
      });
    }

    if (!validLyricsExtraction.includes(lyricsExtraction)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid lyrics extraction. Must be one of: ${validLyricsExtraction.join(', ')}` 
      });
    }

    const options = {
      outputFormat,
      language,
      pitchDetection,
      lyricsExtraction,
      autoTapping: autoTapping === 'true' || autoTapping === true,
      addChords: addChords === 'true' || addChords === true
    };

    const result = await processUltraSinger(req.file.path, options);
    res.json(result);

  } catch (error) {
    console.error('UltraSinger error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/ultra-singer/lyrics
 * Extract lyrics from audio file
 */
router.post('/lyrics', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    const { language = 'en' } = req.body;
    
    const options = {
      outputFormat: 'json',
      language,
      pitchDetection: 'basic',
      lyricsExtraction: 'ai',
      autoTapping: false,
      addChords: false
    };

    const result = await processUltraSinger(req.file.path, options);
    
    if (result.success) {
      // Parse lyrics from the result
      const lyrics = result.lyrics ? result.lyrics.split('\n').filter(line => line.trim()) : [];
      res.json({ 
        success: true, 
        lyrics: lyrics,
        language,
        processingTime: result.processingTime
      });
    } else {
      res.json({ 
        success: false, 
        error: 'Failed to extract lyrics' 
      });
    }

  } catch (error) {
    console.error('Lyrics extraction error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /api/ai/ultra-singer/pitch
 * Detect pitch from audio file
 */
router.post('/pitch', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    const { pitchDetection = 'ai' } = req.body;
    
    const options = {
      outputFormat: 'json',
      language: 'en',
      pitchDetection,
      lyricsExtraction: 'basic',
      autoTapping: false,
      addChords: false
    };

    const result = await processUltraSinger(req.file.path, options);
    
    if (result.success) {
      res.json({ 
        success: true, 
        pitchData: result.pitchData || [],
        midiNotes: result.midiNotes || [],
        processingTime: result.processingTime
      });
    } else {
      res.json({ 
        success: false, 
        error: 'Failed to detect pitch' 
      });
    }

  } catch (error) {
    console.error('Pitch detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/ai/ultra-singer/languages
 * Get supported languages
 */
router.get('/languages', (req, res) => {
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' }
  ];

  res.json({ languages });
});

/**
 * GET /api/ai/ultra-singer/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  // Check if UltraSinger is available
  const checkUltraSinger = spawn('python', ['-c', 'import ultra_singer; print("OK")'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  checkUltraSinger.on('close', (code) => {
    if (code === 0) {
      res.json({ 
        status: 'healthy', 
        service: 'UltraSinger',
        available: true 
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy', 
        service: 'UltraSinger',
        available: false,
        error: 'UltraSinger not installed or not working'
      });
    }
  });

  checkUltraSinger.on('error', () => {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'UltraSinger',
      available: false,
      error: 'Failed to check UltraSinger status'
    });
  });
});

/**
 * GET /api/ai/ultra-singer/download/:filename
 * Download processed file
 */
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'ultra_singer', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to download file' 
        });
      }
    });
  } else {
    res.status(404).json({ 
      success: false, 
      error: 'File not found' 
    });
  }
});

/**
 * GET /api/ai/ultra-singer/formats
 * Get supported output formats
 */
router.get('/formats', (req, res) => {
  const formats = [
    {
      id: 'ultrastar',
      name: 'UltraStar Deluxe',
      description: 'UltraStar Deluxe karaoke format with lyrics and pitch data',
      extension: '.txt',
      features: ['lyrics', 'pitch', 'timing', 'chords']
    },
    {
      id: 'midi',
      name: 'MIDI',
      description: 'MIDI file with note data and timing',
      extension: '.mid',
      features: ['notes', 'timing', 'chords']
    },
    {
      id: 'lrc',
      name: 'LRC Lyrics',
      description: 'Synchronized lyrics format',
      extension: '.lrc',
      features: ['lyrics', 'timing']
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Structured data with all analysis results',
      extension: '.json',
      features: ['lyrics', 'pitch', 'timing', 'chords', 'metadata']
    }
  ];

  res.json({ formats });
});

module.exports = router; 