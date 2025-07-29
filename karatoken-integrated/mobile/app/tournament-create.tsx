import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { tournamentService, CreateTournamentData } from '../services/tournamentService';

const categories = [
  { id: 'pop', name: 'Pop', icon: 'music-note', color: '#EC4899' },
  { id: 'rock', name: 'Rock', icon: 'music-note', color: '#EF4444' },
  { id: 'hip-hop', name: 'Hip-Hop', icon: 'music-note', color: '#8B5CF6' },
  { id: 'country', name: 'Country', icon: 'music-note', color: '#F59E0B' },
  { id: 'jazz', name: 'Jazz', icon: 'music-note', color: '#10B981' },
  { id: 'classical', name: 'Classical', icon: 'music-note', color: '#3B82F6' },
];

const participantOptions = [8, 16, 32, 64];
const entryFeeOptions = [25, 50, 100, 200, 500];

export default function TournamentCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [entryFee, setEntryFee] = useState(100);
  const [totalPrizePool, setTotalPrizePool] = useState(1000);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTournament = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to create tournaments');
      return;
    }

    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a tournament title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a tournament description');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!startDate || !endDate || !registrationDeadline) {
      Alert.alert('Error', 'Please set all dates');
      return;
    }

    if (new Date(startDate) <= new Date()) {
      Alert.alert('Error', 'Start date must be in the future');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    if (new Date(registrationDeadline) >= new Date(startDate)) {
      Alert.alert('Error', 'Registration deadline must be before start date');
      return;
    }

    try {
      setLoading(true);

      const tournamentData: CreateTournamentData = {
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        startDate,
        endDate,
        registrationDeadline,
        maxParticipants,
        entryFee,
        totalPrizePool,
        rules: [
          'All participants must be registered users',
          'Each match consists of one song performance',
          'AI scoring will determine match winners',
          'Participants must be present for their scheduled matches',
          'Disqualification for no-shows or rule violations',
          ...customRules,
        ],
        createdBy: user.id,
      };

      const tournament = await tournamentService.createTournament(tournamentData);
      
      Alert.alert(
        'Success!',
        'Tournament created successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Create tournament error:', error);
      Alert.alert('Error', 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    if (newRule.trim() && !customRules.includes(newRule.trim())) {
      setCustomRules([...customRules, newRule.trim()]);
      setNewRule('');
    }
  };

  const removeRule = (index: number) => {
    setCustomRules(customRules.filter((_, i) => i !== index));
  };

  const calculatePrizePool = () => {
    const basePrizePool = entryFee * maxParticipants;
    return Math.max(basePrizePool, totalPrizePool);
  };

  const renderCategoryOption = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryOption,
        selectedCategory === category.id && styles.selectedCategory,
        { borderColor: category.color }
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
        <MaterialIcons name={category.icon as any} size={20} color="#FFFFFF" />
      </View>
      <Text style={[
        styles.categoryName,
        selectedCategory === category.id && styles.selectedCategoryText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderParticipantOption = (count: number) => (
    <TouchableOpacity
      key={count}
      style={[
        styles.optionButton,
        maxParticipants === count && styles.selectedOption
      ]}
      onPress={() => setMaxParticipants(count)}
    >
      <Text style={[
        styles.optionText,
        maxParticipants === count && styles.selectedOptionText
      ]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  const renderEntryFeeOption = (fee: number) => (
    <TouchableOpacity
      key={fee}
      style={[
        styles.optionButton,
        entryFee === fee && styles.selectedOption
      ]}
      onPress={() => setEntryFee(fee)}
    >
      <Text style={[
        styles.optionText,
        entryFee === fee && styles.selectedOptionText
      ]}>
        {fee} KRT
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Tournament</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tournament Title</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter tournament title"
                placeholderTextColor="#6B7280"
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your tournament..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map(renderCategoryOption)}
            </View>
          </View>

          {/* Tournament Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tournament Settings</Text>
            
            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Maximum Participants</Text>
              <View style={styles.optionsGrid}>
                {participantOptions.map(renderParticipantOption)}
              </View>
            </View>

            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Entry Fee</Text>
              <View style={styles.optionsGrid}>
                {entryFeeOptions.map(renderEntryFeeOption)}
              </View>
            </View>

            <View style={styles.settingGroup}>
              <Text style={styles.settingLabel}>Total Prize Pool</Text>
              <TextInput
                style={styles.textInput}
                value={totalPrizePool.toString()}
                onChangeText={(text) => setTotalPrizePool(parseInt(text) || 0)}
                placeholder="Enter prize pool amount"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
              />
              <Text style={styles.hintText}>
                Minimum: {calculatePrizePool()} KRT (based on entry fees)
              </Text>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tournament Dates</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Registration Deadline</Text>
              <TextInput
                style={styles.textInput}
                value={registrationDeadline}
                onChangeText={setRegistrationDeadline}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.textInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.textInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          {/* Custom Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Rules</Text>
            
            <View style={styles.ruleInputContainer}>
              <TextInput
                style={styles.textInput}
                value={newRule}
                onChangeText={setNewRule}
                placeholder="Add a custom rule..."
                placeholderTextColor="#6B7280"
              />
              <TouchableOpacity style={styles.addRuleButton} onPress={addRule}>
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {customRules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <Text style={styles.ruleText}>{rule}</Text>
                <TouchableOpacity onPress={() => removeRule(index)}>
                  <MaterialIcons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Tournament Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tournament Preview</Text>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>{title || 'Tournament Title'}</Text>
              <Text style={styles.previewDescription}>{description || 'Tournament description...'}</Text>
              
              <View style={styles.previewStats}>
                <View style={styles.previewStat}>
                  <Text style={styles.previewStatLabel}>Participants</Text>
                  <Text style={styles.previewStatValue}>0/{maxParticipants}</Text>
                </View>
                <View style={styles.previewStat}>
                  <Text style={styles.previewStatLabel}>Entry Fee</Text>
                  <Text style={styles.previewStatValue}>{entryFee} KRT</Text>
                </View>
                <View style={styles.previewStat}>
                  <Text style={styles.previewStatLabel}>Prize Pool</Text>
                  <Text style={styles.previewStatValue}>{totalPrizePool} KRT</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateTournament}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.createButtonText}>Creating...</Text>
            ) : (
              <Text style={styles.createButtonText}>Create Tournament</Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 100,
  },
  selectedCategory: {
    backgroundColor: '#1F2937',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#3B82F6',
  },
  settingGroup: {
    marginBottom: 20,
  },
  settingLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  hintText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  ruleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  addRuleButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  ruleText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  previewCard: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 20,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewStat: {
    alignItems: 'center',
  },
  previewStatLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  previewStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
  },
  createButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
}); 