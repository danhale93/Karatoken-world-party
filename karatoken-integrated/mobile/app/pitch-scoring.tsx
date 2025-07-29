
import { BASE_URL } from './config';
// @ts-ignore
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

export default function PitchScoringScreen() {
  type AudioAsset = {
    uri: string;
    name?: string;
    mimeType?: string;
  };
  const [audioFile, setAudioFile] = useState<AudioAsset | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickAudio = async () => {
    setError('');
    setScore(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudioFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
        });
      }
    } catch (err) {
      setError('Failed to pick audio file.');
    }
  };

  const uploadForScoring = async () => {
    if (!audioFile) return;
    setLoading(true);
    setError('');
    setScore(null);
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioFile.uri,
        name: audioFile.name || 'audio.wav',
        type: audioFile.mimeType || 'audio/wav',
      } as any);
      const response = await fetch(`${BASE_URL}/api/ai/score`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setScore(data.score);
      } else {
        setError(data.error || 'Scoring failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Pitch Scoring</Text>
      <Button title="Pick Audio File" onPress={pickAudio} />
      {audioFile && (
        <Text style={styles.fileName}>Selected: {audioFile.name}</Text>
      )}
      <Button
        title="Upload & Get Score"
        onPress={uploadForScoring}
        disabled={!audioFile || loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {score !== null && (
        <Text style={styles.score}>Pitch Score: {score}</Text>
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
  fileName: {
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 12,
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
