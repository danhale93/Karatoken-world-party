import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BASE_URL, DEV_CONFIG } from './config';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'checking';
  url?: string;
  error?: string;
}

export default function StatusScreen() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Frontend App', status: 'online' },
    { name: 'Backend API', status: 'checking', url: BASE_URL },
    { name: 'Database', status: 'checking' },
  ]);

  useEffect(() => {
    checkServices();
  }, []);

  const checkServices = async () => {
    // Check backend
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        updateServiceStatus('Backend API', 'online');
      } else {
        updateServiceStatus('Backend API', 'offline', 'HTTP Error');
      }
    } catch (error) {
      updateServiceStatus('Backend API', 'offline', error.message);
    }

    // Check database (mock for now)
    setTimeout(() => {
      updateServiceStatus('Database', 'online');
    }, 1000);
  };

  const updateServiceStatus = (name: string, status: 'online' | 'offline', error?: string) => {
    setServices(prev => prev.map(service => 
      service.name === name 
        ? { ...service, status, error }
        : service
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      case 'checking': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '✅';
      case 'offline': return '❌';
      case 'checking': return '⏳';
      default: return '❓';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>KARATOKEN Status</Text>
        
        <View style={styles.configSection}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Backend URL:</Text>
            <Text style={styles.configValue}>{BASE_URL}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Dev Mode:</Text>
            <Text style={styles.configValue}>{DEV_CONFIG.debugMode ? 'Enabled' : 'Disabled'}</Text>
          </View>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Auth Bypass:</Text>
            <Text style={styles.configValue}>{DEV_CONFIG.bypassAuth ? 'Enabled' : 'Disabled'}</Text>
          </View>
        </View>

        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>Services</Text>
          {services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.url && (
                  <Text style={styles.serviceUrl}>{service.url}</Text>
                )}
              </View>
              <View style={styles.serviceStatus}>
                <Text style={styles.statusIcon}>{getStatusIcon(service.status)}</Text>
                <Text style={[styles.statusText, { color: getStatusColor(service.status) }]}>
                  {service.status.toUpperCase()}
                </Text>
              </View>
              {service.error && (
                <Text style={styles.errorText}>{service.error}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={checkServices}
          >
            <Text style={styles.actionButtonText}>Refresh Status</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => Alert.alert('Info', 'Use localhost:8081 to access the app')}
          >
            <Text style={styles.actionButtonText}>Show Access URL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.sectionTitle}>Quick Fixes</Text>
          <Text style={styles.helpText}>
            • If backend is offline, run: cd backend && node index.js{'\n'}
            • If frontend won't load, use: localhost:8081{'\n'}
            • If you see errors, check the terminal for details{'\n'}
            • The app works best in development mode
          </Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  configSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  configLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  configValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  servicesSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  serviceItem: {
    marginBottom: 16,
  },
  serviceInfo: {
    marginBottom: 4,
  },
  serviceName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  serviceUrl: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  actionsSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: '#374151',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
  },
  helpText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
}); 