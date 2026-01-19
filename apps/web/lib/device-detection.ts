/**
 * Device detection utilities for mobile eSIM installation
 */

export type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
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
    };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS detection
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  
  // Android detection
  const isAndroid = /android/i.test(ua);

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

  return {
    type,
    isMobile,
    isIOS,
    isAndroid,
    isDesktop: !isMobile,
  };
}

/**
 * Checks if the device supports eSIM installation via LPA links
 */
export function supportsEsimInstall(deviceInfo: DeviceInfo): boolean {
  return deviceInfo.isIOS || deviceInfo.isAndroid;
}

