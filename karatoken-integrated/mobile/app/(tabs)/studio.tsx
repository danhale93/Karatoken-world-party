import * as DocumentPicker from 'expo-document-picker';
import React, { useContext, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import RewardRoyaltyActions from '../../components/RewardRoyaltyActions';
import { YoutubeContext } from '../_layout';
import LivePitchScoringScreen from './live-pitch-scoring';


import { BASE_URL } from '../config';


export default function StudioScreen() {
  const { youtubeUrl, embedUrl } = useContext(YoutubeContext);
  // Modal for rewards
  const [modalVisible, setModalVisible] = useState(false);
  // Live pitch score
  const [liveScore, setLiveScore] = useState<number | null>(null);
  // AI Song Generator
  const [aiLyrics, setAiLyrics] = useState('');
  const [aiMelody, setAiMelody] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  // Genre & Mood
  const [genre, setGenre] = useState('Pop');
  const [mood, setMood] = useState('Happy');
  // Recording & Playback
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Vocal Effects
  const [autoTune, setAutoTune] = useState(false);
  const [reverb, setReverb] = useState(false);
  const [harmony, setHarmony] = useState(false);
  // Achievements
  const [badges, setBadges] = useState<string[]>([]);
  // Duet Mode
  const [duetMode, setDuetMode] = useState(false);
  // Studio History
  const [history, setHistory] = useState<{ date: string, score: number, title: string, uri: string | null }[]>([]);
  // Backing Tracks
  const [backingTrack, setBackingTrack] = useState('Default');
  const [backingTracks, setBackingTracks] = useState<string[]>(['Default']);
  const [uploadingTrack, setUploadingTrack] = useState(false);
  // File upload for backing tracks
  const handleUploadBackingTrack = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (result.assets && result.assets.length > 0) {
        setUploadingTrack(true);
        const file = result.assets[0];
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
          name: file.name || 'track.mp3',
          type: file.mimeType || 'audio/mpeg',
        } as any);
        const res = await fetch(`${BASE_URL}/api/studio/upload-backing-track`, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' },
        });
        const data = await res.json();
        if (res.ok && data.trackName) {
          setBackingTracks(tracks => [...tracks, data.trackName]);
          setBackingTrack(data.trackName);
          Alert.alert('Upload Success', 'Backing track uploaded!');
        } else {
          Alert.alert('Upload Failed', data.error || 'Could not upload track.');
        }
        setUploadingTrack(false);
      }
    } catch (e) {
      setUploadingTrack(false);
      Alert.alert('Upload Error', 'An error occurred while uploading.');
    }
  };

  // File upload for recordings (when stopping recording)
  const uploadRecordingToBackend = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: 'recording.wav',
        type: 'audio/wav',
      } as any);
      const res = await fetch(`${BASE_URL}/api/studio/upload-recording`, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.uri) {
        setRecordedUri(data.uri);
        Alert.alert('Upload Success', 'Recording uploaded!');
      } else {
        Alert.alert('Upload Failed', data.error || 'Could not upload recording.');
      }
    } catch (e) {
      Alert.alert('Upload Error', 'An error occurred while uploading.');
    }
  };
  // AI Coach
  const [coachTip, setCoachTip] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);

  // API handlers
  const handleGenerateSong = async () => {
    setAiLoading(true);
    setAiLyrics('');
    setAiMelody('');
    try {
      // Call backend for AI lyrics
      const lyricsRes = await fetch(`${BASE_URL}/api/ai/generate-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, mood })
      });
      const lyricsData = await lyricsRes.json();
      setAiLyrics(lyricsData.lyrics || 'No lyrics generated.');
      // Call backend for AI melody
      const melodyRes = await fetch(`${BASE_URL}/api/ai/generate-melody`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, mood })
      });
      const melodyData = await melodyRes.json();
      setAiMelody(melodyData.melody || 'No melody generated.');
    } catch (e) {
      setAiLyrics('Error generating song.');
      setAiMelody('');
    }
    setAiLoading(false);
  };

  // TODO: Integrate with real audio recording/upload APIs
  const handleRecord = async () => {
    // Example: Use Expo Audio API or custom native module
    if (!isRecording) {
      setIsRecording(true);
      // Start recording logic here
    } else {
      setIsRecording(false);
      // Stop recording and upload
      // Replace 'dummyUri' with actual recorded file URI
      const dummyUri = 'file:///path/to/recorded.wav';
      await uploadRecordingToBackend(dummyUri);
    }
  };
  const handlePlay = async () => {
    setIsPlaying(p => !p);
    // TODO: Play audio from recordedUri
  };
  const handleSave = async () => {
    if (!recordedUri) return;
    // Call backend to save recording
    await fetch(`${BASE_URL}/api/studio/save-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: recordedUri, genre, mood, effects: { autoTune, reverb, harmony } })
    });
    alert('Recording saved!');
  };
  const handleShare = async () => {
    if (!recordedUri) return;
    // Call backend to share recording
    await fetch(`${BASE_URL}/api/studio/share-recording`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: recordedUri })
    });
    alert('Share link generated!');
  };
  const handleGetCoachTip = async () => {
    setCoachLoading(true);
    setCoachTip('');
    try {
      const res = await fetch(`${BASE_URL}/api/ai/coach-tip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre, mood, score: liveScore })
      });
      const data = await res.json();
      setCoachTip(data.tip || 'No tip available.');
    } catch {
      setCoachTip('Network error');
    }
    setCoachLoading(false);
  };

  // Fetch achievements, history, duet, and backing tracks from backend on mount
  React.useEffect(() => {
    // Fetch achievements
    fetch(`${BASE_URL}/api/studio/achievements`)
      .then(res => res.json())
      .then(data => setBadges(data.badges || []))
      .catch(() => setBadges([]));
    // Fetch history
    fetch(`${BASE_URL}/api/studio/history`)
      .then(res => res.json())
      .then(data => setHistory(data.history || []))
      .catch(() => setHistory([]));
    // Fetch backing tracks
    fetch(`${BASE_URL}/api/studio/backing-tracks`)
      .then(res => res.json())
      .then(data => setBackingTracks(data.tracks || ['Default']))
      .catch(() => setBackingTracks(['Default']));
    // TODO: Fetch duet/collab session info if needed
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🎵 AI Studio</Text>
      <Text style={styles.subtitle}>Create songs with AI!</Text>
      {/* Show global YouTube video if selected */}
      {embedUrl ? (
        <View style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1 }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
          <Text style={{ color: '#38BDF8', textAlign: 'center', marginTop: 4, fontSize: 12 }}>YouTube (global): {youtubeUrl}</Text>
        </View>
      ) : null}

      {/* AI Song Generator */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Song Generator</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.button} onPress={handleGenerateSong} disabled={aiLoading}>
            <Text style={styles.buttonText}>{aiLoading ? 'Generating...' : 'Generate Song'}</Text>
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#fff' }}>{aiLyrics}</Text>
            <Text style={{ color: '#fff' }}>{aiMelody}</Text>
          </View>
        </View>
      </View>

      {/* Genre & Mood Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genre & Mood</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.button, genre === 'Pop' && styles.selectedButton]} onPress={() => setGenre('Pop')}><Text style={styles.buttonText}>Pop</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, genre === 'Rock' && styles.selectedButton]} onPress={() => setGenre('Rock')}><Text style={styles.buttonText}>Rock</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, genre === 'Jazz' && styles.selectedButton]} onPress={() => setGenre('Jazz')}><Text style={styles.buttonText}>Jazz</Text></TouchableOpacity>
          {/* Add more genres as needed */}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <TouchableOpacity style={[styles.button, mood === 'Happy' && styles.selectedButton]} onPress={() => setMood('Happy')}><Text style={styles.buttonText}>Happy</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, mood === 'Sad' && styles.selectedButton]} onPress={() => setMood('Sad')}><Text style={styles.buttonText}>Sad</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, mood === 'Energetic' && styles.selectedButton]} onPress={() => setMood('Energetic')}><Text style={styles.buttonText}>Energetic</Text></TouchableOpacity>
        </View>
      </View>

      {/* Real-Time Visual Feedback (Pitch Graph Placeholder) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Pitch Graph</Text>
        <View style={{ height: 60, backgroundColor: '#232946', borderRadius: 8, marginVertical: 8, width: 280, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#38BDF8' }}>[Pitch graph here]</Text>
        </View>
      </View>

      {/* Recording & Playback */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recording & Playback</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.button} onPress={handleRecord}><Text style={styles.buttonText}>{isRecording ? 'Stop' : 'Record'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handlePlay} disabled={!recordedUri}><Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={!recordedUri}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleShare} disabled={!recordedUri}><Text style={styles.buttonText}>Share</Text></TouchableOpacity>
        </View>
      </View>

      {/* AI Vocal Effects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Vocal Effects</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.button, autoTune && styles.selectedButton]} onPress={() => setAutoTune(a => !a)}><Text style={styles.buttonText}>Auto-Tune</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, reverb && styles.selectedButton]} onPress={() => setReverb(r => !r)}><Text style={styles.buttonText}>Reverb</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, harmony && styles.selectedButton]} onPress={() => setHarmony(h => !h)}><Text style={styles.buttonText}>Harmony</Text></TouchableOpacity>
        </View>
      </View>

      {/* Progress & Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {badges.map(badge => (
            <View key={badge} style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
          ))}
        </View>
      </View>

      {/* Collaboration & Duet Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collaboration</Text>
        <TouchableOpacity style={[styles.button, duetMode && styles.selectedButton]} onPress={() => setDuetMode(d => !d)}>
          <Text style={styles.buttonText}>{duetMode ? 'Duet Mode On' : 'Start Duet'}</Text>
        </TouchableOpacity>
        {duetMode && <Text style={{ color: '#fff', marginTop: 4 }}>[Duet UI Placeholder]</Text>}
      </View>

      {/* Studio History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Studio History</Text>
        {history.map((item, idx) => (
          <View key={idx} style={styles.historyItem}>
            <Text style={styles.historyText}>{item.date} - {item.title} (Score: {item.score})</Text>
          </View>
        ))}
      </View>

      {/* Customizable Backing Tracks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backing Track</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          {backingTracks.map(track => (
            <TouchableOpacity key={track} style={[styles.button, backingTrack === track && styles.selectedButton]} onPress={() => setBackingTrack(track)}>
              <Text style={styles.buttonText}>{track}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.button, uploadingTrack && styles.selectedButton]} onPress={handleUploadBackingTrack} disabled={uploadingTrack}>
            <Text style={styles.buttonText}>{uploadingTrack ? 'Uploading...' : 'Upload'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Coach & Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Coach</Text>
        <TouchableOpacity style={styles.button} onPress={handleGetCoachTip} disabled={coachLoading}>
          <Text style={styles.buttonText}>{coachLoading ? 'Loading...' : 'Get Tip'}</Text>
        </TouchableOpacity>
        {coachTip ? <Text style={{ color: '#38BDF8', marginTop: 4 }}>{coachTip}</Text> : null}
      </View>

      {/* Live Pitch Scoring (original feature) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Pitch Scoring</Text>
        <LivePitchScoringScreen onScore={setLiveScore} />
      </View>

      {/* Floating Action Button for Rewards */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>$</Text>
      </TouchableOpacity>
      <RewardRoyaltyActions visible={modalVisible} onClose={() => setModalVisible(false)} score={liveScore ?? undefined} />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 18, color: '#9CA3AF', marginTop: 4, textAlign: 'center', marginBottom: 12 },
  section: { marginBottom: 18, backgroundColor: '#232946', borderRadius: 12, padding: 12 },
  sectionTitle: { color: '#10B981', fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  button: { backgroundColor: '#232946', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, margin: 2, borderWidth: 1, borderColor: '#10B981' },
  selectedButton: { backgroundColor: '#10B981' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  badge: { backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, margin: 2 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  historyItem: { backgroundColor: '#232946', borderRadius: 8, padding: 8, marginVertical: 2 },
  historyText: { color: '#fff', fontSize: 14 },
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