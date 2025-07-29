import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { aiScoringCoachService } from '../services/aiScoringCoachService';

const { width } = Dimensions.get('window');

interface PerformanceScore {
  overall: number;
  pitch: number;
  timing: number;
  rhythm: number;
  expression: number;
  confidence: number;
}

interface PitchAnalysis {
  timestamp: number;
  frequency: number;
  note: string;
  octave: number;
  confidence: number;
  isCorrect: boolean;
  expectedNote?: string;
}

interface FeedbackItem {
  type: 'pitch' | 'timing' | 'rhythm' | 'expression' | 'general';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp?: number;
  suggestion?: string;
}

interface PracticeRecommendation {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  focusAreas: string[];
}

export default function AIScoringCoachScreen() {
  const { user } = useAuthStore();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [performanceScore, setPerformanceScore] = useState<PerformanceScore | null>(null);
  const [pitchAnalysis, setPitchAnalysis] = useState<PitchAnalysis[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'analysis' | 'feedback' | 'recommendations'>('analysis');
  const playbackInterval = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setSelectedFile(file.uri);
        setFileName(file.name);
        await loadAudio(file.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const loadAudio = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load audio file');
    }
  };

  const playAudio = async () => {
    if (!sound) return;
    
    try {
      await sound.playAsync();
      setIsPlaying(true);
      
      playbackInterval.current = setInterval(async () => {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setCurrentTime(status.positionMillis || 0);
        }
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const pauseAudio = async () => {
    if (!sound) return;
    
    try {
      await sound.pauseAsync();
      setIsPlaying(false);
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pause audio');
    }
  };

  const analyzePerformance = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Use the AI Scoring Coach service
      const analysis = await aiScoringCoachService.analyzePerformance(
        selectedFile,
        user?.id || 'anonymous',
        fileName
      );

      setPitchAnalysis(analysis.pitchData);
      setPerformanceScore(analysis.score);
      setFeedback(analysis.feedback);
      setRecommendations(analysis.recommendations);

      Alert.alert('Success', 'Performance analysis completed!');
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze performance');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const performDetailedAnalysis = async (pitchData: any[], separation: any) => {
    // Calculate pitch accuracy
    const pitchAccuracy = pitchData.filter(p => p.confidence > 0.7).length / pitchData.length;
    
    // Calculate timing accuracy (mock implementation)
    const timingAccuracy = 0.85;
    
    // Calculate rhythm consistency
    const rhythmScore = 0.78;
    
    // Calculate expression (based on vocal dynamics)
    const expressionScore = 0.82;
    
    // Calculate confidence (based on consistent performance)
    const confidenceScore = 0.79;

    const overallScore = Math.round(
      (pitchAccuracy * 0.3 + timingAccuracy * 0.25 + rhythmScore * 0.2 + expressionScore * 0.15 + confidenceScore * 0.1) * 100
    );

    return {
      score: {
        overall: overallScore,
        pitch: Math.round(pitchAccuracy * 100),
        timing: Math.round(timingAccuracy * 100),
        rhythm: Math.round(rhythmScore * 100),
        expression: Math.round(expressionScore * 100),
        confidence: Math.round(confidenceScore * 100),
      },
      pitchData,
      separation,
    };
  };

  const generateFeedback = (analysis: any): FeedbackItem[] => {
    const feedback: FeedbackItem[] = [];
    const { score } = analysis;

    // Pitch feedback
    if (score.pitch < 80) {
      feedback.push({
        type: 'pitch',
        message: 'Work on pitch accuracy - some notes were slightly off',
        severity: score.pitch < 60 ? 'high' : 'medium',
        suggestion: 'Practice with a tuner or pitch training app',
      });
    } else {
      feedback.push({
        type: 'pitch',
        message: 'Excellent pitch accuracy!',
        severity: 'low',
        suggestion: 'Keep up the great work',
      });
    }

    // Timing feedback
    if (score.timing < 85) {
      feedback.push({
        type: 'timing',
        message: 'Timing could be more precise',
        severity: score.timing < 70 ? 'high' : 'medium',
        suggestion: 'Practice with a metronome',
      });
    }

    // Rhythm feedback
    if (score.rhythm < 80) {
      feedback.push({
        type: 'rhythm',
        message: 'Rhythm consistency needs improvement',
        severity: score.rhythm < 65 ? 'high' : 'medium',
        suggestion: 'Focus on maintaining steady rhythm throughout',
      });
    }

    // Expression feedback
    if (score.expression < 85) {
      feedback.push({
        type: 'expression',
        message: 'Add more emotional expression to your performance',
        severity: 'medium',
        suggestion: 'Practice conveying emotion through dynamics and phrasing',
      });
    }

    return feedback;
  };

  const generateRecommendations = (analysis: any): PracticeRecommendation[] => {
    const { score } = analysis;
    const recommendations: PracticeRecommendation[] = [];

    if (score.pitch < 80) {
      recommendations.push({
        title: 'Pitch Training',
        description: 'Improve your pitch accuracy with targeted exercises',
        difficulty: score.pitch < 60 ? 'beginner' : 'intermediate',
        estimatedTime: 15,
        focusAreas: ['Pitch accuracy', 'Note recognition', 'Interval training'],
      });
    }

    if (score.timing < 85) {
      recommendations.push({
        title: 'Rhythm Practice',
        description: 'Enhance your timing and rhythm skills',
        difficulty: 'intermediate',
        estimatedTime: 20,
        focusAreas: ['Metronome practice', 'Rhythm patterns', 'Syncopation'],
      });
    }

    recommendations.push({
      title: 'Vocal Warm-up Routine',
      description: 'Daily vocal exercises to improve overall performance',
      difficulty: 'beginner',
      estimatedTime: 10,
      focusAreas: ['Breathing', 'Vocal range', 'Articulation'],
    });

    return recommendations;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#F59E0B';
    if (score >= 70) return '#F97316';
    return '#EF4444';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const renderScoreCard = (title: string, score: number, icon: string) => (
    <View style={styles.scoreCard}>
      <MaterialIcons name={icon as any} size={24} color={getScoreColor(score)} />
      <Text style={styles.scoreCardTitle}>{title}</Text>
      <Text style={[styles.scoreCardValue, { color: getScoreColor(score) }]}>
        {score}%
      </Text>
    </View>
  );

  const renderFeedbackItem = (item: FeedbackItem, index: number) => (
    <View key={index} style={styles.feedbackItem}>
      <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(item.severity) }]} />
      <View style={styles.feedbackContent}>
        <Text style={styles.feedbackMessage}>{item.message}</Text>
        {item.suggestion && (
          <Text style={styles.feedbackSuggestion}>💡 {item.suggestion}</Text>
        )}
      </View>
    </View>
  );

  const renderRecommendation = (rec: PracticeRecommendation, index: number) => (
    <TouchableOpacity key={index} style={styles.recommendationCard}>
      <View style={styles.recommendationHeader}>
        <Text style={styles.recommendationTitle}>{rec.title}</Text>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(rec.difficulty) }]}>
          <Text style={styles.difficultyText}>{rec.difficulty}</Text>
        </View>
      </View>
      <Text style={styles.recommendationDescription}>{rec.description}</Text>
      <View style={styles.recommendationMeta}>
        <Text style={styles.recommendationTime}>⏱️ {rec.estimatedTime} min</Text>
        <Text style={styles.recommendationAreas}>
          🎯 {rec.focusAreas.join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10B981';
      case 'intermediate': return '#F59E0B';
      case 'advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Scoring Coach</Text>
          <Text style={styles.subtitle}>Get personalized feedback and improve your performance</Text>
        </View>

        {/* File Selection */}
        <View style={styles.fileSection}>
          <TouchableOpacity style={styles.filePicker} onPress={pickAudioFile}>
            <MaterialIcons name="audiotrack" size={32} color="#10B981" />
            <Text style={styles.filePickerText}>
              {fileName || 'Select Audio File'}
            </Text>
            <MaterialIcons name="file-upload" size={24} color="#6B7280" />
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.audioControls}>
              <TouchableOpacity 
                style={styles.playButton} 
                onPress={isPlaying ? pauseAudio : playAudio}
              >
                <MaterialIcons 
                  name={isPlaying ? 'pause' : 'play-arrow'} 
                  size={24} 
                  color="#FFFFFF" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.analyzeButton, isAnalyzing && styles.analyzeButtonDisabled]} 
                onPress={analyzePerformance}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <MaterialIcons name="psychology-alt" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.analyzeButtonText}>
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Performance'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {isAnalyzing && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${analysisProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{analysisProgress}% Complete</Text>
            </View>
          )}
        </View>

        {/* Results Tabs */}
        {performanceScore && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'analysis' && styles.activeTab]}
              onPress={() => setSelectedTab('analysis')}
            >
              <Text style={[styles.tabText, selectedTab === 'analysis' && styles.activeTabText]}>
                Analysis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'feedback' && styles.activeTab]}
              onPress={() => setSelectedTab('feedback')}
            >
              <Text style={[styles.tabText, selectedTab === 'feedback' && styles.activeTabText]}>
                Feedback
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'recommendations' && styles.activeTab]}
              onPress={() => setSelectedTab('recommendations')}
            >
              <Text style={[styles.tabText, selectedTab === 'recommendations' && styles.activeTabText]}>
                Practice
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analysis Tab */}
        {selectedTab === 'analysis' && performanceScore && (
          <View style={styles.analysisContainer}>
            {/* Overall Score */}
            <View style={styles.overallScoreCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.overallScoreGradient}
              >
                <Text style={styles.overallScoreLabel}>Overall Score</Text>
                <Text style={styles.overallScoreValue}>{performanceScore.overall}%</Text>
                <Text style={styles.overallScoreGrade}>
                  {performanceScore.overall >= 90 ? 'A+' : 
                   performanceScore.overall >= 80 ? 'A' : 
                   performanceScore.overall >= 70 ? 'B' : 
                   performanceScore.overall >= 60 ? 'C' : 'D'}
                </Text>
              </LinearGradient>
            </View>

            {/* Detailed Scores */}
            <View style={styles.scoresGrid}>
              {renderScoreCard('Pitch', performanceScore.pitch, 'trending-up')}
              {renderScoreCard('Timing', performanceScore.timing, 'schedule')}
              {renderScoreCard('Rhythm', performanceScore.rhythm, 'music-note')}
              {renderScoreCard('Expression', performanceScore.expression, 'favorite')}
              {renderScoreCard('Confidence', performanceScore.confidence, 'star')}
            </View>
          </View>
        )}

        {/* Feedback Tab */}
        {selectedTab === 'feedback' && feedback.length > 0 && (
          <View style={styles.feedbackContainer}>
            {feedback.map(renderFeedbackItem)}
          </View>
        )}

        {/* Recommendations Tab */}
        {selectedTab === 'recommendations' && recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            {recommendations.map(renderRecommendation)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    lineHeight: 24,
  },
  fileSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
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
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  analysisContainer: {
    paddingHorizontal: 24,
  },
  overallScoreCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overallScoreGradient: {
    padding: 24,
    alignItems: 'center',
  },
  overallScoreLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 8,
  },
  overallScoreValue: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  overallScoreGrade: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scoreCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scoreCardTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  scoreCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  feedbackContainer: {
    paddingHorizontal: 24,
  },
  feedbackItem: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  severityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  feedbackSuggestion: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  recommendationsContainer: {
    paddingHorizontal: 24,
  },
  recommendationCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 12,
  },
  recommendationMeta: {
    gap: 4,
  },
  recommendationTime: {
    color: '#6B7280',
    fontSize: 12,
  },
  recommendationAreas: {
    color: '#6B7280',
    fontSize: 12,
  },
});
