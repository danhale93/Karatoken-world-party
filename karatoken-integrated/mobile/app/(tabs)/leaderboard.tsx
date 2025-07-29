// Powered by OnSpace.AI
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLeaderboardStore } from '../../hooks/useLeaderboardStore';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const { getLeaderboard } = useLeaderboardStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'allTime'>('weekly');
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedPeriod]);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(selectedPeriod);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: 'emoji-events', color: '#FFD700' };
      case 2:
        return { icon: 'emoji-events', color: '#C0C0C0' };
      case 3:
        return { icon: 'emoji-events', color: '#CD7F32' };
      default:
        return { icon: 'person', color: '#9CA3AF' };
    }
  };

  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    const rankInfo = getRankIcon(rank);
    const isTopThree = rank <= 3;

    return (
      <View style={[styles.leaderboardItem, isTopThree && styles.topThreeItem]}>
        {isTopThree && (
          <LinearGradient
            colors={rank === 1 ? ['#FFD700', '#FFA500'] : rank === 2 ? ['#C0C0C0', '#A0A0A0'] : ['#CD7F32', '#8B4513']}
            style={styles.topThreeGradient}
          />
        )}
        
        <View style={styles.rankContainer}>
          <MaterialIcons 
            name={rankInfo.icon} 
            size={isTopThree ? 32 : 24} 
            color={rankInfo.color} 
          />
          <Text style={[styles.rankText, isTopThree && styles.topThreeRankText]}>
            {rank}
          </Text>
        </View>

        <Image 
          source={{ uri: item.photoURL || 'https://picsum.photos/seed/user/60/60.webp' }}
          style={[styles.userPhoto, isTopThree && styles.topThreePhoto]}
        />

        <View style={styles.userInfo}>
          <Text style={[styles.userName, isTopThree && styles.topThreeUserName]}>
            {item.displayName}
          </Text>
          <View style={styles.userStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <Text style={styles.statText}>{item.averageScore}%</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="mic" size={16} color="#10B981" />
              <Text style={styles.statText}>{item.totalPerformances}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pointsContainer}>
          <Text style={[styles.pointsText, isTopThree && styles.topThreePointsText]}>
            {item.points.toLocaleString()}
          </Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialIcons name="filter-list" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'allTime'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.activePeriodButtonText,
              ]}
            >
              {period === 'allTime' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Leaderboard List */}
      <FlatList
        data={leaderboard}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Banner */}
      <View style={styles.bottomBanner}>
        <LinearGradient
          colors={['#6B46C1', '#8B5CF6']}
          style={styles.bannerGradient}
        >
          <MaterialIcons name="emoji-events" size={32} color="#FFFFFF" />
          <Text style={styles.bannerTitle}>Climb the Ranks!</Text>
          <Text style={styles.bannerSubtitle}>Perform more to earn points</Text>
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: '#10B981',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  topThreeItem: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  topThreeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: 15,
    minWidth: 40,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  topThreeRankText: {
    fontSize: 16,
  },
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  topThreePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  topThreeUserName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userStats: {
    flexDirection: 'row',
    gap: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  topThreePointsText: {
    fontSize: 20,
  },
  pointsLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bottomBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  bannerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});