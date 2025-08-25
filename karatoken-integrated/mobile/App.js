import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { io } from 'socket.io-client';

// Initialize Socket.IO connection
const SOCKET_URL = 'http://YOUR_SERVER_IP:3000';
const socket = io(SOCKET_URL);

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const [emotion, setEmotion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const recording = useRef(null);
  const [sound, setSound] = useState();

  // Set up socket listeners
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('scoreUpdate', (data) => {
      setScore(data.score);
      setLyrics(data.lyrics);
      setEmotion(data.emotion);
      setIsLoading(false);
    });

    return () => {
      socket.off('connect');
      socket.off('scoreUpdate');
    };
  }, []);

  async function startRecording() {
    try {
      console.log('Requesting permissions..');
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setIsRecording(false);
    setIsLoading(true);
    
    try {
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      
      // Send audio to server for analysis
      await analyzeAudio(uri);
    } catch (error) {
      console.error('Error stopping recording', error);
      setIsLoading(false);
    }
  }

  async function analyzeAudio(uri) {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'audio/wav',
      name: 'recording.wav',
    });

    try {
      const response = await fetch('http://YOUR_SERVER_IP:8000/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const result = await response.json();
      
      // Update UI with results
      setScore(result.score);
      setLyrics(result.lyrics);
      setEmotion(result.emotion);
      
      // Emit to WebSocket for real-time updates
      socket.emit('performanceUpdate', result);
      
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function mintNFT() {
    try {
      // In a real app, you would connect to a wallet and sign the transaction
      console.log('Minting NFT with score:', score);
      // TODO: Implement blockchain interaction
      alert('NFT minting functionality will be implemented here');
    } catch (error) {
      console.error('Minting error:', error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Karatoken World Party</Text>
      
      <View style={styles.recordingContainer}>
        {isRecording ? (
          <Button title="Stop Recording" onPress={stopRecording} />
        ) : (
          <Button title="Start Recording" onPress={startRecording} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <View style={styles.resultsContainer}>
          {score !== null && (
            <>
              <Text style={styles.scoreText}>Score: {Math.round(score)}/100</Text>
              <Text style={styles.emotionText}>Emotion: {emotion}</Text>
              <View style={styles.lyricsContainer}>
                <Text style={styles.lyricsTitle}>Lyrics:</Text>
                <Text style={styles.lyricsText}>{lyrics || 'No lyrics detected'}</Text>
              </View>
              <Button title="Mint as NFT" onPress={mintNFT} />
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  recordingContainer: {
    marginBottom: 30,
    width: '100%',
  },
  resultsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emotionText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  lyricsContainer: {
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  lyricsTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  lyricsText: {
    fontStyle: 'italic',
  },
});

export default App;
