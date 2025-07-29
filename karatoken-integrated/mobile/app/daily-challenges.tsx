import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DailyChallengesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Challenges</Text>
      <Text style={styles.text}>Complete daily singing challenges to earn rewards!</Text>
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
