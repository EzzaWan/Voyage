/**
 * Generate device fingerprint from available browser data
 * This creates a consistent fingerprint for fraud detection
 */
export function generateDeviceFingerprint(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const data: string[] = [];

    // User agent
    data.push(navigator.userAgent || '');

    // Platform
    data.push(navigator.platform || '');

    // Language
    data.push(navigator.language || '');

    // Timezone
    try {
      data.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch (e) {
      data.push('');
    }

    // Screen resolution
    data.push(`${window.screen.width}x${window.screen.height}`);

    // Color depth
    data.push(String(window.screen.colorDepth || ''));

    // Touch support
    data.push(String('ontouchstart' in window || navigator.maxTouchPoints > 0));

    // Hardware concurrency
    data.push(String(navigator.hardwareConcurrency || ''));

    // Join and hash (simple hash - in production consider crypto.subtle)
    const fingerprint = data.join('|');
    
    // Simple hash function (for client-side compatibility)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.debug('Failed to generate device fingerprint:', error);
    return null;
  }
}

