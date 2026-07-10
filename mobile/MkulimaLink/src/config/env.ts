let extra: Record<string, string> = {};
try {
  const Constants = require('expo-constants').default;
  extra = Constants.expoConfig?.extra || {};
} catch {
  // Non-Expo React Native environment
}

export const API_BASE_URL =
  extra.apiBaseUrl ||
  process.env.API_BASE_URL ||
  'https://mkulimalink-api-production.up.railway.app/api';

export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
