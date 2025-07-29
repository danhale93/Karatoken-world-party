const express = require('express');
const router = express.Router();

// Mock battle data store (replace with database)
const activeBattles = new Map();
const battleParticipants = new Map();
const battleScores = new Map();

// Battle management
class LiveBattleManager {
  constructor() {
    this.battles = new Map();
    this.participants = new Map();
    this.scores = new Map();
  }

  createBattle(battleData) {
    const battleId = `battle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const battle = {
      id: battleId,
      title: battleData.title,
      category: battleData.category,
      songTitle: battleData.songTitle,
      artistName: battleData.artistName,
      maxParticipants: battleData.maxParticipants || 4,
      entryFee: battleData.entryFee || 50,
      totalReward: battleData.totalReward || 200,
      status: 'waiting',
      participants: [],
      rounds: [{
        id: 'round1',
        songTitle: battleData.songTitle,
        artistName: battleData.artistName,
        duration: battleData.duration || 180,
        scores: {},
        status: 'waiting'
      }],
      currentRound: 0,
      startTime: new Date().toISOString(),
      createdBy: battleData.createdBy,
    };

    this.battles.set(battleId, battle);
    return battle;
  }

  joinBattle(battleId, participantData) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.participants.length >= battle.maxParticipants) {
      throw new Error('Battle is full');
    }

    if (battle.status !== 'waiting') {
      throw new Error('Battle has already started');
    }

    const participant = {
      id: participantData.id,
      displayName: participantData.displayName,
      photoURL: participantData.photoURL,
      isReady: false,
      isPerforming: false,
      currentScore: 0,
      rank: battle.participants.length + 1,
      joinedAt: new Date().toISOString(),
    };

    battle.participants.push(participant);
    this.battles.set(battleId, battle);

    return participant;
  }

  leaveBattle(battleId, participantId) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    battle.participants = battle.participants.filter(p => p.id !== participantId);
    
    if (battle.participants.length === 0) {
      this.battles.delete(battleId);
    } else {
      this.battles.set(battleId, battle);
    }

    return true;
  }

  readyUp(battleId, participantId) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const participant = battle.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.isReady = true;
    this.battles.set(battleId, battle);

    // Check if all participants are ready
    if (battle.participants.every(p => p.isReady)) {
      this.startBattle(battleId);
    }

    return participant;
  }

  startBattle(battleId) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    battle.status = 'active';
    battle.rounds[0].status = 'active';
    this.battles.set(battleId, battle);

    return battle;
  }

  startPerformance(battleId, participantId) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const participant = battle.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    // Set all participants to not performing
    battle.participants.forEach(p => p.isPerforming = false);
    
    // Set current participant to performing
    participant.isPerforming = true;
    this.battles.set(battleId, battle);

    return participant;
  }

  updateScore(battleId, participantId, score) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const participant = battle.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.currentScore = Math.min(score, 100);
    this.battles.set(battleId, battle);

    return participant;
  }

  completePerformance(battleId, participantId, finalScore) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    const participant = battle.participants.find(p => p.id === participantId);
    if (!participant) {
      throw new Error('Participant not found');
    }

    participant.isPerforming = false;
    participant.currentScore = finalScore;
    
    // Add score to round
    battle.rounds[0].scores[participantId] = finalScore;
    this.battles.set(battleId, battle);

    // Check if all participants have performed
    const allPerformed = battle.participants.every(p => p.currentScore > 0);
    if (allPerformed) {
      this.endBattle(battleId);
    }

    return participant;
  }

  endBattle(battleId) {
    const battle = this.battles.get(battleId);
    if (!battle) {
      throw new Error('Battle not found');
    }

    battle.status = 'completed';
    battle.endTime = new Date().toISOString();
    
    // Calculate final rankings
    battle.participants.sort((a, b) => b.currentScore - a.currentScore);
    battle.participants.forEach((participant, index) => {
      participant.rank = index + 1;
    });

    this.battles.set(battleId, battle);

    return this.calculateResults(battle);
  }

  calculateResults(battle) {
    const winner = battle.participants[0];
    const results = {
      battleId: battle.id,
      winner,
      participants: battle.participants,
      totalReward: battle.totalReward,
      entryFee: battle.entryFee,
      completedAt: new Date().toISOString(),
    };

    return results;
  }

  getBattle(battleId) {
    return this.battles.get(battleId);
  }

  getAllBattles() {
    return Array.from(this.battles.values());
  }

  getActiveBattles() {
    return Array.from(this.battles.values()).filter(b => b.status === 'waiting');
  }
}

const battleManager = new LiveBattleManager();

// API Routes

// Create a new battle
router.post('/create', (req, res) => {
  try {
    const battleData = req.body;
    const battle = battleManager.createBattle(battleData);
    
    res.json({
      success: true,
      battle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Join a battle
router.post('/:battleId/join', (req, res) => {
  try {
    const { battleId } = req.params;
    const participantData = req.body;
    
    const participant = battleManager.joinBattle(battleId, participantData);
    
    res.json({
      success: true,
      participant,
      battle: battleManager.getBattle(battleId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Leave a battle
router.post('/:battleId/leave', (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId } = req.body;
    
    battleManager.leaveBattle(battleId, participantId);
    
    res.json({
      success: true,
      message: 'Left battle successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Ready up for battle
router.post('/:battleId/ready', (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId } = req.body;
    
    const participant = battleManager.readyUp(battleId, participantId);
    
    res.json({
      success: true,
      participant,
      battle: battleManager.getBattle(battleId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Start performance
router.post('/:battleId/perform', (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId } = req.body;
    
    const participant = battleManager.startPerformance(battleId, participantId);
    
    res.json({
      success: true,
      participant,
      battle: battleManager.getBattle(battleId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update score during performance
router.post('/:battleId/score', (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId, score } = req.body;
    
    const participant = battleManager.updateScore(battleId, participantId, score);
    
    res.json({
      success: true,
      participant,
      battle: battleManager.getBattle(battleId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Complete performance
router.post('/:battleId/complete', (req, res) => {
  try {
    const { battleId } = req.params;
    const { participantId, finalScore } = req.body;
    
    const participant = battleManager.completePerformance(battleId, participantId, finalScore);
    
    res.json({
      success: true,
      participant,
      battle: battleManager.getBattle(battleId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get battle status
router.get('/:battleId', (req, res) => {
  try {
    const { battleId } = req.params;
    const battle = battleManager.getBattle(battleId);
    
    if (!battle) {
      return res.status(404).json({
        success: false,
        error: 'Battle not found'
      });
    }
    
    res.json({
      success: true,
      battle
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all active battles
router.get('/', (req, res) => {
  try {
    const battles = battleManager.getAllBattles();
    
    res.json({
      success: true,
      battles
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get active battles only
router.get('/active/list', (req, res) => {
  try {
    const battles = battleManager.getActiveBattles();
    
    res.json({
      success: true,
      battles
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Chat functionality
const chatMessages = new Map();

router.post('/:battleId/chat', (req, res) => {
  try {
    const { battleId } = req.params;
    const { userId, displayName, message } = req.body;
    
    if (!chatMessages.has(battleId)) {
      chatMessages.set(battleId, []);
    }
    
    const chatMessage = {
      id: Date.now().toString(),
      userId,
      displayName,
      message,
      timestamp: new Date().toISOString(),
    };
    
    chatMessages.get(battleId).push(chatMessage);
    
    res.json({
      success: true,
      message: chatMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/:battleId/chat', (req, res) => {
  try {
    const { battleId } = req.params;
    const messages = chatMessages.get(battleId) || [];
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Battle history
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // Mock battle history (replace with database query)
    const history = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `battle-${Date.now() - i * 86400000}`,
      songTitle: `Song ${i + 1}`,
      artistName: 'Various Artists',
      result: i === 0 ? 'won' : 'lost',
      score: 75 + Math.random() * 20,
      opponentScore: 70 + Math.random() * 25,
      reward: i === 0 ? 200 : 0,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      category: ['pop', 'rock', 'hip-hop', 'country', 'jazz'][Math.floor(Math.random() * 5)]
    }));
    
    res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Battle statistics
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock statistics (replace with database calculation)
    const stats = {
      totalBattles: 25,
      wins: 15,
      losses: 10,
      winRate: 60,
      totalEarnings: 1500,
      averageScore: 78.5,
      bestScore: 95,
      favoriteCategory: 'pop',
      currentStreak: 3,
      achievements: [
        { id: 'first_win', name: 'First Victory', description: 'Win your first battle', earned: true },
        { id: 'streak_5', name: 'Hot Streak', description: 'Win 5 battles in a row', earned: false },
        { id: 'perfect_score', name: 'Perfect Performance', description: 'Score 100 in a battle', earned: false }
      ]
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 