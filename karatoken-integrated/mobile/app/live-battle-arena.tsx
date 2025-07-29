import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { useBattleStore } from '../hooks/useBattleStore';

const { width, height } = Dimensions.get('window');

interface BattleParticipant {
  id: string;
  displayName: string;
  photoURL?: string;
  isReady: boolean;
  isPerforming: boolean;
  currentScore: number;
  performanceData?: any;
  rank: number;
}

interface BattleRound {
  id: string;
  songTitle: string;
  artistName: string;
  duration: number;
  currentParticipant?: string;
  scores: { [participantId: string]: number };
  status: 'waiting' | 'active' | 'completed';
}

interface LiveBattle {
  id: string;
  title: string;
  category: string;
  participants: BattleParticipant[];
  rounds: BattleRound[];
  currentRound: number;
  status: 'waiting' | 'active' | 'completed';
  startTime: string;
  endTime?: string;
  totalReward: number;
  entryFee: number;
}

export default function LiveBattleArenaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { currentBattle, updateBattle } = useBattleStore();
  
  const [battle, setBattle] = useState<LiveBattle | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [currentParticipant, setCurrentParticipant] = useState<BattleParticipant | null>(null);
  const [isPerforming, setIsPerforming] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(0);
  const [realTimeScore, setRealTimeScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [battleResults, setBattleResults] = useState<any>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const scoreAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const performanceInterval = useRef<any>(null);

  const battleId = params.battleId as string;
  const songId = params.songId as string;
  const songTitle = params.songTitle as string;

  useEffect(() => {
    if (!battleId || !user) {
      router.back();
      return;
    }

    initializeBattle();
    startRealTimeUpdates();

    return () => {
      cleanupBattle();
    };
  }, [battleId, user]);

  const initializeBattle = async () => {
    try {
      // Mock battle data - replace with real API call
      const mockBattle: LiveBattle = {
        id: battleId,
        title: `Battle: ${songTitle}`,
        category: params.category as string || 'pop',
        participants: [
          {
            id: user?.id || 'user1',
            displayName: user?.displayName || 'You',
            photoURL: user?.photoURL,
            isReady: false,
            isPerforming: false,
            currentScore: 0,
            rank: 1,
          },
          {
            id: 'opponent1',
            displayName: 'KaraokeKing',
            photoURL: 'https://picsum.photos/seed/opponent1/60/60.webp',
            isReady: true,
            isPerforming: false,
            currentScore: 0,
            rank: 2,
          },
          {
            id: 'opponent2',
            displayName: 'VocalQueen',
            photoURL: 'https://picsum.photos/seed/opponent2/60/60.webp',
            isReady: true,
            isPerforming: false,
            currentScore: 0,
            rank: 3,
          },
        ],
        rounds: [
          {
            id: 'round1',
            songTitle,
            artistName: 'Various Artists',
            duration: 180,
            scores: {},
            status: 'waiting',
          },
        ],
        currentRound: 0,
        status: 'waiting',
        startTime: new Date().toISOString(),
        totalReward: 500,
        entryFee: 50,
      };

      setBattle(mockBattle);
      setCurrentParticipant(mockBattle.participants.find(p => p.id === user?.id) || null);
    } catch (error) {
      console.error('Failed to initialize battle:', error);
      Alert.alert('Error', 'Failed to join battle');
    }
  };

  const startRealTimeUpdates = () => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateBattleStatus();
    }, 2000);

    return () => clearInterval(interval);
  };

  const updateBattleStatus = () => {
    if (!battle) return;

    // Simulate battle progression
    const updatedBattle = { ...battle };
    
    // Update participant statuses
    updatedBattle.participants = updatedBattle.participants.map(participant => ({
      ...participant,
      isReady: Math.random() > 0.3, // Simulate ready status
    }));

    // Start battle if all participants are ready
    if (updatedBattle.participants.every(p => p.isReady) && updatedBattle.status === 'waiting') {
      updatedBattle.status = 'active';
      updatedBattle.rounds[0].status = 'active';
    }

    setBattle(updatedBattle);
  };

  const cleanupBattle = () => {
    if (performanceInterval.current) {
      clearInterval(performanceInterval.current);
    }
    if (sound) {
      sound.unloadAsync();
    }
  };

  const handleReady = async () => {
    if (!battle || !currentParticipant) return;

    try {
      setIsJoining(true);
      
      // Update participant ready status
      const updatedBattle = { ...battle };
      const participantIndex = updatedBattle.participants.findIndex(p => p.id === currentParticipant.id);
      
      if (participantIndex !== -1) {
        updatedBattle.participants[participantIndex].isReady = true;
        setBattle(updatedBattle);
        setCurrentParticipant(updatedBattle.participants[participantIndex]);
      }

      // Start battle if all participants are ready
      if (updatedBattle.participants.every(p => p.isReady)) {
        startBattle();
      }
    } catch (error) {
      console.error('Failed to ready up:', error);
      Alert.alert('Error', 'Failed to ready up');
    } finally {
      setIsJoining(false);
    }
  };

  const startBattle = () => {
    if (!battle) return;

    const updatedBattle = { ...battle };
    updatedBattle.status = 'active';
    updatedBattle.rounds[0].status = 'active';
    setBattle(updatedBattle);

    // Start with first participant
    const firstParticipant = updatedBattle.participants[0];
    setCurrentParticipant(firstParticipant);
    startPerformance(firstParticipant);
  };

  const startPerformance = async (participant: BattleParticipant) => {
    if (!battle) return;

    try {
      // Update participant status
      const updatedBattle = { ...battle };
      const participantIndex = updatedBattle.participants.findIndex(p => p.id === participant.id);
      
      if (participantIndex !== -1) {
        updatedBattle.participants[participantIndex].isPerforming = true;
        setBattle(updatedBattle);
      }

      setCurrentParticipant(participant);
      setIsPerforming(participant.id === user?.id);

      // Start real-time scoring
      if (participant.id === user?.id) {
        startRealTimeScoring();
      } else {
        // Simulate opponent performance
        simulateOpponentPerformance(participant);
      }
    } catch (error) {
      console.error('Failed to start performance:', error);
    }
  };

  const startRealTimeScoring = () => {
    setRealTimeScore(0);
    
    performanceInterval.current = setInterval(() => {
      // Simulate real-time score updates
      const scoreIncrement = Math.floor(Math.random() * 10) + 1;
      setRealTimeScore(prev => {
        const newScore = Math.min(prev + scoreIncrement, 100);
        
        // Animate score
        Animated.timing(scoreAnimation, {
          toValue: newScore,
          duration: 500,
          useNativeDriver: false,
        }).start();

        return newScore;
      });
    }, 1000);
  };

  const simulateOpponentPerformance = (participant: BattleParticipant) => {
    let opponentScore = 0;
    
    const interval = setInterval(() => {
      const scoreIncrement = Math.floor(Math.random() * 15) + 5;
      opponentScore = Math.min(opponentScore + scoreIncrement, 100);
      
      // Update participant score
      if (battle) {
        const updatedBattle = { ...battle };
        const participantIndex = updatedBattle.participants.findIndex(p => p.id === participant.id);
        
        if (participantIndex !== -1) {
          updatedBattle.participants[participantIndex].currentScore = opponentScore;
          setBattle(updatedBattle);
        }
      }

      if (opponentScore >= 100) {
        clearInterval(interval);
        completePerformance(participant, opponentScore);
      }
    }, 800);
  };

  const completePerformance = async (participant: BattleParticipant, finalScore: number) => {
    if (!battle) return;

    // Stop real-time scoring
    if (performanceInterval.current) {
      clearInterval(performanceInterval.current);
    }

    // Update participant status and score
    const updatedBattle = { ...battle };
    const participantIndex = updatedBattle.participants.findIndex(p => p.id === participant.id);
    
    if (participantIndex !== -1) {
      updatedBattle.participants[participantIndex].isPerforming = false;
      updatedBattle.participants[participantIndex].currentScore = finalScore;
      setBattle(updatedBattle);
    }

    // Move to next participant or end battle
    const nextParticipantIndex = participantIndex + 1;
    if (nextParticipantIndex < updatedBattle.participants.length) {
      const nextParticipant = updatedBattle.participants[nextParticipantIndex];
      setTimeout(() => startPerformance(nextParticipant), 2000);
    } else {
      // All participants have performed
      endBattle();
    }
  };

  const endBattle = () => {
    if (!battle) return;

    const updatedBattle = { ...battle };
    updatedBattle.status = 'completed';
    updatedBattle.endTime = new Date().toISOString();
    setBattle(updatedBattle);

    // Calculate final results
    const results = calculateBattleResults(updatedBattle);
    setBattleResults(results);
    setShowResults(true);
  };

  const calculateBattleResults = (battle: LiveBattle) => {
    const participants = [...battle.participants].sort((a, b) => b.currentScore - a.currentScore);
    
    const winner = participants[0];
    const isWinner = winner.id === user?.id;
    
    return {
      winner,
      participants,
      isWinner,
      reward: isWinner ? battle.totalReward : 0,
      finalScore: winner.currentScore,
    };
  };

  const handleLeaveBattle = () => {
    Alert.alert(
      'Leave Battle',
      'Are you sure you want to leave this battle? You will lose your entry fee.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !user) return;

    const message = {
      id: Date.now().toString(),
      userId: user.id,
      displayName: user.displayName,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const renderParticipantCard = (participant: BattleParticipant, index: number) => {
    const isCurrentUser = participant.id === user?.id;
    const isPerforming = participant.isPerforming;
    const isReady = participant.isReady;

    return (
      <View key={participant.id} style={[styles.participantCard, isCurrentUser && styles.currentUserCard]}>
        <LinearGradient
          colors={isPerforming ? ['#FF6B6B', '#FF8E8E'] : ['#4ECDC4', '#44A08D']}
          style={styles.participantGradient}
        >
          <View style={styles.participantHeader}>
            <Text style={styles.participantRank}>#{participant.rank}</Text>
            <Text style={styles.participantName}>{participant.displayName}</Text>
            {isCurrentUser && <Text style={styles.currentUserLabel}>(You)</Text>}
          </View>

          <View style={styles.participantStatus}>
            {isPerforming ? (
              <View style={styles.performingIndicator}>
                <Animated.View
                  style={[
                    styles.pulseDot,
                    {
                      transform: [{ scale: pulseAnimation }],
                    },
                  ]}
                />
                <Text style={styles.performingText}>Performing</Text>
              </View>
            ) : isReady ? (
              <View style={styles.readyIndicator}>
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
                <Text style={styles.readyText}>Ready</Text>
              </View>
            ) : (
              <View style={styles.waitingIndicator}>
                <MaterialIcons name="schedule" size={20} color="#F59E0B" />
                <Text style={styles.waitingText}>Waiting</Text>
              </View>
            )}
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Score</Text>
            <Animated.Text style={[styles.scoreValue, { opacity: scoreAnimation }]}>
              {participant.currentScore}
            </Animated.Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderBattleHUD = () => (
    <View style={styles.battleHUD}>
      <View style={styles.battleInfo}>
        <Text style={styles.battleTitle}>{battle?.title}</Text>
        <Text style={styles.battleStatus}>
          {battle?.status === 'waiting' ? 'Waiting for players...' :
           battle?.status === 'active' ? 'Battle in progress!' :
           'Battle completed'}
        </Text>
      </View>

      <View style={styles.battleControls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setShowChat(!showChat)}>
          <MaterialIcons name="chat" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={handleLeaveBattle}>
          <MaterialIcons name="exit-to-app" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderChat = () => (
    <Modal
      visible={showChat}
      transparent
      animationType="slide"
    >
      <View style={styles.chatOverlay}>
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Battle Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatMessages}>
            {chatMessages.map(message => (
              <View key={message.id} style={styles.chatMessage}>
                <Text style={styles.chatSender}>{message.displayName}</Text>
                <Text style={styles.chatText}>{message.message}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.chatInput}>
            <TextInput
              style={styles.chatInputField}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendChatMessage}>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderResultsModal = () => (
    <Modal
      visible={showResults}
      transparent
      animationType="fade"
    >
      <View style={styles.resultsOverlay}>
        <View style={styles.resultsContainer}>
          <LinearGradient
            colors={battleResults?.isWinner ? ['#FFD700', '#FFA500'] : ['#6B7280', '#4B5563']}
            style={styles.resultsGradient}
          >
            <MaterialIcons 
              name={battleResults?.isWinner ? 'emoji-events' : 'sentiment-dissatisfied'} 
              size={60} 
              color="#FFFFFF" 
            />
            <Text style={styles.resultsTitle}>
              {battleResults?.isWinner ? 'Victory!' : 'Battle Complete'}
            </Text>
            
            <Text style={styles.resultsSubtitle}>
              {battleResults?.isWinner 
                ? `You won ${battleResults.reward} KRT!` 
                : 'Better luck next time!'}
            </Text>

            <View style={styles.resultsTable}>
              {battleResults?.participants.map((participant: any, index: number) => (
                <View key={participant.id} style={styles.resultRow}>
                  <Text style={styles.resultRank}>#{index + 1}</Text>
                  <Text style={styles.resultName}>{participant.displayName}</Text>
                  <Text style={styles.resultScore}>{participant.currentScore}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.resultsButton}
              onPress={() => {
                setShowResults(false);
                router.back();
              }}
            >
              <Text style={styles.resultsButtonText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  if (!battle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Joining battle...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Battle HUD */}
      {renderBattleHUD()}

      {/* Participants Grid */}
      <ScrollView style={styles.participantsContainer}>
        <View style={styles.participantsGrid}>
          {battle.participants.map(renderParticipantCard)}
        </View>
      </ScrollView>

      {/* Ready Button */}
      {!currentParticipant?.isReady && battle.status === 'waiting' && (
        <View style={styles.readyContainer}>
          <TouchableOpacity 
            style={[styles.readyButton, isJoining && styles.readyButtonDisabled]}
            onPress={handleReady}
            disabled={isJoining}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
            )}
            <Text style={styles.readyButtonText}>
              {isJoining ? 'Joining...' : 'Ready Up'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Performance Area */}
      {isPerforming && (
        <View style={styles.performanceArea}>
          <Text style={styles.performanceTitle}>Your Turn!</Text>
          <Text style={styles.performanceSong}>{songTitle}</Text>
          <View style={styles.realTimeScore}>
            <Text style={styles.realTimeScoreLabel}>Live Score</Text>
            <Animated.Text style={[styles.realTimeScoreValue, { opacity: scoreAnimation }]}>
              {realTimeScore}
            </Animated.Text>
          </View>
        </View>
      )}

      {/* Chat Modal */}
      {renderChat()}

      {/* Results Modal */}
      {renderResultsModal()}

      {/* Instructions Modal */}
      <Modal
        visible={showInstructions}
        transparent
        animationType="fade"
      >
        <View style={styles.instructionsOverlay}>
          <View style={styles.instructionsContainer}>
            <LinearGradient
              colors={['#6B46C1', '#8B5CF6']}
              style={styles.instructionsGradient}
            >
              <MaterialIcons name="sports-esports" size={40} color="#FFFFFF" />
              <Text style={styles.instructionsTitle}>Live Battle Arena</Text>
              
              <View style={styles.instructionsList}>
                <View style={styles.instructionItem}>
                  <MaterialIcons name="group" size={20} color="#FFFFFF" />
                  <Text style={styles.instructionText}>
                    Compete against other singers in real-time
                  </Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <MaterialIcons name="mic" size={20} color="#FFFFFF" />
                  <Text style={styles.instructionText}>
                    Perform when it's your turn
                  </Text>
                </View>
                
                <View style={styles.instructionItem}>
                  <MaterialIcons name="emoji-events" size={20} color="#FFFFFF" />
                  <Text style={styles.instructionText}>
                    Win KRT tokens for the best performance
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.instructionsButton}
                onPress={() => setShowInstructions(false)}
              >
                <Text style={styles.instructionsButtonText}>Let's Battle!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginTop: 16,
  },
  battleHUD: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1F2937',
  },
  battleInfo: {
    flex: 1,
  },
  battleTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  battleStatus: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  battleControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 8,
  },
  participantsContainer: {
    flex: 1,
    padding: 16,
  },
  participantsGrid: {
    gap: 16,
  },
  participantCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  participantGradient: {
    padding: 16,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  participantRank: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  currentUserLabel: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  participantStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  performingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
  performingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  readyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  readyContainer: {
    padding: 16,
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  readyButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  readyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  performanceArea: {
    backgroundColor: '#1F2937',
    padding: 24,
    alignItems: 'center',
  },
  performanceTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  performanceSong: {
    color: '#9CA3AF',
    fontSize: 18,
    marginBottom: 16,
  },
  realTimeScore: {
    alignItems: 'center',
  },
  realTimeScoreLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  realTimeScoreValue: {
    color: '#10B981',
    fontSize: 36,
    fontWeight: 'bold',
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.6,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  chatTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatMessage: {
    marginBottom: 12,
  },
  chatSender: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  chatText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  chatInput: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 12,
  },
  resultsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultsGradient: {
    padding: 32,
    alignItems: 'center',
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  resultsSubtitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 24,
  },
  resultsTable: {
    width: '100%',
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultRank: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
  },
  resultName: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  resultScore: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  resultsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  instructionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    width: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  instructionsGradient: {
    padding: 32,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  instructionsList: {
    width: '100%',
    marginBottom: 32,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  instructionsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  instructionsButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 