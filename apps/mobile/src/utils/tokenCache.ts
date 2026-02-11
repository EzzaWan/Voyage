import * as SecureStore from 'expo-secure-store';

// Token cache implementation for Clerk using SecureStore
// This ensures session tokens persist securely across app restarts and force-closes
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) return null;
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('[tokenCache] Failed to get token:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      const isAvailable = await SecureStore.isAvailableAsync();
      if (!isAvailable) return;
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn('[tokenCache] Failed to save token:', error);
    }
  },
};


