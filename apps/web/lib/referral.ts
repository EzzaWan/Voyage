/**
 * Referral code utilities
 * Detects referral codes from URL params and stores them
 */

const REFERRAL_COOKIE_NAME = 'voyage_ref';
const REFERRAL_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 1 year

/**
 * Get referral code from URL query params
 */
export function getReferralFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  return params.get('ref')?.toUpperCase().trim() || null;
}

/**
 * Store referral code in cookie
 */
export function storeReferralCode(code: string): void {
  if (typeof window === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + REFERRAL_COOKIE_MAX_AGE);
  
  document.cookie = `${REFERRAL_COOKIE_NAME}=${code}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get stored referral code from cookie
 */
export function getStoredReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_NAME && value) {
      return value.toUpperCase().trim();
    }
  }
  return null;
}

/**
 * Track affiliate click on backend
 */
async function trackAffiliateClick(referralCode: string, deviceFingerprint?: string): Promise<void> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    await fetch(`${apiUrl}/affiliate/track-click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        referralCode,
        deviceFingerprint: deviceFingerprint || null,
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt user experience
    console.debug('Failed to track affiliate click:', error);
  }
}

/**
 * Initialize referral tracking
 * Call this on app load to detect and store referral codes
 */
export function initReferralTracking(): string | null {
  // Check URL first (highest priority)
  const urlRef = getReferralFromUrl();
  if (urlRef) {
    storeReferralCode(urlRef);
    
    // Generate device fingerprint for fraud detection
    let deviceFingerprint: string | undefined;
    try {
      const { generateDeviceFingerprint } = require('./device-fingerprint');
      deviceFingerprint = generateDeviceFingerprint() || undefined;
    } catch (e) {
      // Ignore if fingerprint generation fails
    }
    
    // Track click on backend
    trackAffiliateClick(urlRef, deviceFingerprint).catch(() => {
      // Silent fail
    });
    
    // Clean up URL param to avoid showing it
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
    return urlRef;
  }
  
  // Fall back to stored cookie
  return getStoredReferralCode();
}

/**
 * Clear stored referral code
 */
export function clearReferralCode(): void {
  if (typeof window === 'undefined') return;
  
  document.cookie = `${REFERRAL_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

