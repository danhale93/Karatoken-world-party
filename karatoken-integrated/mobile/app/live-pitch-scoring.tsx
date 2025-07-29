import { Audio } from 'expo-av';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

export default function LivePitchScoringScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startLiveScoring = async () => {
    setError('');
    setScore(null);
    setLoading(true);
    try {
      // Open WebSocket connection to backend
      wsRef.current = new WebSocket('ws://localhost:3000/api/ai/score-stream');
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.score !== undefined) setScore(data.score);
        } catch (e) {}
      };
      wsRef.current.onerror = () => setError('WebSocket error');
      wsRef.current.onclose = () => setIsRecording(false);

      // Request audio permissions
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: 1, // DEFAULT
          audioEncoder: 1, // DEFAULT
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: 2, // HIGH
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
      });
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setLoading(false);
      // Read audio data in chunks and send to backend
      const interval = setInterval(async () => {
        if (!isRecording || !recordingRef.current || !wsRef.current) return;
        try {
          const status = await recordingRef.current.getStatusAsync();
          if (status.isRecording && status.durationMillis > 0) {
            const uri = recordingRef.current.getURI();
            if (uri) {
              // Fetch the latest audio chunk and send as binary
              const response = await fetch(uri);
              const blob = await response.blob();
              wsRef.current.send(blob);
            }
          }
        } catch (e) {}
      }, 1000); // Send every second
      wsRef.current.onclose = () => {
        clearInterval(interval);
        setIsRecording(false);
      };
    } catch (e) {
      setError('Failed to start live scoring');
      setLoading(false);
    }
  };

  const stopLiveScoring = async () => {
    setIsRecording(false);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live AI Pitch Scoring</Text>
      <Button
        title={isRecording ? 'Stop Live Scoring' : 'Start Live Scoring'}
        onPress={isRecording ? stopLiveScoring : startLiveScoring}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {score !== null && (
        <Text style={styles.score}>Live Pitch Score: {score}</Text>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  score: {
    color: '#10B981',
    fontSize: 22,
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginTop: 16,
  },
});
