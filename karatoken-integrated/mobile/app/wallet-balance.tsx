
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getCurrentUserId } from '../hooks/useUserId';
import { BASE_URL } from './config';

export default function WalletBalanceScreen() {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const userId = getCurrentUserId();

  React.useEffect(() => {
    const fetchBalance = async () => {
      setLoading(true);
      setError('');
      try {
        if (!userId) {
          setError('You must be logged in to view your wallet.');
          setLoading(false);
          return;
        }
        const response = await fetch(`${BASE_URL}/api/users/${userId}`);
        const data = await response.json();
        if (response.ok && data.wallet !== undefined) {
          setBalance(data.wallet);
        } else {
          setError('Failed to load wallet balance');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchBalance();
  }, [userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Balance</Text>
      {loading ? <Text style={styles.text}>Loading...</Text> : null}
      {error ? <Text style={[styles.text, { color: 'red' }]}>{error}</Text> : null}
      {balance !== null && !loading && !error ? (
        <Text style={styles.text}>Your $KARA balance: {balance}</Text>
      ) : null}
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
