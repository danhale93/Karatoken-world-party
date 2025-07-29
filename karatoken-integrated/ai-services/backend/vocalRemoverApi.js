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
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

/**
 * Process vocal removal using Ultimate Vocal Remover
 */
async function processVocalRemoval(inputFile, outputFormat, model, stemType, quality) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const outputDir = path.join(__dirname, 'uploads', 'processed');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${Date.now()}_${uuidv4()}.${outputFormat}`);
    
    // Ultimate Vocal Remover command
    const args = [
      '--input', inputFile,
      '--output', outputFile,
      '--model', model,
      '--stem', stemType,
      '--quality', quality,
      '--format', outputFormat
    ];

    console.log(`Starting vocal removal: ${model} model, ${stemType} stem, ${quality} quality`);
    
    const vocalRemover = spawn('python', ['-m', 'ultimatevocalremover', ...args], {
      cwd: path.join(__dirname, 'ai_models'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    vocalRemover.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`Vocal Remover stdout: ${data}`);
    });

    vocalRemover.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log(`Vocal Remover stderr: ${data}`);
    });

    vocalRemover.on('close', (code) => {
      const processingTime = Date.now() - startTime;
      
      if (code === 0 && fs.existsSync(outputFile)) {
        const stats = fs.statSync(outputFile);
        resolve({
          success: true,
          outputFile: outputFile,
          processingTime,
          originalSize: fs.statSync(inputFile).size,
          processedSize: stats.size,
          model,
          stemType,
          quality
        });
      } else {
        reject(new Error(`Vocal removal failed with code ${code}: ${stderr}`));
      }
    });

    vocalRemover.on('error', (error) => {
      reject(new Error(`Failed to start vocal removal: ${error.message}`));
    });

    // Timeout after 10 minutes
    setTimeout(() => {
      vocalRemover.kill();
      reject(new Error('Vocal removal timed out after 10 minutes'));
    }, 600000);
  });
}

/**
 * POST /api/ai/vocal-remover
 * Process vocal removal request
 */
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file provided' 
      });
    }

    const { outputFormat = 'wav', model = 'VR', stemType = 'instrumental', quality = 'high' } = req.body;
    
    // Validate parameters
    const validModels = ['VR', 'MDX', 'Demucs'];
    const validStems = ['vocals', 'instrumental', 'both'];
    const validQualities = ['low', 'medium', 'high'];
    const validFormats = ['wav', 'mp3', 'flac'];

    if (!validModels.includes(model)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid model. Must be one of: ${validModels.join(', ')}` 
      });
    }

    if (!validStems.includes(stemType)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid stem type. Must be one of: ${validStems.join(', ')}` 
      });
    }

    if (!validQualities.includes(quality)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid quality. Must be one of: ${validQualities.join(', ')}` 
      });
    }

    if (!validFormats.includes(outputFormat)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid output format. Must be one of: ${validFormats.join(', ')}` 
      });
    }

    const result = await processVocalRemoval(
      req.file.path,
      outputFormat,
      model,
      stemType,
      quality
    );

    res.json(result);

  } catch (error) {
    console.error('Vocal removal error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/ai/vocal-remover/models
 * Get available models
 */
router.get('/models', (req, res) => {
  const models = [
    {
      id: 'VR',
      name: 'VR Architecture',
      description: 'High-quality vocal separation using VR architecture',
      speed: 'medium',
      quality: 'high'
    },
    {
      id: 'MDX',
      name: 'MDX-Net',
      description: 'Fast processing with good quality using MDX-Net',
      speed: 'fast',
      quality: 'medium'
    },
    {
      id: 'Demucs',
      name: 'Demucs',
      description: 'State-of-the-art separation using Demucs architecture',
      speed: 'slow',
      quality: 'very_high'
    }
  ];

  res.json({ models });
});

/**
 * GET /api/ai/vocal-remover/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  // Check if Ultimate Vocal Remover is available
  const checkVocalRemover = spawn('python', ['-c', 'import ultimatevocalremover; print("OK")'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  checkVocalRemover.on('close', (code) => {
    if (code === 0) {
      res.json({ 
        status: 'healthy', 
        service: 'Ultimate Vocal Remover',
        available: true 
      });
    } else {
      res.status(503).json({ 
        status: 'unhealthy', 
        service: 'Ultimate Vocal Remover',
        available: false,
        error: 'Ultimate Vocal Remover not installed or not working'
      });
    }
  });

  checkVocalRemover.on('error', () => {
    res.status(503).json({ 
      status: 'unhealthy', 
      service: 'Ultimate Vocal Remover',
      available: false,
      error: 'Failed to check Ultimate Vocal Remover status'
    });
  });
});

/**
 * GET /api/ai/vocal-remover/download/:filename
 * Download processed file
 */
router.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'processed', filename);
  
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
 * DELETE /api/ai/vocal-remover/cleanup
 * Clean up old processed files
 */
router.delete('/cleanup', (req, res) => {
  try {
    const processedDir = path.join(__dirname, 'uploads', 'processed');
    const uploadsDir = path.join(__dirname, 'uploads');
    
    if (fs.existsSync(processedDir)) {
      const files = fs.readdirSync(processedDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(processedDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });
      
      res.json({ 
        success: true, 
        message: `Cleaned up ${deletedCount} old files`,
        deletedCount 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'No processed files to clean up',
        deletedCount: 0 
      });
    }
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router; 