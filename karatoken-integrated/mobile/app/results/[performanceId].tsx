// Powered by OnSpace.AI
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useKaraokeStore } from '../../hooks/useKaraokeStore';
import { useWalletStore } from '../../hooks/useWalletStore';

const { width } = Dimensions.get('window');

export default function ResultsScreen() {
  const { performanceId } = useLocalSearchParams();
  const { getAIFeedback } = useKaraokeStore();
  const { balance } = useWalletStore();
  const [aiScore, setAiScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const feedback = await getAIFeedback(performanceId as string);
      setAiScore(feedback);
      
      // Calculate earnings based on score
      const baseEarning = 10;
      const scoreMultiplier = feedback.overallScore / 100;
      const totalEarnings = Math.floor(baseEarning * scoreMultiplier * 10);
      setEarnings(totalEarnings);
    } catch (error) {
      console.error('Error loading results:', error);
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

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'S';
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    return 'D';
  };

  const handleTryAgain = () => {
    router.push('/(tabs)/song-selection');
  };

  const handleShare = () => {
    Alert.alert('Share Performance', 'Share your amazing performance with friends!');
  };

  const handleViewLeaderboard = () => {
    router.push('/(tabs)/leaderboard');
  };

  if (loading || !aiScore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <MaterialIcons name="analytics" size={60} color="#6B46C1" />
          <Text style={styles.loadingText}>Analyzing your performance...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.push('/(tabs)')}
          >
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Performance Results</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <MaterialIcons name="share" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Overall Score */}
        <View style={styles.scoreSection}>
          <LinearGradient
            colors={[getScoreColor(aiScore.overallScore), `${getScoreColor(aiScore.overallScore)}80`]}
            style={styles.scoreGradient}
          >
            <Text style={styles.scoreLabel}>Overall Score</Text>
            <Text style={styles.scoreValue}>{aiScore.overallScore}%</Text>
            <Text style={styles.scoreGrade}>{getScoreGrade(aiScore.overallScore)}</Text>
          </LinearGradient>
        </View>

        {/* Earnings */}
        <View style={styles.earningsSection}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.earningsGradient}
          >
            <MaterialIcons name="monetization-on" size={40} color="#FFFFFF" />
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>Tokens Earned</Text>
              <Text style={styles.earningsValue}>+{earnings} KRT</Text>
              <Text style={styles.earningsDescription}>
                Added to your wallet balance
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Detailed Scores */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Performance Breakdown</Text>
          
          <View style={styles.scoreBreakdown}>
            {[
              { label: 'Pitch Accuracy', score: aiScore.pitchAccuracy, icon: 'tune' },
              { label: 'Timing', score: aiScore.timing, icon: 'schedule' },
              { label: 'Rhythm', score: aiScore.rhythm, icon: 'graphic-eq' },
              { label: 'Expression', score: aiScore.expression, icon: 'sentiment-satisfied' },
            ].map((item, index) => (
              <View key={index} style={styles.scoreItem}>
                <View style={styles.scoreItemHeader}>
                  <MaterialIcons name={item.icon as any} size={20} color="#10B981" />
                  <Text style={styles.scoreItemLabel}>{item.label}</Text>
                  <Text style={styles.scoreItemValue}>{item.score}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${item.score}%`,
                        backgroundColor: getScoreColor(item.score),
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* AI Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>AI Coach Feedback</Text>
          
          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <MaterialIcons name="psychology" size={24} color="#10B981" />
              <Text style={styles.feedbackTitle}>What You Did Well</Text>
            </View>
            {aiScore.feedback.map((item, index) => (
              <View key={index} style={styles.feedbackItem}>
                <MaterialIcons name="check-circle" size={16} color="#10B981" />
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <MaterialIcons name="lightbulb" size={24} color="#F59E0B" />
              <Text style={styles.feedbackTitle}>Areas for Improvement</Text>
            </View>
            {aiScore.improvements.map((item, index) => (
              <View key={index} style={styles.feedbackItem}>
                <MaterialIcons name="trending-up" size={16} color="#F59E0B" />
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleTryAgain}
          >
            <LinearGradient
              colors={['#6B46C1', '#8B5CF6']}
              style={styles.buttonGradient}
            >
              <MaterialIcons name="replay" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Try Another Song</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/(tabs)/battle')}
            >
              <MaterialIcons name="flash-on" size={20} color="#10B981" />
              <Text style={styles.secondaryButtonText}>Join Battle</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleViewLeaderboard}
            >
              <MaterialIcons name="leaderboard" size={20} color="#F59E0B" />
              <Text style={styles.secondaryButtonText}>Leaderboard</Text>
            </TouchableOpacity>
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
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  scoreGradient: {
    padding: 40,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 10,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  scoreGrade: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  earningsSection: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  earningsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  earningsInfo: {
    flex: 1,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 5,
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  earningsDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  detailsSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  scoreBreakdown: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 20,
  },
  scoreItem: {
    marginBottom: 20,
  },
  scoreItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreItemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
  },
  scoreItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
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
  feedbackSection: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  feedbackCard: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 10,
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  primaryButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});