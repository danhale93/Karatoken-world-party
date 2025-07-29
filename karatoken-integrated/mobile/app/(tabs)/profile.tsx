// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { usePerformanceStore } from '../../hooks/usePerformanceStore';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuthStore();
  const { getPerformances } = usePerformanceStore();
  const [performances, setPerformances] = useState([]);
  const [stats, setStats] = useState({
    totalPerformances: 0,
    averageScore: 0,
    battlesWon: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userPerformances = await getPerformances(user.id);
      setPerformances(userPerformances);
      
      // Calculate stats
      const totalPerformances = userPerformances.length;
      const averageScore = totalPerformances > 0 
        ? Math.round(userPerformances.reduce((sum, p) => sum + p.score, 0) / totalPerformances)
        : 0;
      
      setStats({
        totalPerformances,
        averageScore,
        battlesWon: 12, // Mock data
        totalEarnings: 2450, // Mock data
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/sign-in');
          }
        },
      ]
    );
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Diamond':
        return '#B9F2FF';
      case 'Platinum':
        return '#E5E7EB';
      case 'Gold':
        return '#FDE68A';
      case 'Silver':
        return '#D1D5DB';
      case 'Bronze':
        return '#FBBF24';
      default:
        return '#9CA3AF';
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.signInPrompt}>
          <Text style={styles.signInText}>Please sign in to view your profile</Text>
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <MaterialIcons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#1F2937', '#374151']}
            style={styles.profileGradient}
          >
            <View style={styles.profileHeader}>
              <Image 
                source={{ uri: user.photoURL || 'https://picsum.photos/seed/profile/120/120.webp' }}
                style={styles.profilePhoto}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.displayName}>{user.displayName}</Text>
                <View style={styles.rankContainer}>
                  <MaterialIcons 
                    name="emoji-events" 
                    size={20} 
                    color={getRankColor(user.rank)} 
                  />
                  <Text style={[styles.rankText, { color: getRankColor(user.rank) }]}>
                    {user.rank}
                  </Text>
                </View>
                <Text style={styles.joinDate}>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalPerformances}</Text>
                <Text style={styles.statLabel}>Performances</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.averageScore}%</Text>
                <Text style={styles.statLabel}>Avg Score</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.battlesWon}</Text>
                <Text style={styles.statLabel}>Battles Won</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalEarnings}</Text>
                <Text style={styles.statLabel}>KRT Earned</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionItem}>
            <MaterialIcons name="edit" size={24} color="#10B981" />
            <Text style={styles.actionText}>Edit Profile</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialIcons name="history" size={24} color="#F59E0B" />
            <Text style={styles.actionText}>Performance History</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialIcons name="military-tech" size={24} color="#8B5CF6" />
            <Text style={styles.actionText}>Achievements</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem}>
            <MaterialIcons name="share" size={24} color="#06B6D4" />
            <Text style={styles.actionText}>Share Profile</Text>
            <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Recent Performances */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Performances</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.performancesList}>
            {performances.slice(0, 3).map((performance, index) => (
              <View key={performance.id} style={styles.performanceItem}>
                <Image 
                  source={{ uri: performance.thumbnailUrl || 'https://picsum.photos/seed/song/60/60.webp' }}
                  style={styles.performanceThumbnail}
                />
                <View style={styles.performanceInfo}>
                  <Text style={styles.performanceTitle}>{performance.songTitle}</Text>
                  <Text style={styles.performanceArtist}>{performance.artistName}</Text>
                  <Text style={styles.performanceDate}>
                    {new Date(performance.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.performanceScore}>
                  <MaterialIcons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.scoreText}>{performance.score}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <MaterialIcons name="notifications" size={24} color="#9CA3AF" />
              <Text style={styles.settingText}>Notifications</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <MaterialIcons name="privacy-tip" size={24} color="#9CA3AF" />
              <Text style={styles.settingText}>Privacy</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <MaterialIcons name="help" size={24} color="#9CA3AF" />
              <Text style={styles.settingText}>Help & Support</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <MaterialIcons name="info" size={24} color="#9CA3AF" />
              <Text style={styles.settingText}>About</Text>
              <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <MaterialIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  signInPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signInText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 20,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileGradient: {
    padding: 25,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  profilePhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  profileInfo: {
    flex: 1,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
  },
  joinDate: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActions: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#1F2937',
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 15,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  performancesList: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    overflow: 'hidden',
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  performanceThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  performanceArtist: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  performanceDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  performanceScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginLeft: 4,
  },
  settingsList: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 15,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 15,
    backgroundColor: '#1F2937',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 10,
  },
});