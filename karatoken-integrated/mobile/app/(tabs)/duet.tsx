import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DuetScreen() {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Show cross-platform alert
  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  const handleCreateDuet = () => {
    // For demo purposes, create a mock duet room
    const duetId = `duet_${Date.now()}`;
    const songId = 'demo_song';
    const songTitle = 'Perfect Duet Song';

    router.push({
      pathname: '/zego-duet',
      params: {
        duetId,
        songId,
        songTitle,
      },
    });
  };

  const handleJoinDuet = () => {
    showAlert('Join Duet', 'Feature coming soon! You will be able to join existing duet rooms.');
  };

  const handleBrowseDuets = () => {
    showAlert('Browse Duets', 'Feature coming soon! You will be able to browse available duet rooms.');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Duet Mode</Text>
        <Text style={styles.subtitle}>Sing together with friends in real-time</Text>
      </View>

      {/* Main Actions */}
      <View style={styles.mainActions}>
        {/* Create Duet */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleCreateDuet}
          disabled={isCreatingRoom}
        >
          <LinearGradient
            colors={['#EC4899', '#F97316']}
            style={styles.actionGradient}
          >
            <MaterialIcons name="add-circle" size={48} color="#FFFFFF" />
            <Text style={styles.actionTitle}>Create Duet Room</Text>
            <Text style={styles.actionDescription}>
              Start a new duet session and invite friends to join
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Join Duet */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleJoinDuet}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.actionGradient}
          >
            <MaterialIcons name="people" size={48} color="#FFFFFF" />
            <Text style={styles.actionTitle}>Join Duet Room</Text>
            <Text style={styles.actionDescription}>
              Join an existing duet session with a room code
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Browse Duets */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleBrowseDuets}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.actionGradient}
          >
            <MaterialIcons name="search" size={48} color="#FFFFFF" />
            <Text style={styles.actionTitle}>Browse Available Duets</Text>
            <Text style={styles.actionDescription}>
              Find open duet rooms to join and start singing
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Features Info */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Duet Features</Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <MaterialIcons name="headset" size={24} color="#10B981" />
            <Text style={styles.featureText}>Real-time audio streaming</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="swap-horiz" size={24} color="#10B981" />
            <Text style={styles.featureText}>Switch vocal parts dynamically</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="multitrack-audio" size={24} color="#10B981" />
            <Text style={styles.featureText}>Perfect harmony mixing</Text>
          </View>
          
          <View style={styles.featureItem}>
            <MaterialIcons name="star" size={24} color="#10B981" />
            <Text style={styles.featureText}>Collaborative scoring system</Text>
          </View>
        </View>
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  mainActions: {
    flex: 1,
    padding: 20,
    gap: 20,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    padding: 20,
    paddingBottom: 40,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#9CA3AF',
    flex: 1,
  },
});
