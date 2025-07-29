// Vocal Isolation API
const express = require('express');
const router = express.Router();
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// POST /api/ai/vocal-isolate
router.post('/', async (req, res) => {
  const { youtubeUrl } = req.body;
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'youtubeUrl is required' });
  }
  try {
    // 1. Download audio from YouTube using Python script
    const audioOutput = path.join('uploads', `audio_${Date.now()}.wav`);
    await new Promise((resolve, reject) => {
      execFile('python', [path.join(__dirname, 'youtube_download.py'), youtubeUrl, audioOutput], (error, stdout, stderr) => {
        if (error) {
          console.error('YouTube download error:', stderr || error);
          return reject(error);
        }
        resolve();
      });
    });

    // 2. Run demucs_infer.py to isolate vocals
    const outputDir = path.join('uploads', `vocals_${Date.now()}`);
    fs.mkdirSync(outputDir, { recursive: true });
    await new Promise((resolve, reject) => {
      execFile('python', ['demucs_infer.py', audioOutput, outputDir], { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) return reject(error);
        resolve();
      });
    });

    // 3. Find the isolated vocal file (assume it's named 'vocals.wav' or 'vocals.mp3')
    const files = fs.readdirSync(outputDir);
    const vocalFile = files.find(f => f.toLowerCase().includes('vocals'));
    if (!vocalFile) {
      return res.status(500).json({ error: 'Vocal file not found after isolation' });
    }
    const vocalFilePath = path.join(outputDir, vocalFile);
    // Serve the file statically (ensure your main app serves /uploads)
    const audioUrl = `/uploads/${path.basename(outputDir)}/${vocalFile}`;
    res.json({ audioUrl });
  } catch (err) {
    console.error('Vocal isolation error:', err);
    res.status(500).json({ error: 'Vocal isolation failed', details: err && err.stack ? err.stack : err });
  }
});

module.exports = router;
