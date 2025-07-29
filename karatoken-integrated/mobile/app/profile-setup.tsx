import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [bio, setBio] = React.useState('');
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Up Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Tell us about yourself"
        placeholderTextColor="#9CA3AF"
        value={bio}
        onChangeText={setBio}
      />
      <Button title="Continue" onPress={() => router.push('/')} />
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
  input: {
    width: '80%',
    backgroundColor: '#232946',
    color: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
});
