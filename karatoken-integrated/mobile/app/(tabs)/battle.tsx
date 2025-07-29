// Powered by OnSpace.AI
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useBattleStore } from '../../hooks/useBattleStore';

interface Battle {
  id: string;
  title: string;
  songTitle: string;
  artistName: string;
  status: 'waiting' | 'active' | 'completed';
  participantCount: number;
  maxParticipants: number;
  reward: number;
  entryFee: number;
  category: 'pop' | 'rock' | 'hip-hop' | 'country' | 'jazz' | 'classical';
  startTime: string;
  duration: number;
  thumbnailUrl?: string;
}

interface BattleHistory {
  id: string;
  songTitle: string;
  artistName: string;
  result: 'won' | 'lost' | 'draw';
  score: number;
  opponentScore: number;
  reward: number;
  date: string;
}

export default function BattleScreen() {
  const { user } = useAuthStore();
  const { getActiveBattles, joinBattle, createBattle, getBattleHistory } = useBattleStore();
  const [battles, setBattles] = useState<Battle[]>([]);
  const [battleHistory, setBattleHistory] = useState<BattleHistory[]>([]);
  const [selectedTab, setSelectedTab] = useState<'active' | 'upcoming' | 'history'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const categories = [
    { id: 'all', name: 'All', icon: 'music-note' },
    { id: 'pop', name: 'Pop', icon: 'favorite' },
    { id: 'rock', name: 'Rock', icon: 'flash-on' },
    { id: 'hip-hop', name: 'Hip-Hop', icon: 'mic' },
    { id: 'country', name: 'Country', icon: 'landscape' },
    { id: 'jazz', name: 'Jazz', icon: 'piano' },
    { id: 'classical', name: 'Classical', icon: 'music-note' },
  ];

  useEffect(() => {
    loadData();
    animateIn();
  }, []);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const loadData = async () => {
    try {
      const activeBattles = await getActiveBattles();
      const history = await getBattleHistory(user?.id || '');
      setBattles(activeBattles);
      setBattleHistory(history);
    } catch (error) {
      console.error('Error loading battle data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoinBattle = async (battle: Battle) => {
    if (battle.entryFee > 0) {
      Alert.alert(
        'Join Battle',
        `Entry fee: ${battle.entryFee} KRT\nReward: ${battle.reward} KRT`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Join', 
            onPress: () => joinBattleAndNavigate(battle)
          },
        ]
      );
    } else {
      await joinBattleAndNavigate(battle);
    }
  };

  const joinBattleAndNavigate = async (battle: Battle) => {
    try {
      await joinBattle(battle.id);
      
      router.push({
        pathname: '/live-battle-arena',
        params: {
          battleId: battle.id,
          songId: battle.songTitle,
          songTitle: battle.songTitle,
          category: battle.category,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to join battle');
    }
  };

  const handleCreateBattle = () => {
    router.push('/song-selection?mode=battle');
  };

  const getBattleStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return '#F59E0B';
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pop':
        return '#EC4899';
      case 'rock':
        return '#EF4444';
      case 'hip-hop':
        return '#8B5CF6';
      case 'country':
        return '#F59E0B';
      case 'jazz':
        return '#10B981';
      case 'classical':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const filteredBattles = battles.filter(battle => 
    selectedCategory === 'all' || battle.category === selectedCategory
  );

  const renderCategoryTab = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryTab,
        selectedCategory === item.id && styles.categoryTabActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <MaterialIcons 
        name={item.icon as any} 
        size={20} 
        color={selectedCategory === item.id ? '#FFFFFF' : '#9CA3AF'} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBattleCard = ({ item }: { item: Battle }) => {
    const isActive = item.status === 'active';
    const isWaiting = item.status === 'waiting';
    const canJoin = isWaiting && item.participantCount < item.maxParticipants;

    return (
      <View style={styles.battleCard}>
        <LinearGradient
          colors={isActive ? ['#10B981', '#059669'] : ['#1F2937', '#374151']}
          style={styles.cardGradient}
        >
          {/* Battle Header */}
          <View style={styles.battleHeader}>
            <View style={styles.battleInfo}>
              <View style={styles.statusContainer}>
                <View 
                  style={[
                    styles.statusDot, 
                    { backgroundColor: getBattleStatusColor(item.status) }
                  ]} 
                />
                <Text style={styles.statusText}>
                  {(item.status || 'waiting').toUpperCase()}
                </Text>
              </View>
              <View style={styles.categoryBadge}>
                <Text style={[
                  styles.categoryBadgeText,
                  { color: getCategoryColor(item.category || 'pop') }
                ]}>
                  {(item.category || 'pop').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.rewardContainer}>
              <MaterialIcons name="emoji-events" size={20} color="#F59E0B" />
              <Text style={styles.rewardText}>{item.reward} KRT</Text>
            </View>
          </View>

          {/* Song Info */}
          <View style={styles.songInfo}>
            <Image
              source={{ uri: item.thumbnailUrl || 'https://picsum.photos/seed/music/80/80.webp' }}
              style={styles.songThumbnail}
            />
            <View style={styles.songDetails}>
              <Text style={styles.songTitle} numberOfLines={1}>{item.songTitle}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{item.artistName}</Text>
              <Text style={styles.battleTitle}>{item.title}</Text>
            </View>
          </View>

          {/* Battle Stats */}
          <View style={styles.battleStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="people" size={16} color="#9CA3AF" />
              <Text style={styles.statText}>
                {item.participantCount}/{item.maxParticipants}
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="schedule" size={16} color="#9CA3AF" />
              <Text style={styles.statText}>{item.duration}min</Text>
            </View>
            {item.entryFee > 0 && (
              <View style={styles.statItem}>
                <MaterialIcons name="account-balance-wallet" size={16} color="#9CA3AF" />
                <Text style={styles.statText}>{item.entryFee} KRT</Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.joinButton,
              !canJoin && styles.joinButtonDisabled
            ]}
            onPress={() => handleJoinBattle(item)}
            disabled={!canJoin}
          >
            <LinearGradient
              colors={canJoin ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>
                {canJoin ? 'Join Battle' : 'Full'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderHistoryCard = ({ item }: { item: BattleHistory }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>{item.date}</Text>
        <View style={[
          styles.resultBadge,
          { backgroundColor: item.result === 'won' ? '#10B981' : item.result === 'lost' ? '#EF4444' : '#F59E0B' }
        ]}>
          <Text style={styles.resultText}>{(item.result || 'draw').toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.historyContent}>
        <View style={styles.historySongInfo}>
          <Text style={styles.historySongTitle}>{item.songTitle}</Text>
          <Text style={styles.historyArtistName}>{item.artistName}</Text>
        </View>
        <View style={styles.historyScores}>
          <Text style={styles.historyScore}>You: {item.score}%</Text>
          <Text style={styles.historyScore}>Opponent: {item.opponentScore}%</Text>
        </View>
        <View style={styles.historyReward}>
          <MaterialIcons name="emoji-events" size={16} color="#F59E0B" />
          <Text style={styles.historyRewardText}>+{item.reward} KRT</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Battle Arena</Text>
          <TouchableOpacity style={styles.createButton} onPress={handleCreateBattle}>
            <MaterialIcons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
            onPress={() => setSelectedTab('active')}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
              Active Battles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'upcoming' && styles.tabActive]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.tabTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
            onPress={() => setSelectedTab('history')}
          >
            <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        {selectedTab !== 'history' && (
          <View style={styles.categoryContainer}>
            <FlatList
              data={categories}
              renderItem={renderCategoryTab}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            />
          </View>
        )}

        {/* Content */}
        <FlatList
          data={selectedTab === 'history' ? battleHistory : filteredBattles}
          renderItem={selectedTab === 'history' ? renderHistoryCard : renderBattleCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="flash-on" size={60} color="#6B7280" />
              <Text style={styles.emptyTitle}>
                {selectedTab === 'history' ? 'No Battle History' : 'No Battles Available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'history' 
                  ? 'Start battling to see your history here'
                  : 'Create a battle or check back later'
                }
              </Text>
            </View>
          }
        />
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#10B981',
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  categoryTabActive: {
    backgroundColor: '#10B981',
  },
  categoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 6,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  battleCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  battleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  battleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  songInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  songThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  songDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  battleTitle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  battleStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historySongInfo: {
    flex: 1,
  },
  historySongTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  historyArtistName: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  historyScores: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  historyScore: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  historyReward: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyRewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
