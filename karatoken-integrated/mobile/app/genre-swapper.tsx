import { Audio } from 'expo-av';
import React, { useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import { fetchLyricsForYoutube, getCurrentLyricLine } from './lyrics-utils';

import { ActivityIndicator, Alert, Button, KeyboardAvoidingView, PanResponder, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { BASE_URL } from './config';

// Custom Slider Component
interface CustomSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue: number;
  maximumValue: number;
  style?: any;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  value,
  onValueChange,
  minimumValue,
  maximumValue,
  style,
  minimumTrackTintColor = '#10B981',
  maximumTrackTintColor = '#232946'
}) => {
  const [sliderWidth, setSliderWidth] = useState(200);
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt) => {
      const { locationX } = evt.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / sliderWidth));
      const newValue = minimumValue + (maximumValue - minimumValue) * percentage;
      onValueChange(newValue);
    },
  });

  const trackPosition = ((value - minimumValue) / (maximumValue - minimumValue)) * sliderWidth;

  return (
    <View 
      style={[{ height: 40, justifyContent: 'center' }, style]}
      onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
      {...panResponder.panHandlers}
    >
      <View style={{
        height: 4,
        backgroundColor: maximumTrackTintColor,
        borderRadius: 2,
        position: 'absolute',
        width: '100%'
      }} />
      <View style={{
        height: 4,
        backgroundColor: minimumTrackTintColor,
        borderRadius: 2,
        position: 'absolute',
        width: trackPosition
      }} />
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: minimumTrackTintColor,
        position: 'absolute',
        left: trackPosition - 10,
        top: 10
      }} />
    </View>
  );
};

