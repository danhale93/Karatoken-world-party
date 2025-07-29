// Extra battle features for Karatoken
const { db } = require('./firestore');

// Add chat to a battle
db.collection('battles').doc('BATTLE_ID').collection('chat'); // Use this for chat messages

// Add rematch request
db.collection('battles').doc('BATTLE_ID').update({ rematchRequested: true });

// Add battle history (for leaderboard, stats, etc.)
// On battle complete, copy to a 'battleHistory' collection
async function archiveBattle(battleId) {
  const battleRef = db.collection('battles').doc(battleId);
  const doc = await battleRef.get();
  if (!doc.exists) return;
  await db.collection('battleHistory').doc(battleId).set(doc.data());
  await battleRef.delete();
}

module.exports = { archiveBattle };
