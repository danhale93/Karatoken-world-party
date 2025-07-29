import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BASE_URL } from './config';

const { width } = Dimensions.get('window');

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  status: 'available' | 'processing' | 'unavailable';
  processingTime?: number;
}

interface ProcessingResult {
  success: boolean;
  outputFile?: string;
  processingTime?: number;
  error?: string;
}

export default function AIStudioScreen() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFeature, setCurrentFeature] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: ProcessingResult }>({});
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const aiFeatures: AIFeature[] = [
    {
      id: 'vocal-removal',
      title: 'Vocal Removal',
      description: 'Remove vocals from any song using AI-powered separation',
      icon: 'music-note',
      color: '#FF6B6B',
      status: 'available'
    },
    {
      id: 'vocal-extraction',
      title: 'Vocal Extraction',
      description: 'Extract only vocals from songs for analysis',
      icon: 'mic',
      color: '#4ECDC4',
      status: 'available'
    },
    {
      id: 'lyrics-extraction',
      title: 'AI Lyrics Extraction',
      description: 'Automatically extract and synchronize lyrics',
      icon: 'text-fields',
      color: '#45B7D1',
      status: 'available'
    },
    {
      id: 'pitch-detection',
      title: 'Pitch Detection',
      description: 'Advanced pitch analysis with confidence scores',
      icon: 'trending-up',
      color: '#96CEB4',
      status: 'available'
    },
    {
      id: 'karaoke-generation',
      title: 'Karaoke Generation',
      description: 'Generate UltraStar Deluxe karaoke files',
      icon: 'karaoke',
      color: '#FFEAA7',
      status: 'available'
    },
    {
      id: 'lrcv2-format',
      title: 'LRCv2 Format',
      description: 'Enhanced lyrics with translations and chords',
      icon: 'translate',
      color: '#DDA0DD',
      status: 'available'
    }
  ];

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file.uri);
      setFileName(file.name);
      setResults({});
    } catch (error) {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const playAudio = async (fileUri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: fileUri });
      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  const processVocalRemoval = async (stemType: 'instrumental' | 'vocals') => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    setIsProcessing(true);
    setCurrentFeature(`vocal-${stemType}`);

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile,
        type: 'audio/mpeg',
        name: fileName,
      } as any);
      formData.append('stemType', stemType);
      formData.append('model', 'VR');
      formData.append('quality', 'high');
      formData.append('outputFormat', 'wav');

      const response = await fetch(`${BASE_URL}/api/ai/vocal-remover`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        [`vocal-${stemType}`]: result
      }));

      if (result.success) {
        Alert.alert(
          'Success', 
          `${stemType === 'instrumental' ? 'Instrumental' : 'Vocals'} created successfully!`
        );
      } else {
        Alert.alert('Error', result.error || 'Processing failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to process vocal removal');
    } finally {
      setIsProcessing(false);
      setCurrentFeature(null);
    }
  };

  const processLyricsExtraction = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    setIsProcessing(true);
    setCurrentFeature('lyrics-extraction');

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile,
        type: 'audio/mpeg',
        name: fileName,
      } as any);
      formData.append('language', 'en');
      formData.append('pitchDetection', 'ai');
      formData.append('lyricsExtraction', 'ai');
      formData.append('autoTapping', 'true');
      formData.append('addChords', 'true');

      const response = await fetch(`${BASE_URL}/api/ai/ultra-singer`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        'lyrics-extraction': result
      }));

      if (result.success) {
        Alert.alert('Success', 'Lyrics extracted successfully!');
      } else {
        Alert.alert('Error', result.error || 'Lyrics extraction failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to extract lyrics');
    } finally {
      setIsProcessing(false);
      setCurrentFeature(null);
    }
  };

  const processPitchDetection = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    setIsProcessing(true);
    setCurrentFeature('pitch-detection');

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile,
        type: 'audio/mpeg',
        name: fileName,
      } as any);
      formData.append('pitchDetection', 'ai');

      const response = await fetch(`${BASE_URL}/api/ai/ultra-singer/pitch`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        'pitch-detection': result
      }));

      if (result.success) {
        Alert.alert('Success', `Pitch detection completed! Found ${result.pitchData?.length || 0} pitch points.`);
      } else {
        Alert.alert('Error', result.error || 'Pitch detection failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to detect pitch');
    } finally {
      setIsProcessing(false);
      setCurrentFeature(null);
    }
  };

  const processKaraokeGeneration = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select an audio file first');
      return;
    }

    setIsProcessing(true);
    setCurrentFeature('karaoke-generation');

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: selectedFile,
        type: 'audio/mpeg',
        name: fileName,
      } as any);
      formData.append('outputFormat', 'ultrastar');
      formData.append('language', 'en');
      formData.append('pitchDetection', 'ai');
      formData.append('lyricsExtraction', 'ai');
      formData.append('autoTapping', 'true');
      formData.append('addChords', 'true');

      const response = await fetch(`${BASE_URL}/api/ai/ultra-singer`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();

      setResults(prev => ({
        ...prev,
        'karaoke-generation': result
      }));

      if (result.success) {
        Alert.alert('Success', 'Karaoke file generated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Karaoke generation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate karaoke file');
    } finally {
      setIsProcessing(false);
      setCurrentFeature(null);
    }
  };

  const renderFeatureCard = (feature: AIFeature) => {
    const isProcessing = currentFeature === feature.id;
    const result = results[feature.id];
    const isAvailable = feature.status === 'available';

    return (
      <View key={feature.id} style={[styles.featureCard, { borderColor: feature.color }]}>
        <View style={styles.featureHeader}>
          <MaterialIcons name={feature.icon as any} size={24} color={feature.color} />
          <Text style={styles.featureTitle}>{feature.title}</Text>
          <View style={[styles.statusIndicator, { backgroundColor: isAvailable ? '#4CAF50' : '#FF5722' }]} />
        </View>
        
        <Text style={styles.featureDescription}>{feature.description}</Text>
        
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color={feature.color} />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultContainer}>
            <View style={[styles.resultBadge, { backgroundColor: result.success ? '#4CAF50' : '#FF5722' }]}>
              <Text style={styles.resultText}>
                {result.success ? 'Success' : 'Failed'}
              </Text>
            </View>
            {result.processingTime && (
              <Text style={styles.processingTime}>
                {Math.round(result.processingTime / 1000)}s
              </Text>
            )}
          </View>
        )}

        <View style={styles.featureActions}>
          {feature.id === 'vocal-removal' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: feature.color }]}
                onPress={() => processVocalRemoval('instrumental')}
                disabled={!isAvailable || isProcessing}
              >
                <Text style={styles.actionButtonText}>Create Instrumental</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: feature.color }]}
                onPress={() => processVocalRemoval('vocals')}
                disabled={!isAvailable || isProcessing}
              >
                <Text style={styles.actionButtonText}>Extract Vocals</Text>
              </TouchableOpacity>
            </>
          )}
          
          {feature.id === 'lyrics-extraction' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={processLyricsExtraction}
              disabled={!isAvailable || isProcessing}
            >
              <Text style={styles.actionButtonText}>Extract Lyrics</Text>
            </TouchableOpacity>
          )}
          
          {feature.id === 'pitch-detection' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={processPitchDetection}
              disabled={!isAvailable || isProcessing}
            >
              <Text style={styles.actionButtonText}>Detect Pitch</Text>
            </TouchableOpacity>
          )}
          
          {feature.id === 'karaoke-generation' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={processKaraokeGeneration}
              disabled={!isAvailable || isProcessing}
            >
              <Text style={styles.actionButtonText}>Generate Karaoke</Text>
            </TouchableOpacity>
          )}
          
          {feature.id === 'lrcv2-format' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: feature.color }]}
              onPress={() => Alert.alert('Info', 'LRCv2 format support coming soon!')}
              disabled={!isAvailable || isProcessing}
            >
              <Text style={styles.actionButtonText}>Convert to LRCv2</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🎤 AI Studio</Text>
          <Text style={styles.subtitle}>
            Powered by open-source AI projects
          </Text>
        </View>

        <View style={styles.fileSection}>
          <TouchableOpacity style={styles.filePicker} onPress={pickAudioFile}>
            <MaterialIcons name="audiotrack" size={32} color="#fff" />
            <Text style={styles.filePickerText}>
              {selectedFile ? fileName : 'Select Audio File'}
            </Text>
            <MaterialIcons name="file-upload" size={24} color="#fff" />
          </TouchableOpacity>

          {selectedFile && (
            <View style={styles.fileInfo}>
              <Text style={styles.fileInfoText}>File: {fileName}</Text>
              <View style={styles.audioControls}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => playAudio(selectedFile)}
                  disabled={isPlaying}
                >
                  <MaterialIcons 
                    name={isPlaying ? "pause" : "play-arrow"} 
                    size={24} 
                    color="#fff" 
                  />
                </TouchableOpacity>
                {isPlaying && (
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopAudio}
                  >
                    <MaterialIcons name="stop" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <Text style={styles.sectionSubtitle}>
            Powered by Ultimate Vocal Remover, UltraSinger, and LRCv2
          </Text>
          
          {aiFeatures.map(renderFeatureCard)}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About These Features</Text>
          <Text style={styles.infoText}>
            These AI features are powered by cutting-edge open-source projects:
          </Text>
          <View style={styles.projectList}>
            <Text style={styles.projectItem}>• Ultimate Vocal Remover (21,300+ stars)</Text>
            <Text style={styles.projectItem}>• UltraSinger (390+ stars)</Text>
            <Text style={styles.projectItem}>• LRCv2 Format Specification</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
  fileSection: {
    padding: 20,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
  },
  filePickerText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  fileInfo: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
  },
  fileInfoText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  audioControls: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
  },
  stopButton: {
    backgroundColor: '#FF5722',
    padding: 12,
    borderRadius: 8,
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 20,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  featureDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 16,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {
    color: '#fff',
    marginLeft: 8,
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  processingTime: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  featureActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoSection: {
    padding: 20,
    paddingBottom: 40,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 16,
  },
  projectList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
  },
  projectItem: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
});
