import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { tournamentService } from '../services/tournamentService';

const { width, height } = Dimensions.get('window');

interface Tournament {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'registration' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee: number;
  totalPrizePool: number;
  prizeDistribution: PrizeDistribution[];
  rounds: TournamentRound[];
  currentRound: number;
  brackets: TournamentBracket[];
  rules: string[];
  createdBy: string;
  createdAt: string;
}

interface TournamentRound {
  id: string;
  name: string;
  roundNumber: number;
  status: 'pending' | 'active' | 'completed';
  matches: TournamentMatch[];
  startDate: string;
  endDate: string;
}

interface TournamentMatch {
  id: string;
  matchNumber: number;
  participant1: TournamentParticipant | null;
  participant2: TournamentParticipant | null;
  winner: TournamentParticipant | null;
  status: 'pending' | 'active' | 'completed';
  score1: number;
  score2: number;
  scheduledTime: string;
  completedAt?: string;
}

interface TournamentParticipant {
  id: string;
  displayName: string;
  photoURL?: string;
  seed: number;
  isEliminated: boolean;
  totalScore: number;
  matchesWon: number;
  matchesLost: number;
  joinedAt: string;
}

interface TournamentBracket {
  id: string;
  name: string;
  type: 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss';
  matches: TournamentMatch[];
  participants: TournamentParticipant[];
}

interface PrizeDistribution {
  rank: number;
  percentage: number;
  amount: number;
  description: string;
}

interface TournamentStats {
  totalTournaments: number;
  tournamentsWon: number;
  tournamentsJoined: number;
  totalEarnings: number;
  averageFinish: number;
  bestFinish: number;
  currentStreak: number;
}

