


import { Audio } from 'expo-av';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RewardRoyaltyActions from '../../components/RewardRoyaltyActions';
import { getCurrentUserId } from '../../hooks/useUserId';
import { BASE_URL } from '../config';
import LivePitchScoringScreen from './live-pitch-scoring';

console.warn = (message) => { if (message.includes('expo-av')) return; }; // Temporary suppress

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  text: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 16,
    textAlign: 'center',
  },
  songList: {
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  song: {
    fontSize: 16,
    color: '#FFFFFF',
    padding: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    width: 220,
    textAlign: 'center',
  },
  selectedSong: {
    fontSize: 16,
    color: '#10B981',
    padding: 8,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#374151',
    width: 220,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  singBox: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: '#232946',
    borderRadius: 12,
    padding: 16,
    width: 260,
  },
  selectedSongTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#10B981',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    backgroundColor: '#10B981',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
});


const SingScreen: React.FC = () => {
  const [selectedSong, setSelectedSong] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = React.useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = React.useState('');
  const [rewardInfo, setRewardInfo] = React.useState<any>(null);
  const [playing, setPlaying] = React.useState(false);
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const [streak, setStreak] = useState<number>(1); // Replace with real streak logic if available

  const songs = [
    'Bohemian Rhapsody',
    'Shape of You',
    'Let It Go',
    'Uptown Funk',
    'Shallow',
  ];

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      alert('Failed to start recording: ' + err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecordedUri(uri || null);
  };

  const playRecording = async () => {
    if (!recordedUri) return;
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setPlaying(false);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
    setSound(newSound);
    setPlaying(true);
    newSound.setOnPlaybackStatusUpdate(status => {
      if ('isPlaying' in status && !status.isPlaying) {
        setPlaying(false);
        setSound(null);
      }
    });
    await newSound.playAsync();
  };

  const uploadRecording = async () => {
    if (!recordedUri || !selectedSong) return;
    setUploadStatus('Uploading...');
    setRewardInfo(null);
    const formData = new FormData();
    const userId = getCurrentUserId();
    if (!userId) {
      setUploadStatus('User not logged in.');
      Alert.alert('Error', 'You must be logged in to claim rewards.');
      return;
    }
    formData.append('userId', userId);
    formData.append('songId', selectedSong);
    formData.append('audioFile', {
      uri: recordedUri,
      name: 'performance.wav',
      type: 'audio/wav',
    } as any);

    try {
      // 1. Upload performance
      const response = await fetch(`${BASE_URL}/api/songs/upload`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = await response.json();
      if (!response.ok) {
        setUploadStatus(data.error || 'Upload failed');
        return;
      }
      setUploadStatus('Upload successful! Scoring...');
      // 2. Get AI pitch score
      const scoreRes = await fetch(`${BASE_URL}/api/ai/pitch-score`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const scoreData = await scoreRes.json();
      if (!scoreRes.ok) {
        setUploadStatus(scoreData.error || 'Scoring failed');
        return;
      }
      setUploadStatus('Scored! Claiming reward...');
      setLastScore(scoreData.score);
      // 3. Claim reward
      const rewardRes = await fetch(`${BASE_URL}/api/rewards/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          score: scoreData.score,
          streak,
          context: {}
        }),
      });
      const reward = await rewardRes.json();
      setRewardInfo(reward);
      setUploadStatus('Reward claimed!');
      Alert.alert(
        'Reward Claimed',
        `You earned ${reward.reward} ${reward.currency}!\nTier: ${reward.tier}\nBonuses: ${JSON.stringify(reward.bonuses)}\nNFT: ${reward.nftReward || 'None'}`
      );
    } catch (err) {
      setUploadStatus('Network error');
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start Singing</Text>
      <Text style={styles.text}>Select a song to begin your karaoke session:</Text>
      <View style={styles.songList}>
        {songs.map(song => (
          <Text
            key={song}
            style={selectedSong === song ? styles.selectedSong : styles.song}
            onPress={() => setSelectedSong(song)}
          >
            {song}
          </Text>
        ))}
      </View>
      {selectedSong && (
        <View style={styles.singBox}>
          <Text style={styles.selectedSongTitle}>🎤 {selectedSong}</Text>
          <Text style={styles.instructions}>Record your performance below!</Text>
          <View style={{ marginVertical: 8 }}>
            <Button title={recording ? 'Stop Recording' : 'Start Recording'} onPress={recording ? stopRecording : startRecording} />
          </View>
          {recordedUri && (
            <>
              <Button title={playing ? 'Stop Playback' : 'Play Recording'} onPress={playRecording} />
              <Button title="Upload Recording" onPress={uploadRecording} />
            </>
          )}
          {uploadStatus ? <Text style={{ color: uploadStatus.includes('success') ? 'green' : 'red', marginTop: 8 }}>{uploadStatus}</Text> : null}
          {rewardInfo && (
            <View style={{ marginTop: 12, backgroundColor: '#232946', borderRadius: 8, padding: 10 }}>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>+{rewardInfo.reward} {rewardInfo.currency}</Text>
              <Text style={{ color: '#fff' }}>Tier: {rewardInfo.tier} ({rewardInfo.tierDescription})</Text>
              {rewardInfo.nftReward && <Text style={{ color: '#FFD700' }}>NFT: {rewardInfo.nftReward}</Text>}
              {rewardInfo.streakBonus ? <Text style={{ color: '#38BDF8' }}>Streak Bonus: {rewardInfo.streakBonus}</Text> : null}
              {rewardInfo.bonuses && Object.keys(rewardInfo.bonuses).length > 0 && (
                <Text style={{ color: '#FBBF24' }}>Bonuses: {Object.entries(rewardInfo.bonuses).map(([k,v]) => `${k}: ${v}`).join(', ')}</Text>
              )}
            </View>
          )}
        </View>
      )}
      {/* Live AI Coach and Pitch Scoring */}
      <View style={{ marginTop: 32, width: '100%' }}>
        <LivePitchScoringScreen />
      </View>
      {/* TODO: Integrate wallet reward logic here, e.g. show earned tokens for high scores */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>$</Text>
      </TouchableOpacity>
      <RewardRoyaltyActions visible={modalVisible} onClose={() => setModalVisible(false)} score={lastScore ?? undefined} streak={streak} />
    </View>
  );
}

export default SingScreen;

