// Powered by OnSpace.AI
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useBattleStore } from '../../hooks/useBattleStore';
import { usePerformanceStore } from '../../hooks/usePerformanceStore';
import { useWalletStore } from '../../hooks/useWalletStore';

const { width } = Dimensions.get('window');

interface Performance {
  id: string;
  songTitle: string;
  artistName: string;
  score: number;
  thumbnailUrl?: string;
  createdAt: string;
}

interface Battle {
  id: string;
  songTitle: string;
  participantCount: number;
  reward: number;
  status: 'active' | 'upcoming' | 'completed';
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  reward: number;
  progress: number;
  maxProgress: number;
  type: 'sing' | 'battle' | 'share' | 'practice';
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { getRecentPerformances } = usePerformanceStore();
  const { getActiveBattles } = useBattleStore();
  const { balance } = useWalletStore();
  
  const [recentPerformances, setRecentPerformances] = useState<Performance[]>([]);
  const [activeBattles, setActiveBattles] = useState<Battle[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (user) {
      loadData();
      animateIn();
    }
  }, [user]);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  };

  const loadData = async () => {
    try {
      const performances = await getRecentPerformances(user?.id || '');
      const battles = await getActiveBattles();
      setRecentPerformances(performances);
      setActiveBattles(battles);
      
      // Mock daily challenges
      setDailyChallenges([
        {
          id: '1',
          title: 'Sing 3 Songs',
          description: 'Complete 3 karaoke performances today',
          reward: 50,
          progress: 1,
          maxProgress: 3,
          type: 'sing'
        },
        {
          id: '2',
          title: 'Win a Battle',
          description: 'Participate and win in a live battle',
          reward: 100,
          progress: 0,
          maxProgress: 1,
          type: 'battle'
        },
        {
          id: '3',
          title: 'Share Performance',
          description: 'Share your best performance with friends',
          reward: 25,
          progress: 0,
          maxProgress: 1,
          type: 'share'
        }
      ]);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const navigateToSongSelection = () => {
    router.push('/(tabs)/song-selection');
  };

  const navigateToBattle = () => {
    router.push('/(tabs)/battle');
  };

  const navigateToLeaderboard = () => {
    router.push('/(tabs)/leaderboard');
  };

  const navigateToWallet = () => {
    router.push('/(tabs)/wallet');
  };

  const renderPerformanceCard = ({ item }: { item: Performance }) => (
    <TouchableOpacity style={styles.performanceCard}>
      <Image 
        source={{ uri: item.thumbnailUrl || 'https://picsum.photos/seed/music/120/120.webp' }}
        style={styles.performanceThumbnail}
      />
      <View style={styles.performanceInfo}>
        <Text style={styles.songTitle} numberOfLines={1}>{item.songTitle}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{item.artistName}</Text>
        <View style={styles.scoreContainer}>
          <MaterialIcons name="star" size={16} color="#F59E0B" />
          <Text style={styles.scoreText}>{item.score}%</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBattleCard = ({ item }: { item: Battle }) => (
    <TouchableOpacity style={styles.battleCard} onPress={navigateToBattle}>
      <View style={styles.battleHeader}>
        <MaterialIcons name="flash-on" size={20} color="#10B981" />
        <Text style={styles.battleTitle}>Live Battle</Text>
        <View style={[styles.battleStatus, { backgroundColor: item.status === 'active' ? '#10B981' : '#6B7280' }]}>
          <Text style={styles.battleStatusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.battleSong} numberOfLines={1}>{item.songTitle}</Text>
      <View style={styles.battleParticipants}>
        <Text style={styles.participantCount}>{item.participantCount} singers</Text>
        <Text style={styles.battleReward}>🏆 {item.reward} KRT</Text>
      </View>
    </TouchableOpacity>
  );

  const renderChallengeCard = ({ item }: { item: DailyChallenge }) => (
    <TouchableOpacity style={styles.challengeCard}>
      <View style={styles.challengeHeader}>
        <MaterialIcons 
          name={
            item.type === 'sing' ? 'mic' : 
            item.type === 'battle' ? 'flash-on' : 
            item.type === 'share' ? 'share' : 'school'
          } 
          size={24} 
          color="#10B981" 
        />
        <Text style={styles.challengeReward}>+{item.reward} KRT</Text>
      </View>
      <Text style={styles.challengeTitle}>{item.title}</Text>
      <Text style={styles.challengeDescription}>{item.description}</Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(item.progress / item.maxProgress) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{item.progress}/{item.maxProgress}</Text>
      </View>
    </TouchableOpacity>
  );

  // DEVELOPMENT MODE: Skip authentication check
  const DEV_MODE = true; // Set to false to re-enable authentication check
  
  if (!DEV_MODE && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authPrompt}>
          <MaterialIcons name="mic" size={80} color="#6B46C1" />
          <Text style={styles.authTitle}>Welcome to Karatoken</Text>
          <Text style={styles.authSubtitle}>Sign in to start your karaoke journey</Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.authButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
          </View>
          <TouchableOpacity style={styles.balanceCard} onPress={navigateToWallet}>
            <MaterialIcons name="account-balance-wallet" size={24} color="#10B981" />
            <Text style={styles.balanceText}>{balance.krt} KRT</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={navigateToSongSelection}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="mic" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Sing</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={navigateToBattle}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="flash-on" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Battle</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={navigateToLeaderboard}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="leaderboard" size={32} color="#FFFFFF" />
                <Text style={styles.actionText}>Rankings</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Daily Challenges */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Challenges</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={dailyChallenges}
              renderItem={renderChallengeCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.challengesList}
            />
          </View>

          {/* Live Battles */}
          {activeBattles.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Live Battles</Text>
                <TouchableOpacity onPress={navigateToBattle}>
                  <Text style={styles.seeAllText}>Join All</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={activeBattles}
                renderItem={renderBattleCard}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.battlesList}
              />
            </View>
          )}

          {/* Recent Performances */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Performances</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentPerformances}
              renderItem={renderPerformanceCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.performancesList}
            />
          </View>
        </ScrollView>
      </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  actionButton: {
    width: 100,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  challengesList: {
    paddingHorizontal: 20,
  },
  challengeCard: {
    width: 280,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  battlesList: {
    paddingHorizontal: 20,
  },
  battleCard: {
    width: 280,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  battleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  battleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  battleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  battleStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  battleSong: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  battleParticipants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantCount: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  battleReward: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  performancesList: {
    paddingHorizontal: 20,
  },
  performanceCard: {
    width: 200,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    marginRight: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  performanceThumbnail: {
    width: '100%',
    height: 120,
  },
  performanceInfo: {
    padding: 12,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 30,
  },
  authButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});