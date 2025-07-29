import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function BattleArenaScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Battle Arena</Text>
      <Text style={styles.text}>Choose a battle mode:</Text>
      <Button title="Solo Battle" onPress={() => router.push('/solo-battle')} />
      <Button title="Live Duet" onPress={() => router.push('/live-duet')} />
      <Button title="Battle Royale" onPress={() => router.push('/battle-royale')} />
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
    marginBottom: 16,
    textAlign: 'center',
  },
});
