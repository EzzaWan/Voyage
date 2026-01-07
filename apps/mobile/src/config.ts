import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Lazy resolver - only called when API base URL is actually needed
export function getApiBaseUrl(): string {
  const extra = Constants.expoConfig?.extra || {};
  
  // Debug logging
  console.log('[config] Constants.expoConfig?.extra:', JSON.stringify(extra, null, 2));
  console.log('[config] extra.apiBaseUrl:', extra.apiBaseUrl);
  
  const apiBaseUrl = extra.apiBaseUrl as string | undefined;

  if (!apiBaseUrl) {
    console.error('[config] FATAL: apiBaseUrl is undefined. Full extra:', extra);
    throw new Error(
      'API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL in .env.mobile'
    );
  }

  // Prevent localhost usage on mobile devices
  const isLocalhost =
    apiBaseUrl.includes('localhost') ||
    apiBaseUrl.includes('127.0.0.1') ||
    apiBaseUrl.startsWith('http://localhost') ||
    apiBaseUrl.startsWith('http://127.0.0.1');

  if (Platform.OS !== 'web' && isLocalhost) {
    throw new Error(
      `Invalid API base URL for mobile: "${apiBaseUrl}". Localhost URLs do not work on physical devices.`
    );
  }

  // Log resolved URL (only when called)
  console.log('[config] API Base URL resolved:', apiBaseUrl);

  return apiBaseUrl;
}

function getClerkPublishableKey(): string | undefined {
  const extra = Constants.expoConfig?.extra || {};
  return extra.clerkPublishableKey as string | undefined;
}

// Legacy export for backward compatibility (uses lazy getter)
export const config = {
  get apiBaseUrl() {
    return getApiBaseUrl();
  },
  get clerkPublishableKey() {
    return getClerkPublishableKey();
  },
};
