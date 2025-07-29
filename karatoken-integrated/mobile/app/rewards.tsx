import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function RewardsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rewards</Text>
      <Text style={styles.text}>Choose a reward type:</Text>
      <Button title="Daily Challenges" onPress={() => router.push('/daily-challenges')} />
      <Button title="Streak Bonus" onPress={() => router.push('/streak-bonus')} />
      <Button title="Crypto Payouts" onPress={() => router.push('/crypto-payouts')} />
      <Button title="PayPal Payouts" onPress={() => router.push('/paypal-payouts')} />
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