export default function TournamentSystemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [userStats, setUserStats] = useState<TournamentStats | null>(null);
  const [selectedTab, setSelectedTab] = useState<'active' | 'upcoming' | 'completed' | 'my-tournaments'>('active');

  const [showTournamentDetails, setShowTournamentDetails] = useState(false);
  const [showBracket, setShowBracket] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadTournaments();
    loadUserStats();
    animateIn();
  }, [selectedTab]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getTournaments(selectedTab);
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      Alert.alert('Error', 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;
    
    try {
      const stats = await tournamentService.getUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTournaments(), loadUserStats()]);
    setRefreshing(false);
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    if (!user) {
      Alert.alert('Error', 'Please log in to join tournaments');
      return;
    }

    try {
      await tournamentService.joinTournament(tournament.id, user.id);
      Alert.alert('Success', 'Successfully joined tournament!');
      loadTournaments();
    } catch (error) {
      Alert.alert('Error', 'Failed to join tournament');
    }
  };

  const handleCreateTournament = () => {
    router.push('/tournament-create');
  };

  const handleViewTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowTournamentDetails(true);
  };

  const handleViewBracket = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setShowBracket(true);
  };

  const getTournamentStatusColor = (status: string) => {
    switch (status) {
      case 'registration': return '#F59E0B';
      case 'active': return '#10B981';
      case 'completed': return '#6B7280';
      default: return '#9CA3AF';
    }
  };

  const getTournamentStatusText = (status: string) => {
    switch (status) {
      case 'registration': return 'Registration Open';
      case 'active': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pop': return '#EC4899';
      case 'rock': return '#EF4444';
      case 'hip-hop': return '#8B5CF6';
      case 'country': return '#F59E0B';
      case 'jazz': return '#10B981';
      case 'classical': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const renderTournamentCard = ({ item }: { item: Tournament }) => (
    <TouchableOpacity 
      style={styles.tournamentCard}
      onPress={() => handleViewTournament(item)}
    >
      <LinearGradient
        colors={['#1F2937', '#374151']}
        style={styles.tournamentGradient}
      >
        <View style={styles.tournamentHeader}>
          <View style={styles.tournamentTitleContainer}>
            <Text style={styles.tournamentTitle}>{item.title}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
              <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getTournamentStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getTournamentStatusText(item.status)}</Text>
          </View>
        </View>

        <Text style={styles.tournamentDescription}>{item.description}</Text>

        <View style={styles.tournamentStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={16} color="#9CA3AF" />
            <Text style={styles.statText}>
              {item.currentParticipants}/{item.maxParticipants}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="emoji-events" size={16} color="#F59E0B" />
            <Text style={styles.statText}>{item.totalPrizePool} KRT</Text>
          </View>
          
          <View style={styles.statItem}>
            <MaterialIcons name="attach-money" size={16} color="#10B981" />
            <Text style={styles.statText}>{item.entryFee} KRT</Text>
          </View>
        </View>

        <View style={styles.tournamentDates}>
          <Text style={styles.dateText}>
            Starts: {new Date(item.startDate).toLocaleDateString()}
          </Text>
          <Text style={styles.dateText}>
            Ends: {new Date(item.endDate).toLocaleDateString()}
          </Text>
        </View>

        {item.status === 'registration' && (
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => handleJoinTournament(item)}
          >
            <Text style={styles.joinButtonText}>Join Tournament</Text>
          </TouchableOpacity>
        )}

        {item.status === 'active' && (
          <TouchableOpacity 
            style={styles.bracketButton}
            onPress={() => handleViewBracket(item)}
          >
            <Text style={styles.bracketButtonText}>View Bracket</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderUserStats = () => (
    <View style={styles.statsContainer}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.statsGradient}
      >
        <Text style={styles.statsTitle}>Tournament Stats</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats?.totalTournaments || 0}</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats?.tournamentsWon || 0}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats?.totalEarnings || 0}</Text>
            <Text style={styles.statLabel}>KRT Earned</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{userStats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTournamentDetails = () => (
    <Modal
      visible={showTournamentDetails}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedTournament && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedTournament.title}</Text>
                  <TouchableOpacity onPress={() => setShowTournamentDetails(false)}>
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalDescription}>{selectedTournament.description}</Text>

                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Prize Pool</Text>
                    <Text style={styles.modalStatValue}>{selectedTournament.totalPrizePool} KRT</Text>
                  </View>
                  
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Entry Fee</Text>
                    <Text style={styles.modalStatValue}>{selectedTournament.entryFee} KRT</Text>
                  </View>
                  
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Participants</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedTournament.currentParticipants}/{selectedTournament.maxParticipants}
                    </Text>
                  </View>
                </View>

                <View style={styles.prizeDistribution}>
                  <Text style={styles.sectionTitle}>Prize Distribution</Text>
                  {selectedTournament.prizeDistribution.map((prize, index) => (
                    <View key={index} style={styles.prizeItem}>
                      <Text style={styles.prizeRank}>#{prize.rank}</Text>
                      <Text style={styles.prizeAmount}>{prize.amount} KRT</Text>
                      <Text style={styles.prizeDescription}>{prize.description}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.rulesSection}>
                  <Text style={styles.sectionTitle}>Tournament Rules</Text>
                  {selectedTournament.rules.map((rule, index) => (
                    <View key={index} style={styles.ruleItem}>
                      <MaterialIcons name="check-circle" size={16} color="#10B981" />
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>

                {selectedTournament.status === 'registration' && (
                  <TouchableOpacity 
                    style={styles.modalJoinButton}
                    onPress={() => {
                      setShowTournamentDetails(false);
                      handleJoinTournament(selectedTournament);
                    }}
                  >
                    <Text style={styles.modalJoinButtonText}>Join Tournament</Text>
                  </TouchableOpacity>
                )}

                {selectedTournament.status === 'active' && (
                  <TouchableOpacity 
                    style={styles.modalBracketButton}
                    onPress={() => {
                      setShowTournamentDetails(false);
                      handleViewBracket(selectedTournament);
                    }}
                  >
                    <Text style={styles.modalBracketButtonText}>View Live Bracket</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderBracketModal = () => (
    <Modal
      visible={showBracket}
      transparent
      animationType="slide"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.bracketModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tournament Bracket</Text>
            <TouchableOpacity onPress={() => setShowBracket(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedTournament?.rounds.map((round, roundIndex) => (
                <View key={round.id} style={styles.roundContainer}>
                  <Text style={styles.roundTitle}>{round.name}</Text>
                  
                  {round.matches.map((match, matchIndex) => (
                    <View key={match.id} style={styles.matchContainer}>
                      <View style={styles.matchHeader}>
                        <Text style={styles.matchNumber}>Match {match.matchNumber}</Text>
                        <View style={[styles.matchStatus, { backgroundColor: getTournamentStatusColor(match.status) }]}>
                          <Text style={styles.matchStatusText}>{match.status}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.participantContainer}>
                        <View style={[styles.participant, match.winner?.id === match.participant1?.id && styles.winner]}>
                          <Text style={styles.participantName}>
                            {match.participant1?.displayName || 'TBD'}
                          </Text>
                          <Text style={styles.participantScore}>{match.score1}</Text>
                        </View>
                        
                        <View style={styles.vsContainer}>
                          <Text style={styles.vsText}>VS</Text>
                        </View>
                        
                        <View style={[styles.participant, match.winner?.id === match.participant2?.id && styles.winner]}>
                          <Text style={styles.participantName}>
                            {match.participant2?.displayName || 'TBD'}
                          </Text>
                          <Text style={styles.participantScore}>{match.score2}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tournaments</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateTournament}>
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* User Stats */}
        {userStats && renderUserStats()}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
            onPress={() => setSelectedTab('active')}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
              Active
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
            onPress={() => setSelectedTab('completed')}
          >
            <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'my-tournaments' && styles.activeTab]}
            onPress={() => setSelectedTab('my-tournaments')}
          >
            <Text style={[styles.tabText, selectedTab === 'my-tournaments' && styles.activeTabText]}>
              My Tournaments
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tournament List */}
        <FlatList
          data={tournaments}
          renderItem={renderTournamentCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tournamentList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="emoji-events" size={64} color="#6B7280" />
              <Text style={styles.emptyText}>No tournaments found</Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === 'active' ? 'Check back later for active tournaments' :
                 selectedTab === 'upcoming' ? 'No upcoming tournaments scheduled' :
                 selectedTab === 'completed' ? 'No completed tournaments yet' :
                 'You haven\'t joined any tournaments yet'}
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Modals */}
      {renderTournamentDetails()}
      {renderBracketModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 12,
  },
  statsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 24,
  },
  statsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 72) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tournamentList: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  tournamentCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tournamentGradient: {
    padding: 20,
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tournamentTitleContainer: {
    flex: 1,
  },
  tournamentTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  tournamentDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tournamentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  tournamentDates: {
    marginBottom: 16,
  },
  dateText: {
    color: '#6B7280',
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bracketButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  bracketButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  bracketModalContainer: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalDescription: {
    color: '#9CA3AF',
    fontSize: 16,
    lineHeight: 24,
    padding: 24,
    paddingTop: 0,
  },
  modalStats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 16,
  },
  modalStat: {
    flex: 1,
    alignItems: 'center',
  },
  modalStatLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  modalStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  prizeDistribution: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  prizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  prizeRank: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
  },
  prizeAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    width: 80,
  },
  prizeDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
  },
  rulesSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ruleText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  modalJoinButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    margin: 24,
    padding: 16,
    alignItems: 'center',
  },
  modalJoinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBracketButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    margin: 24,
    padding: 16,
    alignItems: 'center',
  },
  modalBracketButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  roundContainer: {
    minWidth: 200,
    marginRight: 16,
    padding: 16,
  },
  roundTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  matchContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchNumber: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  matchStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  matchStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  participantContainer: {
    gap: 8,
  },
  participant: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#4B5563',
    borderRadius: 6,
  },
  winner: {
    backgroundColor: '#10B981',
  },
  participantName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  participantScore: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vsContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  vsText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
}); 