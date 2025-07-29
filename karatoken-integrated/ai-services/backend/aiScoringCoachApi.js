const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `performance-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|wav|m4a|aac|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Mock AI analysis functions (replace with real AI services)
const analyzePitch = async (audioFile) => {
  // Simulate pitch analysis
  const pitchData = [];
  const duration = 180; // 3 minutes
  const sampleRate = 0.1; // Sample every 100ms
  
  for (let i = 0; i < duration / sampleRate; i++) {
    const timestamp = i * sampleRate * 1000;
    const frequency = 440 + Math.random() * 200 - 100; // A4 ± 100Hz
    const note = frequencyToNote(frequency);
    
    pitchData.push({
      timestamp,
      frequency,
      note: note.note,
      octave: note.octave,
      confidence: 0.7 + Math.random() * 0.3,
      isCorrect: Math.random() > 0.3, // 70% accuracy
      expectedNote: note.note
    });
  }
  
  return pitchData;
};

const frequencyToNote = (frequency) => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4 = 440;
  const c0 = a4 * Math.pow(2, -4.75);
  const halfStepsBelowMiddleC = Math.round(12 * Math.log2(frequency / c0));
  const octave = Math.floor(halfStepsBelowMiddleC / 12);
  const noteIndex = (halfStepsBelowMiddleC % 12 + 12) % 12;
  return { note: notes[noteIndex], octave };
};

const analyzeTiming = async (audioFile) => {
  // Simulate timing analysis
  return {
    accuracy: 0.85 + Math.random() * 0.1,
    consistency: 0.78 + Math.random() * 0.15,
    tempoVariation: 0.05 + Math.random() * 0.1
  };
};

const analyzeRhythm = async (audioFile) => {
  // Simulate rhythm analysis
  return {
    consistency: 0.78 + Math.random() * 0.15,
    syncopation: 0.6 + Math.random() * 0.3,
    groove: 0.7 + Math.random() * 0.25
  };
};

const analyzeExpression = async (audioFile) => {
  // Simulate expression analysis
  return {
    dynamics: 0.82 + Math.random() * 0.15,
    phrasing: 0.75 + Math.random() * 0.2,
    emotion: 0.7 + Math.random() * 0.25
  };
};

const generateFeedback = (analysis) => {
  const feedback = [];
  const { score } = analysis;

  // Pitch feedback
  if (score.pitch < 80) {
    feedback.push({
      type: 'pitch',
      message: score.pitch < 60 ? 
        'Pitch accuracy needs significant improvement' : 
        'Work on pitch accuracy - some notes were slightly off',
      severity: score.pitch < 60 ? 'high' : 'medium',
      suggestion: 'Practice with a tuner or pitch training app',
      timestamp: Date.now()
    });
  } else {
    feedback.push({
      type: 'pitch',
      message: 'Excellent pitch accuracy!',
      severity: 'low',
      suggestion: 'Keep up the great work',
      timestamp: Date.now()
    });
  }

  // Timing feedback
  if (score.timing < 85) {
    feedback.push({
      type: 'timing',
      message: 'Timing could be more precise',
      severity: score.timing < 70 ? 'high' : 'medium',
      suggestion: 'Practice with a metronome',
      timestamp: Date.now()
    });
  }

  // Rhythm feedback
  if (score.rhythm < 80) {
    feedback.push({
      type: 'rhythm',
      message: 'Rhythm consistency needs improvement',
      severity: score.rhythm < 65 ? 'high' : 'medium',
      suggestion: 'Focus on maintaining steady rhythm throughout',
      timestamp: Date.now()
    });
  }

  // Expression feedback
  if (score.expression < 85) {
    feedback.push({
      type: 'expression',
      message: 'Add more emotional expression to your performance',
      severity: 'medium',
      suggestion: 'Practice conveying emotion through dynamics and phrasing',
      timestamp: Date.now()
    });
  }

  return feedback;
};

const generateRecommendations = (analysis) => {
  const recommendations = [];
  const { score } = analysis;

  if (score.pitch < 80) {
    recommendations.push({
      title: 'Pitch Training',
      description: 'Improve your pitch accuracy with targeted exercises',
      difficulty: score.pitch < 60 ? 'beginner' : 'intermediate',
      estimatedTime: 15,
      focusAreas: ['Pitch accuracy', 'Note recognition', 'Interval training'],
      exercises: [
        'Sing along with a piano or tuner',
        'Practice major and minor scales',
        'Use pitch training apps like SingTrue or Vocal Pitch Monitor'
      ]
    });
  }

  if (score.timing < 85) {
    recommendations.push({
      title: 'Rhythm Practice',
      description: 'Enhance your timing and rhythm skills',
      difficulty: 'intermediate',
      estimatedTime: 20,
      focusAreas: ['Metronome practice', 'Rhythm patterns', 'Syncopation'],
      exercises: [
        'Practice with a metronome at different tempos',
        'Clap along to rhythm patterns',
        'Practice syncopated rhythms'
      ]
    });
  }

  if (score.rhythm < 80) {
    recommendations.push({
      title: 'Groove Development',
      description: 'Improve your sense of rhythm and groove',
      difficulty: 'intermediate',
      estimatedTime: 25,
      focusAreas: ['Rhythm consistency', 'Groove feel', 'Beat awareness'],
      exercises: [
        'Practice with drum tracks',
        'Focus on the backbeat',
        'Practice different time signatures'
      ]
    });
  }

  // Always include warm-up recommendation
  recommendations.push({
    title: 'Vocal Warm-up Routine',
    description: 'Daily vocal exercises to improve overall performance',
    difficulty: 'beginner',
    estimatedTime: 10,
    focusAreas: ['Breathing', 'Vocal range', 'Articulation'],
    exercises: [
      'Lip trills and sirens',
      'Humming exercises',
      'Tongue twisters for articulation'
    ]
  });

  return recommendations;
};

// Main analysis endpoint
router.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioFile = req.file.path;
    const userId = req.body.userId;
    const songTitle = req.body.songTitle || 'Unknown Song';

    console.log(`Starting analysis for user ${userId}, song: ${songTitle}`);

    // Perform comprehensive analysis
    const [pitchData, timingAnalysis, rhythmAnalysis, expressionAnalysis] = await Promise.all([
      analyzePitch(audioFile),
      analyzeTiming(audioFile),
      analyzeRhythm(audioFile),
      analyzeExpression(audioFile)
    ]);

    // Calculate scores
    const pitchScore = Math.round(pitchData.filter(p => p.isCorrect).length / pitchData.length * 100);
    const timingScore = Math.round(timingAnalysis.accuracy * 100);
    const rhythmScore = Math.round(rhythmAnalysis.consistency * 100);
    const expressionScore = Math.round(expressionAnalysis.dynamics * 100);
    const confidenceScore = Math.round((pitchScore + timingScore + rhythmScore) / 3);

    const overallScore = Math.round(
      (pitchScore * 0.3 + timingScore * 0.25 + rhythmScore * 0.2 + expressionScore * 0.15 + confidenceScore * 0.1)
    );

    const score = {
      overall: overallScore,
      pitch: pitchScore,
      timing: timingScore,
      rhythm: rhythmScore,
      expression: expressionScore,
      confidence: confidenceScore
    };

    // Generate feedback and recommendations
    const feedback = generateFeedback({ score });
    const recommendations = generateRecommendations({ score });

    // Create analysis result
    const analysis = {
      id: `analysis-${Date.now()}`,
      userId,
      songTitle,
      audioFile: req.file.filename,
      score,
      pitchData,
      timingAnalysis,
      rhythmAnalysis,
      expressionAnalysis,
      feedback,
      recommendations,
      createdAt: new Date().toISOString(),
      processingTime: Date.now() - req.startTime
    };

    // Clean up uploaded file
    fs.unlink(audioFile, (err) => {
      if (err) console.error('Error deleting uploaded file:', err);
    });

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze performance',
      details: error.message
    });
  }
});

// Get analysis history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Mock analysis history (replace with database query)
    const history = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `analysis-${Date.now() - i * 86400000}`,
      songTitle: `Song ${i + 1}`,
      score: {
        overall: 75 + Math.random() * 20,
        pitch: 70 + Math.random() * 25,
        timing: 80 + Math.random() * 15,
        rhythm: 75 + Math.random() * 20,
        expression: 70 + Math.random() * 25,
        confidence: 75 + Math.random() * 20
      },
      createdAt: new Date(Date.now() - i * 86400000).toISOString()
    }));

    res.json({
      success: true,
      history,
      total: history.length
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis history'
    });
  }
});

// Get detailed analysis by ID
router.get('/analysis/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;

    // Mock detailed analysis (replace with database query)
    const analysis = {
      id: analysisId,
      userId: 'user123',
      songTitle: 'Sample Song',
      score: {
        overall: 82,
        pitch: 78,
        timing: 85,
        rhythm: 80,
        expression: 75,
        confidence: 79
      },
      pitchData: [],
      feedback: [],
      recommendations: [],
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analysis fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analysis'
    });
  }
});

// Compare performances
router.post('/compare', async (req, res) => {
  try {
    const { analysisIds } = req.body;

    if (!analysisIds || analysisIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 analysis IDs required for comparison'
      });
    }

    // Mock comparison data
    const comparison = {
      analyses: analysisIds.map((id, index) => ({
        id,
        songTitle: `Song ${index + 1}`,
        score: {
          overall: 75 + Math.random() * 20,
          pitch: 70 + Math.random() * 25,
          timing: 80 + Math.random() * 15,
          rhythm: 75 + Math.random() * 20,
          expression: 70 + Math.random() * 25,
          confidence: 75 + Math.random() * 20
        },
        date: new Date(Date.now() - index * 86400000).toISOString()
      })),
      improvements: {
        pitch: '+5%',
        timing: '+3%',
        rhythm: '+7%',
        expression: '+2%',
        overall: '+4%'
      }
    };

    res.json({
      success: true,
      comparison
    });

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare performances'
    });
  }
});

// Middleware to track request start time
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router; 