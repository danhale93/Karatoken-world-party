import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function GlobalLeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Leaderboard</Text>
      <Text style={styles.text}>See top singers worldwide!</Text>
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
  text: {
    fontSize: 18,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
