// Express router for real-time battle sessions
const express = require('express');
const router = express.Router();

// Firestore for real-time battle sync
const { db } = require('./firestore');

// POST /api/battle/create
router.post('/create', async (req, res) => {
  const { userIds, songId } = req.body;
  const battleId = Math.random().toString(36).substr(2, 9);
  const battleDoc = {
    userIds,
    songId,
    scores: {},
    status: 'waiting',
    createdAt: new Date().toISOString(),
  };
  await db.collection('battles').doc(battleId).set(battleDoc);
  res.json({ battleId });
});

// POST /api/battle/submit
router.post('/submit', async (req, res) => {
  const { battleId, userId, score } = req.body;
  const battleRef = db.collection('battles').doc(battleId);
  const docSnap = await battleRef.get();
  if (!docSnap.exists) return res.status(404).json({ error: 'Battle not found' });
  const battle = docSnap.data();
  battle.scores = battle.scores || {};
  battle.scores[userId] = score;
  // If all users submitted, mark as complete
  if (Object.keys(battle.scores).length === battle.userIds.length) {
    battle.status = 'complete';
  }
  await battleRef.update({ scores: battle.scores, status: battle.status });
  res.json({ status: battle.status, scores: battle.scores });
});

// GET /api/battle/status/:battleId
router.get('/status/:battleId', async (req, res) => {
  const { battleId } = req.params;
  const docSnap = await db.collection('battles').doc(battleId).get();
  if (!docSnap.exists) return res.status(404).json({ error: 'Battle not found' });
  res.json(docSnap.data());
});

module.exports = router;
