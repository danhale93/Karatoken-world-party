import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ZegoLiveRoom } from '../components/ZegoLiveRoom';
import { useAuthStore } from '../hooks/useAuthStore';
import { useBattleStore } from '../hooks/useBattleStore';

export default function ZegoBattleScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { currentBattle } = useBattleStore();
  
  const [isJoining, setIsJoining] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [battleScore, setBattleScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  const battleId = params.battleId as string;
  const songId = params.songId as string;
  const songTitle = params.songTitle as string;

  // Show cross-platform alert
  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  useEffect(() => {
    if (!battleId) {
      showAlert('Error', 'No battle ID provided');
      router.back();
      return;
    }

    if (!user) {
      showAlert('Error', 'Please log in to join battles');
      router.push('/(tabs)');
      return;
    }
  }, [battleId, user]);

  const handleLeaveBattle = () => {
    showAlert(
      'Leave Battle',
      'Are you sure you want to leave this battle?',
      () => {
        router.back();
      }
    );
  };

  const handleBattleError = (error: string) => {
    console.error('Battle error:', error);
    showAlert('Battle Error', error);
  };

  const renderInstructionsModal = () => (
    <Modal
      visible={showInstructions}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.instructionsModal}>
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6']}
            style={styles.instructionsGradient}
          >
            <MaterialIcons name="info" size={40} color="#FFFFFF" />
            <Text style={styles.instructionsTitle}>Battle Instructions</Text>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <MaterialIcons name="mic" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Tap "Start Singing" when ready to perform
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <MaterialIcons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Other participants will hear your performance
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <MaterialIcons name="timer" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Sing the entire song for best results
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <MaterialIcons name="stars" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Your performance will be scored in real-time
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.gotItButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.gotItButtonText}>Got it!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const renderBattleHUD = () => (
    <View style={styles.battleHUD}>
      <LinearGradient
        colors={['rgba(17, 24, 39, 0.9)', 'rgba(31, 41, 55, 0.9)']}
        style={styles.hudGradient}
      >
        <View style={styles.scoreSection}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{battleScore}</Text>
          </View>
          
          <MaterialIcons name="flash-on" size={32} color="#F59E0B" />
          
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Opponent</Text>
            <Text style={styles.scoreValue}>{opponentScore}</Text>
          </View>
        </View>

        <View style={styles.battleProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${Math.min((battleScore / 100) * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Battle Progress</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (!battleId || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Unable to join battle</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Battle HUD Overlay */}
      {renderBattleHUD()}

      {/* ZegoCloud Live Room */}
      <ZegoLiveRoom
        roomID={`battle_${battleId}`}
        roomType="battle"
        songId={songId}
        songTitle={songTitle}
        onLeave={handleLeaveBattle}
        onError={handleBattleError}
      />

      {/* Instructions Modal */}
      {renderInstructionsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
  },
  backButton: {
    backgroundColor: '#6B46C1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  battleHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 60,
  },
  hudGradient: {
    padding: 16,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  battleProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionsModal: {
    borderRadius: 20,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
  },
  instructionsGradient: {
    padding: 30,
    alignItems: 'center',
  },
  instructionsTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionsList: {
    width: '100%',
    marginBottom: 24,
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
  gotItButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  gotItButtonText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: '600',
  },
});