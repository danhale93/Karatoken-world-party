// Set your backend base URL here. Use your computer's LAN IP for device testing, e.g. 'http://192.168.1.100:3000'
export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || 'http://localhost:3000';

// Development configuration
export const DEV_CONFIG = {
  bypassAuth: true, // Skip authentication in development
  mockData: true,   // Use mock data when APIs are unavailable
  debugMode: true,  // Enable debug logging
};
