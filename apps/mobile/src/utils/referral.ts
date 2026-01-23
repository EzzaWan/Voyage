import AsyncStorage from '@react-native-async-storage/async-storage';

const REFERRAL_STORAGE_KEY = 'voyage_ref';

/**
 * Get referral code from URL query params (for deep links)
 */
export function getReferralFromUrl(url?: string): string | null {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    const ref = urlObj.searchParams.get('ref');
    return ref?.toUpperCase().trim() || null;
  } catch {
    return null;
  }
}

/**
 * Store referral code in AsyncStorage
 */
export async function storeReferralCode(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, code.toUpperCase().trim());
  } catch (error) {
    console.error('Failed to store referral code:', error);
  }
}

/**
 * Get stored referral code from AsyncStorage
 */
export async function getStoredReferralCode(): Promise<string | null> {
  try {
    const code = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY);
    return code?.toUpperCase().trim() || null;
  } catch (error) {
    console.error('Failed to get stored referral code:', error);
    return null;
  }
}

/**
 * Clear stored referral code
 */
export async function clearReferralCode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear referral code:', error);
  }
}

/**
 * Initialize referral tracking from URL
 * Call this when app opens or receives a deep link
 */
export async function initReferralTracking(url?: string): Promise<string | null> {
  // Check URL first (highest priority)
  const urlRef = url ? getReferralFromUrl(url) : null;
  if (urlRef) {
    await storeReferralCode(urlRef);
    return urlRef;
  }
  
  // Fall back to stored value
  return await getStoredReferralCode();
}

