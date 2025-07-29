
// Karatoken MVP - Full Backend Code (Node.js + Express + Firebase)
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const wav = require('node-wav');
const Meyda = require('meyda');

const serviceAccount = require('./gen-lang-client-0125469683-firebase-adminsdk-fbsvc-3a5486e8cd.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Optionally add databaseURL if using Realtime Database
  // databaseURL: "https://gen-lang-client-0125469683.firebaseio.com"
});
const db = admin.firestore();
const auth = admin.auth();

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.json());

// Mount APIs
const royaltyApi = require('./royaltyApi');
app.use('/api/royalty', royaltyApi);
const aiGenreSwapApi = require('./aiGenreSwapApi');
app.use('/api/ai', aiGenreSwapApi);
const lyricsApi = require('./lyricsApi');
app.use('/api/lyrics', lyricsApi);
const youtubeAudioApi = require('./youtubeAudioApi');
app.use('/api/youtube', youtubeAudioApi);
const rewardsApi = require('./rewardsApi');
app.use('/api/rewards', rewardsApi);
const vocalIsolateApi = require('./vocalIsolateApi');
app.use('/api/ai/vocal-isolate', vocalIsolateApi);

//--------------------------------------------------
// User Registration
app.post('/api/users/register', async (req, res) => {
  const { email, password, username, userType } = req.body;
  try {
    const userRecord = await auth.createUser({ email, password, displayName: username });
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      username,
      email,
      userType,
      wallet: 0
    });
    res.json({ userId: userRecord.uid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//--------------------------------------------------
// User Login (Token via Firebase Client SDK)
app.post('/api/users/login', async (req, res) => {
  res.status(400).json({ message: 'Use Firebase Client SDK for authentication.' });
});

//--------------------------------------------------
// Upload Song Performance
app.post('/api/songs/upload', upload.single('audioFile'), async (req, res) => {
  const { userId, songId } = req.body;
  const audioFile = req.file;
  const performanceId = uuidv4();

  await db.collection('performances').doc(performanceId).set({
    performanceId,
    userId,
    songId,
    audioURL: `/uploads/${audioFile.filename}`,
    score: 0,
    timestamp: Date.now()
  });

  res.json({ performanceId, status: 'uploaded' });
});

//--------------------------------------------------
// AI Pitch Scoring (Real Analysis)
app.post('/api/ai/pitch-score', upload.single('audioFile'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const result = wav.decode(buffer);
    const signal = result.channelData[0];

    const detectPitch = Pitchfinder.YIN();
    const frameSize = 2048;
    const hopSize = 512;

    let pitches = [];
    for (let i = 0; i + frameSize < signal.length; i += hopSize) {
      const frame = signal.slice(i, i + frameSize);
      const pitch = detectPitch(frame);
      if (pitch) pitches.push(pitch);
    }

    const avgPitch = pitches.reduce((sum, val) => sum + val, 0) / pitches.length;
    const score = Math.min(100, Math.round((avgPitch / 440) * 100)); // 440Hz = A4

    res.json({ score, notes: pitches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Pitch analysis failed' });
  }
});

//--------------------------------------------------
// Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  const snapshot = await db.collection('performances').orderBy('score', 'desc').limit(10).get();
  const leaderboard = [];
  snapshot.forEach(doc => leaderboard.push(doc.data()));
  res.json({ leaderboard });
});

//--------------------------------------------------
// Karatoken Payout (Stub)
app.post('/api/payments/payout', async (req, res) => {
  const { userId, amount, walletAddress } = req.body;
  const transactionId = uuidv4();
  await db.collection('transactions').doc(transactionId).set({
    transactionId,
    userId,
    amount,
    walletAddress,
    status: 'pending',
    timestamp: Date.now()
  });
  res.json({ transactionId, status: 'pending' });
});

//--------------------------------------------------
// Join Competition
app.post('/api/competitions/join', async (req, res) => {
  const { competitionId, userId } = req.body;
  const compRef = db.collection('competitions').doc(competitionId);
  await compRef.update({
    participants: admin.firestore.FieldValue.arrayUnion(userId)
  });
  res.json({ status: 'joined' });
});

//--------------------------------------------------
// Create Tournament
app.post('/api/tournaments/create', async (req, res) => {
  const { title, entryFee, prizePool, startDate, endDate } = req.body;
  const tournamentId = uuidv4();
  await db.collection('competitions').doc(tournamentId).set({
    tournamentId,
    title,
    entryFee,
    prizePool,
    startDate,
    endDate,
    participants: []
  });
  res.json({ tournamentId, status: 'created' });
});




//--------------------------------------------------
// Start Server (only if not required by another module)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Karatoken backend running on port ${PORT}`));
}

module.exports = app;
