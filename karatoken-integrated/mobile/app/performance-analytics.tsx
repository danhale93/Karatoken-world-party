import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { usePerformanceStore } from '../hooks/usePerformanceStore';

const { width } = Dimensions.get('window');

interface PerformanceStats {
  totalPerformances: number;
  averageScore: number;
  bestScore: number;
  totalDuration: number;
  favoriteGenre: string;
  improvementRate: number;
  consistencyScore: number;
  pitchAccuracy: number;
  rhythmAccuracy: number;
  breathControl: number;
}

interface WeeklyProgress {
  week: string;
  averageScore: number;
  performances: number;
  improvement: number;
}

interface GenreBreakdown {
  genre: string;
  performances: number;
  averageScore: number;
  color: string;
}

export default function PerformanceAnalyticsScreen() {
  const { user } = useAuthStore();
  const { getPerformanceStats, getWeeklyProgress, getGenreBreakdown } = usePerformanceStore();
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([]);
  const [genreBreakdown, setGenreBreakdown] = useState<GenreBreakdown[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [statsData, progressData, genreData] = await Promise.all([
        getPerformanceStats(user?.id || '', selectedPeriod),
        getWeeklyProgress(user?.id || '', selectedPeriod),
        getGenreBreakdown(user?.id || '', selectedPeriod)
      ]);
      
      setStats(statsData);
      setWeeklyProgress(progressData);
      setGenreBreakdown(genreData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    if (score >= 70) return '#EF4444';
    return '#6B7280';
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return { icon: 'trending-up', color: '#10B981' };
    if (improvement < 0) return { icon: 'trending-down', color: '#EF4444' };
    return { icon: 'trending-flat', color: '#6B7280' };
  };

  const renderStatCard = (title: string, value: string | number, subtitle?: string, icon?: string, color?: string) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={color ? [color, color + '80'] : ['#374151', '#1F2937']}
        style={styles.statGradient}
      >
        {icon && (
          <MaterialIcons name={icon as any} size={24} color="#FFFFFF" style={styles.statIcon} />
        )}
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );

  const renderProgressBar = (label: string, value: number, maxValue: number, color: string) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(value / maxValue) * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  const renderWeeklyChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Weekly Progress</Text>
      <View style={styles.chartBars}>
        {weeklyProgress.map((week, index) => (
          <View key={week.week} style={styles.chartBar}>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${(week.averageScore / 100) * 120}px`,
                    backgroundColor: getScoreColor(week.averageScore)
                  }
                ]} 
              />
            </View>
            <Text style={styles.barLabel}>{week.week}</Text>
            <Text style={styles.barValue}>{week.averageScore}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderGenreBreakdown = () => (
    <View style={styles.genreContainer}>
      <Text style={styles.sectionTitle}>Genre Performance</Text>
      {genreBreakdown.map((genre) => (
        <View key={genre.genre} style={styles.genreItem}>
          <View style={styles.genreInfo}>
            <View style={[styles.genreColor, { backgroundColor: genre.color }]} />
            <Text style={styles.genreName}>{genre.genre}</Text>
          </View>
          <View style={styles.genreStats}>
            <Text style={styles.genreScore}>{genre.averageScore}%</Text>
            <Text style={styles.genreCount}>({genre.performances})</Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="analytics" size={64} color="#6B7280" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Performance Analytics</Text>
          <TouchableOpacity style={styles.shareButton}>
            <MaterialIcons name="share" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(['week', 'month', 'year'] as const).map((period) => (
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
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Stats */}
        <View style={styles.statsGrid}>
          {stats && (
            <>
              {renderStatCard(
                'Total Performances',
                stats.totalPerformances,
                'songs performed',
                'mic',
                '#8B5CF6'
              )}
              {renderStatCard(
                'Average Score',
                `${stats.averageScore}%`,
                'overall accuracy',
                'star',
                getScoreColor(stats.averageScore)
              )}
              {renderStatCard(
                'Best Score',
                `${stats.bestScore}%`,
                'personal record',
                'emoji-events',
                '#F59E0B'
              )}
              {renderStatCard(
                'Improvement',
                `${stats.improvementRate > 0 ? '+' : ''}${stats.improvementRate}%`,
                'this period',
                getImprovementIcon(stats.improvementRate).icon,
                getImprovementIcon(stats.improvementRate).color
              )}
            </>
          )}
        </View>

        {/* Performance Metrics */}
        {stats && (
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Performance Metrics</Text>
            {renderProgressBar('Pitch Accuracy', stats.pitchAccuracy, 100, '#10B981')}
            {renderProgressBar('Rhythm Accuracy', stats.rhythmAccuracy, 100, '#3B82F6')}
            {renderProgressBar('Breath Control', stats.breathControl, 100, '#8B5CF6')}
            {renderProgressBar('Consistency', stats.consistencyScore, 100, '#F59E0B')}
          </View>
        )}

        {/* Weekly Progress Chart */}
        {weeklyProgress.length > 0 && renderWeeklyChart()}

        {/* Genre Breakdown */}
        {genreBreakdown.length > 0 && renderGenreBreakdown()}

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          <View style={styles.insightCard}>
            <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Keep it up!</Text>
              <Text style={styles.insightText}>
                Your {stats?.favoriteGenre} performances are consistently strong. 
                Try exploring {stats?.favoriteGenre === 'Pop' ? 'Rock' : 'Pop'} to diversify your skills.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    color: '#9CA3AF',
    fontSize: 18,
    marginTop: 16,
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
  shareButton: {
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
    backgroundColor: '#374151',
  },
  periodButtonText: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    marginHorizontal: 5,
  },
  statGradient: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
  },
  metricsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  progressValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    minHeight: 4,
  },
  barLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  barValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  genreContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  genreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  genreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  genreName: {
    color: '#D1D5DB',
    fontSize: 16,
  },
  genreStats: {
    alignItems: 'flex-end',
  },
  genreScore: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  genreCount: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  insightsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightText: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
}); 