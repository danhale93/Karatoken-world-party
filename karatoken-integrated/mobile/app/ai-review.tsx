

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { BASE_URL } from './config';



export default function AIReviewScreen() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{ status: string; message: string } | null>(null);

  const handleLoadSong = () => {
    let url = youtubeUrl.trim();
    let match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    if (match && match[1]) {
      setEmbedUrl(`https://www.youtube.com/embed/${match[1]}?autoplay=1`);
      fetchReview(url);
    } else {
      setEmbedUrl('');
      setError('Invalid YouTube URL');
    }
  };

  const fetchReview = (url: string) => {
    setLoading(true);
    setError(null);
    setReview(null);
    fetch(`${BASE_URL}/api/ai/review-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ youtubeUrl: url })
    })
      .then(res => res.json())
      .then(data => {
        setReview(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch review status.');
        setLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">AI Performance Review</Text>
      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          style={styles.input}
          placeholder="Paste YouTube URL here"
          placeholderTextColor="#888"
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="Load Song" onPress={handleLoadSong} disabled={loading || !youtubeUrl} />
      </View>
      {embedUrl ? (
        <View style={{ width: '100%', height: 220, marginBottom: 16, borderRadius: 12, overflow: 'hidden' }}>
          <WebView
            source={{ uri: embedUrl }}
            style={{ flex: 1 }}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
          />
        </View>
      ) : null}
      {loading && <Text style={styles.text}>Loading AI review...</Text>}
      {error && <Text style={[styles.text, { color: '#F87171' }]}>{error}</Text>}
      {!loading && !error && review && (
        <>
          <Text style={styles.text}>{review.message || 'Your performance is being reviewed by AI...'}</Text>
          {review.status === 'complete' && (
            <Button title="View Score Summary" onPress={() => router.push('/score-summary')} accessibilityLabel="View your score summary" />
          )}
        </>
      )}
    </SafeAreaView>
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
    marginBottom: 24,
  },
  text: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
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
});
