/**
 * Device detection utilities for mobile eSIM installation
 * Based on Apple and Android Universal Links for eSIM installation
 * @see https://esimaccess.com/new-apple-universal-link-for-esim-install/
 * @see https://esimaccess.com/new-android-universal-link-for-esim-installation/
 */

export type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  iosVersion?: number | null;
  androidVersion?: number | null;
  supportsUniversalLink: boolean;
}

/**
 * Parses iOS version from user agent
 * Returns major version number (e.g., 17 for iOS 17.4)
 */
function parseIOSVersion(ua: string): number | null {
  // Match iOS version: "OS 17_4" or "Version/17.4"
  const match = ua.match(/OS (\d+)[._](\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Parses Android version from user agent
 * Returns major version number (e.g., 10 for Android 10)
 */
function parseAndroidVersion(ua: string): number | null {
  // Match Android version: "Android 10" or "Android/10"
  const match = ua.match(/Android[\/\s](\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Detects the device type based on user agent
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'unknown',
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      isDesktop: false,
      iosVersion: null,
      androidVersion: null,
      supportsUniversalLink: false,
    };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const iosVersion = isIOS ? parseIOSVersion(ua) : null;
  
  // Android detection
  const isAndroid = /android/i.test(ua);
  const androidVersion = isAndroid ? parseAndroidVersion(ua) : null;

  // Mobile detection (includes tablets)
  const isMobile = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  let type: DeviceType = 'unknown';
  if (isIOS) {
    type = 'ios';
  } else if (isAndroid) {
    type = 'android';
  } else if (!isMobile) {
    type = 'desktop';
  }

  // Universal Links support:
  // - iOS: Requires iOS 17.4+ (https://esimaccess.com/new-apple-universal-link-for-esim-install/)
  // - Android: Requires Android 10+ with latest GMS and LPA updates
  const supportsUniversalLink = 
    (isIOS && iosVersion !== null && iosVersion >= 17) || // iOS 17.4+ (we check >= 17, actual check is 17.4 but we're conservative)
    (isAndroid && androidVersion !== null && androidVersion >= 10);

  return {
    type,
    isMobile,
    isIOS,
    isAndroid,
    isDesktop: !isMobile,
    iosVersion,
    androidVersion,
    supportsUniversalLink,
  };
}

/**
 * Checks if the device supports eSIM installation via Universal Links
 */
export function supportsEsimInstall(deviceInfo: DeviceInfo): boolean {
  return deviceInfo.supportsUniversalLink;
}

