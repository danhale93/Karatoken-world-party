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

export default function ZegoDuetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [isReady, setIsReady] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [duetProgress, setDuetProgress] = useState(0);
  const [currentPart, setCurrentPart] = useState<'part1' | 'part2' | 'harmony'>('part1');

  const duetId = params.duetId as string;
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
    if (!duetId) {
      showAlert('Error', 'No duet ID provided');
      router.back();
      return;
    }

    if (!user) {
      showAlert('Error', 'Please log in to join duets');
      router.push('/(tabs)');
      return;
    }
  }, [duetId, user]);

  const handleLeaveDuet = () => {
    showAlert(
      'Leave Duet',
      'Are you sure you want to leave this duet session?',
      () => {
        router.back();
      }
    );
  };

  const handleDuetError = (error: string) => {
    console.error('Duet error:', error);
    showAlert('Duet Error', error);
  };

  const handlePartSwitch = (part: 'part1' | 'part2' | 'harmony') => {
    setCurrentPart(part);
    showAlert('Part Changed', `Switched to ${part === 'part1' ? 'Lead Vocals' : part === 'part2' ? 'Backing Vocals' : 'Harmony'}`);
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
            colors={['#EC4899', '#F97316']}
            style={styles.instructionsGradient}
          >
            <MaterialIcons name="music-note" size={40} color="#FFFFFF" />
            <Text style={styles.instructionsTitle}>Duet Instructions</Text>
            
            <View style={styles.instructionsList}>
              <View style={styles.instructionItem}>
                <MaterialIcons name="people" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Wait for your duet partner to join
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <MaterialIcons name="swap-horiz" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Switch between lead, backing, and harmony parts
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <MaterialIcons name="headset" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Use headphones for best audio experience
                </Text>
              </View>
              
              <View style={styles.instructionItem}>
                <MaterialIcons name="favorite" size={20} color="#FFFFFF" />
                <Text style={styles.instructionText}>
                  Sing together and create beautiful harmony!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.gotItButton}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.gotItButtonText}>Let's Duet!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  const renderDuetControls = () => (
    <View style={styles.duetControls}>
      <LinearGradient
        colors={['rgba(17, 24, 39, 0.9)', 'rgba(31, 41, 55, 0.9)']}
        style={styles.controlsGradient}
      >
        <Text style={styles.controlsTitle}>Vocal Parts</Text>
        
        <View style={styles.partButtons}>
          <TouchableOpacity
            style={[
              styles.partButton,
              currentPart === 'part1' && styles.activePartButton,
            ]}
            onPress={() => handlePartSwitch('part1')}
          >
            <MaterialIcons 
              name="mic" 
              size={20} 
              color={currentPart === 'part1' ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.partButtonText,
              currentPart === 'part1' && styles.activePartButtonText,
            ]}>
              Lead
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.partButton,
              currentPart === 'part2' && styles.activePartButton,
            ]}
            onPress={() => handlePartSwitch('part2')}
          >
            <MaterialIcons 
              name="queue-music" 
              size={20} 
              color={currentPart === 'part2' ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.partButtonText,
              currentPart === 'part2' && styles.activePartButtonText,
            ]}>
              Backing
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.partButton,
              currentPart === 'harmony' && styles.activePartButton,
            ]}
            onPress={() => handlePartSwitch('harmony')}
          >
            <MaterialIcons 
              name="multitrack-audio" 
              size={20} 
              color={currentPart === 'harmony' ? '#FFFFFF' : '#9CA3AF'} 
            />
            <Text style={[
              styles.partButtonText,
              currentPart === 'harmony' && styles.activePartButtonText,
            ]}>
              Harmony
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.duetProgress}>
          <Text style={styles.progressLabel}>Duet Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${duetProgress}%` }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (!duetId || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={64} color="#EF4444" />
          <Text style={styles.errorText}>Unable to join duet</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Duet Controls Overlay */}
      {renderDuetControls()}

      {/* ZegoCloud Live Room */}
      <ZegoLiveRoom
        roomID={`duet_${duetId}`}
        roomType="duet"
        songId={songId}
        songTitle={songTitle}
        onLeave={handleLeaveDuet}
        onError={handleDuetError}
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
    backgroundColor: '#EC4899',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  duetControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 60,
  },
  controlsGradient: {
    padding: 16,
  },
  controlsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  partButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  partButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activePartButton: {
    backgroundColor: '#EC4899',
  },
  partButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  activePartButtonText: {
    color: '#FFFFFF',
  },
  duetProgress: {
    alignItems: 'center',
  },
  progressLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC4899',
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
    color: '#EC4899',
    fontSize: 16,
    fontWeight: '600',
  },
});