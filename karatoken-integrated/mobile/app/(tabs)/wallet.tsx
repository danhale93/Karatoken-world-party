// Powered by OnSpace.AI
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useWalletStore } from '../../hooks/useWalletStore';

export default function WalletScreen() {
  const { user } = useAuthStore();
  const { 
    balance, 
    transactions, 
    getBalance, 
    getTransactions, 
    requestPayout,
    purchaseTokens 
  } = useWalletStore();

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      await getBalance(user.id);
      await getTransactions(user.id);
    } catch (error) {
      console.error('Error loading wallet data:', error);
    }
  };

  const handlePurchaseTokens = async (amount: number) => {
    try {
      await purchaseTokens(user.id, amount);
      Alert.alert('Success', `Successfully purchased ${amount} KRT tokens!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase tokens');
    }
  };

  const handleRequestPayout = async () => {
    if (balance.krt < 100) {
      Alert.alert('Insufficient Balance', 'Minimum payout is 100 KRT tokens');
      return;
    }

    try {
      await requestPayout(user.id, balance.krt, 'crypto');
      Alert.alert('Success', 'Payout request submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to request payout');
    }
  };

  const renderTransaction = (transaction, index) => {
    const isPositive = transaction.amount > 0;
    const icon = isPositive ? 'add-circle' : 'remove-circle';
    const color = isPositive ? '#10B981' : '#EF4444';

    return (
      <View key={index} style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <MaterialIcons name={icon} size={24} color={color} />
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{transaction.description}</Text>
            <Text style={styles.transactionDate}>
              {new Date(transaction.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Text style={[styles.transactionAmount, { color }]}>
          {isPositive ? '+' : ''}{transaction.amount} KRT
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <MaterialIcons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#6B46C1', '#8B5CF6']}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <MaterialIcons name="account-balance-wallet" size={32} color="#FFFFFF" />
            </View>
            
            <Text style={styles.balanceAmount}>
              {balance.krt?.toLocaleString() || '0'} KRT
            </Text>
            
            <Text style={styles.balanceUsd}>
              ≈ ${balance.usd?.toFixed(2) || '0.00'} USD
            </Text>

            <View style={styles.balanceActions}>
              <TouchableOpacity 
                style={styles.balanceActionButton}
                onPress={() => handlePurchaseTokens(100)}
              >
                <MaterialIcons name="add" size={20} color="#6B46C1" />
                <Text style={styles.balanceActionText}>Buy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.balanceActionButton}
                onPress={handleRequestPayout}
              >
                <MaterialIcons name="arrow-upward" size={20} color="#6B46C1" />
                <Text style={styles.balanceActionText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Purchase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Purchase</Text>
          <View style={styles.purchaseOptions}>
            {[
              { amount: 100, price: 9.99 },
              { amount: 500, price: 49.99 },
              { amount: 1000, price: 89.99 },
            ].map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.purchaseOption}
                onPress={() => handlePurchaseTokens(option.amount)}
              >
                <Text style={styles.purchaseAmount}>{option.amount} KRT</Text>
                <Text style={styles.purchasePrice}>${option.price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings This Week</Text>
          <View style={styles.earningsGrid}>
            <View style={styles.earningItem}>
              <MaterialIcons name="mic" size={24} color="#10B981" />
              <Text style={styles.earningLabel}>Performances</Text>
              <Text style={styles.earningAmount}>+150 KRT</Text>
            </View>
            
            <View style={styles.earningItem}>
              <MaterialIcons name="flash-on" size={24} color="#F59E0B" />
              <Text style={styles.earningLabel}>Battles Won</Text>
              <Text style={styles.earningAmount}>+300 KRT</Text>
            </View>
            
            <View style={styles.earningItem}>
              <MaterialIcons name="emoji-events" size={24} color="#8B5CF6" />
              <Text style={styles.earningLabel}>Tournaments</Text>
              <Text style={styles.earningAmount}>+500 KRT</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map(renderTransaction)}
          </View>
        </View>

        {/* Payout Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Methods</Text>
          <View style={styles.payoutMethods}>
            <TouchableOpacity style={styles.payoutMethod}>
              <MaterialIcons name="currency-bitcoin" size={32} color="#F7931A" />
              <Text style={styles.payoutMethodTitle}>Cryptocurrency</Text>
              <Text style={styles.payoutMethodSubtitle}>Bitcoin, Ethereum, etc.</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.payoutMethod}>
              <MaterialIcons name="payment" size={32} color="#00457C" />
              <Text style={styles.payoutMethodTitle}>PayPal</Text>
              <Text style={styles.payoutMethodSubtitle}>Instant transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  balanceGradient: {
    padding: 25,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  balanceUsd: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 25,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 15,
  },
  balanceActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  balanceActionText: {
    color: '#6B46C1',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  purchaseOptions: {
    flexDirection: 'row',
    gap: 15,
  },
  purchaseOption: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  purchaseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  purchasePrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  earningsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  earningItem: {
    flex: 1,
    backgroundColor: '#1F2937',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 5,
    textAlign: 'center',
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  transactionsList: {
    backgroundColor: '#1F2937',
    borderRadius: 15,
    padding: 5,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: 15,
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  payoutMethods: {
    gap: 15,
  },
  payoutMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 15,
  },
  payoutMethodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 15,
    marginBottom: 2,
  },
  payoutMethodSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 15,
  },
});