export default function GenreSwapperScreen() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [audioStatus, setAudioStatus] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [genre, setGenre] = useState('Pop');
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapStatus, setSwapStatus] = useState('');
  const [swappedAudioUri, setSwappedAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [lyrics, setLyrics] = useState<{ time: number, text: string }[]>([]);
  const [currentLyric, setCurrentLyric] = useState('');
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [pitchScore, setPitchScore] = useState<number | null>(null);
  const [vocalSeparation, setVocalSeparation] = useState(true);
  const [backingVocalLevel, setBackingVocalLevel] = useState(0.5);
  const [aiCoachTip, setAiCoachTip] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const playbackInterval = useRef<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const scrollViewRef = useRef<any>(null);

  const GENRES = [
    'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Country', 'Electronic', 'Reggae', 'Blues', 'Funk',
    'Soul', 'R&B', 'Metal', 'Punk', 'Disco', 'Folk', 'Gospel', 'Latin', 'K-Pop', 'J-Pop',
    'EDM', 'House', 'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'Ambient', 'Ska', 'Bluegrass', 'Opera',
    'Grunge', 'Indie', 'Synthwave', 'Trap', 'Afrobeat', 'Salsa', 'Bossa Nova', 'Flamenco', 'Tango', 'Chillout',
    'Lo-fi', 'World', 'Celtic', 'March', 'Polka', 'Swing', 'Motown', 'New Age', 'Soundtrack', 'Children',
  ];

  const handleLoad = async () => {
    let url = youtubeUrl.trim();
    let match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    if (match && match[1]) {
      setEmbedUrl(`https://www.youtube.com/embed/${match[1]}?autoplay=1`);
    } else {
      setEmbedUrl('');
    }
    setAudioUri(null);
    setSwappedAudioUri(null);
    setAudioStatus('');
    setSwapStatus('');
    setLyrics([]);
    setCurrentLyric('');
    setPitchScore(null);
    setLyricsLoading(true);
    setProgress(0);
    setJobId(null);
    try {
      const lyricsRes = await fetchLyricsForYoutube(url);
      setLyrics(lyricsRes.lines);
    } catch {
      setLyrics([]);
    }
    setLyricsLoading(false);
  };

  const extractAudio = async () => {
    setAudioLoading(true);
    setAudioStatus('Extracting audio...');
    setAudioUri(null);
    setSwappedAudioUri(null);
    setSwapStatus('');
    setProgress(0);
    setJobId(null);
    try {
      const res = await fetch(`${BASE_URL}/api/youtube/extract-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl }),
      });
      const data = await res.json();
      if (res.ok && data.audioUrl) {
        setAudioUri(data.audioUrl);
        setAudioStatus('Audio extracted!');
      } else {
        setAudioStatus(data.error || 'Extraction failed');
        setAudioUri(null);
      }
    } catch (e) {
      setAudioStatus('Network error');
      setAudioUri(null);
    }
    setAudioLoading(false);
  };

  const swapGenre = async () => {
    if (!audioUri) {
      setSwapStatus('No audio to swap. Please extract audio first.');
      return;
    }
    setSwapLoading(true);
    setSwapStatus('Swapping genre with AI...');
    setSwappedAudioUri(null);
    setProgress(0);
    setJobId(null);
    if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true });
    try {
      const res = await fetch(`${BASE_URL}/api/ai/genre-swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeUrl: audioUri,
          targetGenre: genre,
          vocalSeparation,
          backingVocalLevel
        }),
      });
      const data = await res.json();
      if (res.ok && data.jobId) {
        setJobId(data.jobId);
        pollStatus(data.jobId);
      } else {
        setSwapStatus(data.error || 'Genre swap failed');
        setSwapLoading(false);
      }
    } catch (e) {
      setSwapStatus('Network error');
      setSwapLoading(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/ai/genre-swap/status/${jobId}`);
      const data = await res.json();
      setProgress(data.progress || 0);
      setSwapStatus(data.status || '');
      if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true });
      if (data.status === 'done' && data.swappedAudioUrl) {
        setSwappedAudioUri(data.swappedAudioUrl);
        setSwapStatus('Genre swapped!');
        setSwapLoading(false);
      } else if (data.status === 'error') {
        setSwapStatus(data.error || 'Genre swap failed');
        setSwapLoading(false);
      } else {
        setTimeout(() => pollStatus(jobId), 2000);
      }
    } catch (e) {
      setSwapStatus('Network error');
      setSwapLoading(false);
    }
  };

  const fetchAICoachTip = async () => {
    setCoachLoading(true);
    setAiCoachTip('');
    try {
      const res = await fetch(`${BASE_URL}/api/ai/genre-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genre }),
      });
      const data = await res.json();
      if (res.ok && data.tip) setAiCoachTip(data.tip);
      else setAiCoachTip('No tip available.');
    } catch {
      setAiCoachTip('Network error');
    }
    setCoachLoading(false);
  };

  const playAudio = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
      if (playbackInterval.current) clearInterval(playbackInterval.current);
      playbackInterval.current = setInterval(async () => {
        const status = await newSound.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          const t = status.positionMillis / 1000;
          setCurrentLyric(getCurrentLyricLine(lyrics, t));
          if (status.positionMillis % 2000 < 100) {
            try {
              const res = await fetch(`${BASE_URL}/api/ai/pitch-score`, {
                method: 'POST',
                headers: {},
                body: JSON.stringify({ audioUrl: uri, start: t, duration: 2 }),
              });
              const data = await res.json();
              if (res.ok && typeof data.score === 'number') setPitchScore(data.score);
            } catch {}
          }
        } else {
          setCurrentLyric('');
          setPitchScore(null);
          if (playbackInterval.current) clearInterval(playbackInterval.current);
        }
      }, 300);
    } catch (e) {
      Alert.alert('Playback error', 'Could not play audio.');
    }
  };

  React.useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
      if (playbackInterval.current) clearInterval(playbackInterval.current);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Text style={styles.title}>Genre Swapper</Text>
          <Text style={styles.text}>Paste a YouTube link to preview and swap its genre!</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste YouTube URL here"
            placeholderTextColor="#888"
            value={youtubeUrl}
            onChangeText={setYoutubeUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button title="Load Video" onPress={handleLoad} disabled={audioLoading || swapLoading} />
          {embedUrl ? (
            <View style={{ width: '100%', height: 220, marginTop: 16, borderRadius: 12, overflow: 'hidden' }}>
              <WebView
                source={{ uri: embedUrl }}
                style={{ flex: 1 }}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            </View>
          ) : null}
          <Button title={audioLoading ? 'Extracting...' : 'Extract Audio'} onPress={extractAudio} disabled={audioLoading || !youtubeUrl || swapLoading} />
          {audioStatus ? <Text style={{ color: audioStatus.toLowerCase().includes('error') || audioStatus.toLowerCase().includes('fail') ? '#F87171' : '#10B981', marginVertical: 8 }}>{audioStatus}</Text> : null}
          {lyricsLoading && <ActivityIndicator color="#10B981" style={{ marginVertical: 8 }} />}
          {lyrics.length > 0 && (
            <View style={{ marginVertical: 8, alignItems: 'center' }}>
              <Text style={{ color: '#38BDF8', fontSize: 16, marginBottom: 4 }}>Lyrics (synced):</Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>{currentLyric}</Text>
            </View>
          )}
          {audioUri && (
            <View style={{ marginVertical: 8, alignItems: 'center' }}>
              <Button title="Play Extracted Audio" onPress={() => playAudio(audioUri)} disabled={swapLoading} />
              {pitchScore !== null && <Text style={{ color: '#10B981', fontSize: 16, marginTop: 4 }}>Pitch Score: {pitchScore}</Text>}
            </View>
          )}
          <View style={{ marginTop: 12, width: '100%' }}>
            <Text style={{ color: '#fff', marginBottom: 4 }}>Choose Target Genre:</Text>
            <View style={styles.genreList}>
              {GENRES.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genreItem, genre === g && styles.genreSelected]}
                  onPress={() => setGenre(g)}
                  disabled={swapLoading}
                >
                  <Text style={[styles.genreText, genre === g && styles.genreSelectedText]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ marginTop: 12, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#fff', marginRight: 8 }}>Vocal Separation</Text>
              <Switch value={vocalSeparation} onValueChange={setVocalSeparation} disabled={swapLoading} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#fff', marginRight: 8 }}>Backing Vocal Level</Text>
              <CustomSlider
                style={{ flex: 1 }}
                minimumValue={0}
                maximumValue={1}
                value={backingVocalLevel}
                onValueChange={setBackingVocalLevel}
                minimumTrackTintColor="#10B981"
                maximumTrackTintColor="#232946"
              />
              <Text style={{ color: '#fff', marginLeft: 8 }}>{Math.round(backingVocalLevel * 100)}%</Text>
            </View>
          </View>
          <Button title={swapLoading ? 'Swapping...' : `Swap to ${genre}`} onPress={swapGenre} disabled={swapLoading || !audioUri} />
          {swapLoading && (
            <View style={{ marginVertical: 10 }}>
              <ActivityIndicator color="#10B981" style={{ marginBottom: 8 }} />
              <Text>Status: {swapStatus}</Text>
              <Text>Progress: {progress}%</Text>
              {jobId && <Text>Job ID: {jobId}</Text>}
            </View>
          )}
          <Button title={coachLoading ? 'Loading Tip...' : 'Get AI Genre Coach Tip'} onPress={fetchAICoachTip} disabled={coachLoading || swapLoading} />
          {aiCoachTip ? <Text style={{ color: '#38BDF8', marginVertical: 8 }}>{aiCoachTip}</Text> : null}
          {swapStatus ? <Text style={{ color: swapStatus.toLowerCase().includes('error') || swapStatus.toLowerCase().includes('fail') ? '#F87171' : '#10B981', marginVertical: 8 }}>{swapStatus}</Text> : null}
          {swappedAudioUri && (
            <View style={{ marginVertical: 8, alignItems: 'center' }}>
              <Button title="Play Swapped Audio" onPress={() => playAudio(swappedAudioUri)} disabled={swapLoading} />
              {pitchScore !== null && <Text style={{ color: '#10B981', fontSize: 16, marginTop: 4 }}>Pitch Score: {pitchScore}</Text>}
              {lyrics.length > 0 && <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>{currentLyric}</Text>}
              <Button title="Retry Genre Swap" onPress={swapGenre} disabled={swapLoading || !audioUri} />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#232946',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  genreItem: {
    backgroundColor: '#232946',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 2,
  },
  genreSelected: {
    backgroundColor: '#10B981',
  },
  genreText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  genreSelectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});