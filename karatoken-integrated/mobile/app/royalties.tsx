import React, { useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RoyaltiesScreen() {
  // Track registration state
  const [track, setTrack] = useState<{ [key: string]: string }>({
    title: '', artist: '', composer: '', publisher: '', rightsHolderAddress: ''
  });
  const [registerStatus, setRegisterStatus] = useState('');

  // Royalty calculation state
  const [royaltyType, setRoyaltyType] = useState('streaming');
  const [plays, setPlays] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [audience, setAudience] = useState('1');
  const [isCover, setIsCover] = useState(false);
  const [royaltyResult, setRoyaltyResult] = useState<any>(null);

  // Vault unlock state
  const [streakDays, setStreakDays] = useState('');
  const [vaultResult, setVaultResult] = useState<any>(null);

  // Handlers
  const handleRegisterTrack = async () => {
    setRegisterStatus('');
    try {
      const res = await fetch('http://localhost:3000/api/royalty/register-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(track),
      });
      const data = await res.json();
      if (res.ok) setRegisterStatus('Track registered! Verification: ' + data.verification);
      else setRegisterStatus(data.error || 'Registration failed');
    } catch (e) {
      setRegisterStatus('Network error');
    }
  };

  const handleCalculateRoyalty = async () => {
    setRoyaltyResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/royalty/calculate-royalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: royaltyType,
          plays: Number(plays),
          minutes: Number(minutes),
          audience: Number(audience),
          isCover,
        }),
      });
      const data = await res.json();
      setRoyaltyResult(data);
    } catch (e) {
      setRoyaltyResult({ error: 'Network error' });
    }
  };

  const handleUnlockVault = async () => {
    setVaultResult(null);
    try {
      const res = await fetch('http://localhost:3000/api/royalty/unlock-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user', streakDays: Number(streakDays) }),
      });
      const data = await res.json();
      setVaultResult(data);
    } catch (e) {
      setVaultResult({ error: 'Network error' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Royalties & Vault</Text>
      {/* Track Registration */}
      <Text style={styles.section}>Register Track</Text>
      {['title', 'artist', 'composer', 'publisher', 'rightsHolderAddress'].map(field => (
        <TextInput
          key={field}
          style={styles.input}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={track[field]}
          onChangeText={val => setTrack({ ...track, [field]: val })}
        />
      ))}
      <Button title="Register Track" onPress={handleRegisterTrack} />
      {registerStatus ? <Text style={styles.status}>{registerStatus}</Text> : null}

      {/* Royalty Calculation */}
      <Text style={styles.section}>Calculate Royalty</Text>
      <TextInput style={styles.input} placeholder="Type (streaming, download, livePerformance)" value={royaltyType} onChangeText={setRoyaltyType} />
      <TextInput style={styles.input} placeholder="Plays" value={plays} onChangeText={setPlays} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Audience" value={audience} onChangeText={setAudience} keyboardType="numeric" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: '#fff', marginRight: 8 }}>Is Cover?</Text>
        <Button title={isCover ? 'Yes' : 'No'} onPress={() => setIsCover(v => !v)} />
      </View>
      <Button title="Calculate Royalty" onPress={handleCalculateRoyalty} />
      {royaltyResult && (
        <Text style={styles.status}>{royaltyResult.error ? royaltyResult.error : `Payout: ${JSON.stringify(royaltyResult.payout)} ${royaltyResult.currency}`}</Text>
      )}

      {/* Vault Unlock */}
      <Text style={styles.section}>Unlock Mystery Vault</Text>
      <TextInput style={styles.input} placeholder="Streak Days" value={streakDays} onChangeText={setStreakDays} keyboardType="numeric" />
      <Button title="Unlock Vault" onPress={handleUnlockVault} />
      {vaultResult && (
        <Text style={styles.status}>{vaultResult.error ? vaultResult.error : `Bonus: ${vaultResult.bonus} ${vaultResult.currency}`}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
  },
  section: {
    fontSize: 20,
    color: '#10B981',
    marginTop: 24,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    width: 260,
    backgroundColor: '#232946',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  status: {
    color: '#FBBF24',
    marginVertical: 8,
    textAlign: 'center',
  },
});
