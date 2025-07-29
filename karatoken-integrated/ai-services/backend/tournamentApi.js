const express = require('express');
const router = express.Router();

// Tournament management system
class TournamentManager {
  constructor() {
    this.tournaments = new Map();
    this.participants = new Map();
    this.matches = new Map();
    this.brackets = new Map();
  }

  createTournament(tournamentData) {
    const tournamentId = `tournament-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const tournament = {
      id: tournamentId,
      title: tournamentData.title,
      description: tournamentData.description,
      category: tournamentData.category,
      status: 'registration',
      startDate: tournamentData.startDate,
      endDate: tournamentData.endDate,
      registrationDeadline: tournamentData.registrationDeadline,
      maxParticipants: tournamentData.maxParticipants || 16,
      currentParticipants: 0,
      entryFee: tournamentData.entryFee || 100,
      totalPrizePool: tournamentData.totalPrizePool || 1000,
      prizeDistribution: this.generatePrizeDistribution(tournamentData.totalPrizePool || 1000),
      rounds: [],
      currentRound: 0,
      brackets: [],
      rules: tournamentData.rules || this.getDefaultRules(),
      createdBy: tournamentData.createdBy,
      createdAt: new Date().toISOString(),
      participants: [],
    };

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  generatePrizeDistribution(totalPrizePool) {
    return [
      { rank: 1, percentage: 50, amount: Math.round(totalPrizePool * 0.5), description: 'Champion' },
      { rank: 2, percentage: 25, amount: Math.round(totalPrizePool * 0.25), description: 'Runner-up' },
      { rank: 3, percentage: 15, amount: Math.round(totalPrizePool * 0.15), description: '3rd Place' },
      { rank: 4, percentage: 10, amount: Math.round(totalPrizePool * 0.1), description: '4th Place' },
    ];
  }

  getDefaultRules() {
    return [
      'All participants must be registered users',
      'Each match consists of one song performance',
      'AI scoring will determine match winners',
      'Participants must be present for their scheduled matches',
      'Disqualification for no-shows or rule violations',
      'Tournament organizers reserve the right to modify rules',
    ];
  }

  joinTournament(tournamentId, participantData) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Tournament registration is closed');
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new Error('Tournament is full');
    }

    // Check if participant is already registered
    const existingParticipant = tournament.participants.find(p => p.id === participantData.id);
    if (existingParticipant) {
      throw new Error('Already registered for this tournament');
    }

    const participant = {
      id: participantData.id,
      displayName: participantData.displayName,
      photoURL: participantData.photoURL,
      seed: tournament.currentParticipants + 1,
      isEliminated: false,
      totalScore: 0,
      matchesWon: 0,
      matchesLost: 0,
      joinedAt: new Date().toISOString(),
    };

    tournament.participants.push(participant);
    tournament.currentParticipants++;
    this.tournaments.set(tournamentId, tournament);

    return participant;
  }

  startTournament(tournamentId) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    if (tournament.status !== 'registration') {
      throw new Error('Tournament has already started');
    }

    if (tournament.currentParticipants < 2) {
      throw new Error('Need at least 2 participants to start tournament');
    }

    // Generate brackets and rounds
    const brackets = this.generateBrackets(tournament);
    const rounds = this.generateRounds(tournament, brackets);

    tournament.status = 'active';
    tournament.brackets = brackets;
    tournament.rounds = rounds;
    tournament.currentRound = 0;
    this.tournaments.set(tournamentId, tournament);

    return tournament;
  }

  generateBrackets(tournament) {
    const participants = [...tournament.participants];
    const bracketSize = this.getNextPowerOfTwo(participants.length);
    
    // Seed participants (best players get better seeds)
    participants.sort((a, b) => a.seed - b.seed);
    
    // Fill empty slots with byes
    while (participants.length < bracketSize) {
      participants.push(null);
    }

    const bracket = {
      id: `bracket-${tournament.id}`,
      name: 'Main Bracket',
      type: 'single-elimination',
      participants: participants,
      matches: this.generateMatches(participants, tournament.id),
    };

    return [bracket];
  }

  getNextPowerOfTwo(n) {
    let power = 1;
    while (power < n) {
      power *= 2;
    }
    return power;
  }

  generateMatches(participants, tournamentId) {
    const matches = [];
    const numRounds = Math.log2(participants.length);
    
    for (let round = 0; round < numRounds; round++) {
      const roundMatches = [];
      const matchesInRound = participants.length / Math.pow(2, round + 1);
      
      for (let match = 0; match < matchesInRound; match++) {
        const matchId = `match-${tournamentId}-${round}-${match}`;
        const participant1Index = match * 2;
        const participant2Index = match * 2 + 1;
        
        const tournamentMatch = {
          id: matchId,
          matchNumber: matches.length + 1,
          participant1: participants[participant1Index],
          participant2: participants[participant2Index],
          winner: null,
          status: 'pending',
          score1: 0,
          score2: 0,
          scheduledTime: new Date(Date.now() + (round * 24 * 60 * 60 * 1000)).toISOString(),
          round: round,
        };
        
        roundMatches.push(tournamentMatch);
        matches.push(tournamentMatch);
      }
    }
    
    return matches;
  }

  generateRounds(tournament, brackets) {
    const rounds = [];
    const numRounds = Math.log2(tournament.maxParticipants);
    
    for (let i = 0; i < numRounds; i++) {
      const round = {
        id: `round-${tournament.id}-${i}`,
        name: this.getRoundName(i, numRounds),
        roundNumber: i + 1,
        status: 'pending',
        matches: brackets[0].matches.filter(match => match.round === i),
        startDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
        endDate: new Date(Date.now() + ((i + 1) * 24 * 60 * 60 * 1000)).toISOString(),
      };
      
      rounds.push(round);
    }
    
    return rounds;
  }

  getRoundName(roundIndex, totalRounds) {
    const roundNames = ['Finals', 'Semi-Finals', 'Quarter-Finals', 'Round of 16', 'Round of 32'];
    const nameIndex = totalRounds - roundIndex - 1;
    return roundNames[nameIndex] || `Round ${roundIndex + 1}`;
  }

  updateMatchResult(tournamentId, matchId, result) {
    const tournament = this.tournaments.get(tournamentId);
    if (!tournament) {
      throw new Error('Tournament not found');
    }

    const match = tournament.brackets[0].matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    // Update match result
    match.score1 = result.score1;
    match.score2 = result.score2;
    match.winner = result.score1 > result.score2 ? match.participant1 : match.participant2;
    match.status = 'completed';
    match.completedAt = new Date().toISOString();

    // Update participant stats
    if (match.winner) {
      const winner = tournament.participants.find(p => p.id === match.winner.id);
      if (winner) {
        winner.matchesWon++;
        winner.totalScore += Math.max(result.score1, result.score2);
      }

      const loser = tournament.participants.find(p => 
        p.id === (match.winner.id === match.participant1?.id ? match.participant2?.id : match.participant1?.id)
      );
      if (loser) {
        loser.matchesLost++;
        loser.isEliminated = true;
      }
    }

    // Check if round is complete
    const currentRound = tournament.rounds[tournament.currentRound];
    const roundMatches = currentRound.matches;
    const completedMatches = roundMatches.filter(m => m.status === 'completed');
    
    if (completedMatches.length === roundMatches.length) {
      // Round is complete, advance to next round
      if (tournament.currentRound < tournament.rounds.length - 1) {
        tournament.currentRound++;
        tournament.rounds[tournament.currentRound].status = 'active';
      } else {
        // Tournament is complete
        tournament.status = 'completed';
        this.distributePrizes(tournament);
      }
    }

    this.tournaments.set(tournamentId, tournament);
    return tournament;
  }

  distributePrizes(tournament) {
    const participants = tournament.participants
      .filter(p => !p.isEliminated)
      .sort((a, b) => b.totalScore - a.totalScore);

    // Distribute prizes based on final rankings
    tournament.prizeDistribution.forEach(prize => {
      if (participants[prize.rank - 1]) {
        participants[prize.rank - 1].prizeEarned = prize.amount;
      }
    });

    return participants;
  }

  getTournament(tournamentId) {
    return this.tournaments.get(tournamentId);
  }

  getAllTournaments() {
    return Array.from(this.tournaments.values());
  }

  getTournamentsByStatus(status) {
    return Array.from(this.tournaments.values()).filter(t => t.status === status);
  }

  getUserTournaments(userId) {
    return Array.from(this.tournaments.values()).filter(t => 
      t.participants.some(p => p.id === userId)
    );
  }

  getUserStats(userId) {
    const userTournaments = this.getUserTournaments(userId);
    const completedTournaments = userTournaments.filter(t => t.status === 'completed');
    
    let totalEarnings = 0;
    let tournamentsWon = 0;
    let bestFinish = Infinity;
    
    completedTournaments.forEach(tournament => {
      const participant = tournament.participants.find(p => p.id === userId);
      if (participant) {
        if (participant.prizeEarned) {
          totalEarnings += participant.prizeEarned;
          if (participant.prizeEarned === tournament.prizeDistribution[0].amount) {
            tournamentsWon++;
          }
        }
        
        const ranking = tournament.participants
          .filter(p => !p.isEliminated)
          .sort((a, b) => b.totalScore - a.totalScore)
          .findIndex(p => p.id === userId) + 1;
        
        if (ranking < bestFinish) {
          bestFinish = ranking;
        }
      }
    });

    return {
      totalTournaments: userTournaments.length,
      tournamentsWon,
      tournamentsJoined: userTournaments.length,
      totalEarnings,
      averageFinish: completedTournaments.length > 0 ? 
        completedTournaments.reduce((sum, t) => {
          const participant = t.participants.find(p => p.id === userId);
          const ranking = t.participants
            .filter(p => !p.isEliminated)
            .sort((a, b) => b.totalScore - a.totalScore)
            .findIndex(p => p.id === userId) + 1;
          return sum + ranking;
        }, 0) / completedTournaments.length : 0,
      bestFinish: bestFinish === Infinity ? 0 : bestFinish,
      currentStreak: 0, // Would need to track over time
    };
  }
}

const tournamentManager = new TournamentManager();

// API Routes

// Create tournament
router.post('/create', (req, res) => {
  try {
    const tournamentData = req.body;
    const tournament = tournamentManager.createTournament(tournamentData);
    
    res.json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Join tournament
router.post('/:tournamentId/join', (req, res) => {
  try {
    const { tournamentId } = req.params;
    const participantData = req.body;
    
    const participant = tournamentManager.joinTournament(tournamentId, participantData);
    
    res.json({
      success: true,
      participant,
      tournament: tournamentManager.getTournament(tournamentId)
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Start tournament
router.post('/:tournamentId/start', (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = tournamentManager.startTournament(tournamentId);
    
    res.json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Update match result
router.post('/:tournamentId/match/:matchId/result', (req, res) => {
  try {
    const { tournamentId, matchId } = req.params;
    const result = req.body;
    
    const tournament = tournamentManager.updateMatchResult(tournamentId, matchId, result);
    
    res.json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get tournament
router.get('/:tournamentId', (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = tournamentManager.getTournament(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      tournament
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get all tournaments
router.get('/', (req, res) => {
  try {
    const { status } = req.query;
    let tournaments;
    
    if (status) {
      tournaments = tournamentManager.getTournamentsByStatus(status);
    } else {
      tournaments = tournamentManager.getAllTournaments();
    }
    
    res.json({
      success: true,
      tournaments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get user tournaments
router.get('/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const tournaments = tournamentManager.getUserTournaments(userId);
    
    res.json({
      success: true,
      tournaments
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get user stats
router.get('/stats/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const stats = tournamentManager.getUserStats(userId);
    
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

// Get tournament bracket
router.get('/:tournamentId/bracket', (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = tournamentManager.getTournament(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      brackets: tournament.brackets
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get tournament participants
router.get('/:tournamentId/participants', (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = tournamentManager.getTournament(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      participants: tournament.participants
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get tournament matches
router.get('/:tournamentId/matches', (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = tournamentManager.getTournament(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      matches: tournament.brackets[0]?.matches || []
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 