// @ts-nocheck
import { ConfigContext, ExpoConfig } from 'expo/config';
import * as path from 'path';
import * as fs from 'fs';

// Minimal env parser to avoid dotenv quirks on Windows
function parseEnvFile(buffer: Buffer): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Remove UTF-16 BOM if present, or decode as UTF-8
  let content: string;
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    // UTF-16 LE BOM
    content = buffer.slice(2).toString('utf16le');
  } else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    // UTF-16 BE BOM
    content = buffer.swap16().slice(2).toString('utf16le');
  } else {
    // UTF-8 (with or without BOM)
    content = buffer.toString('utf-8');
    // Remove UTF-8 BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
  }
  
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

// Load .env.mobile explicitly (try a few likely locations)
const envCandidates = [
  path.resolve(process.cwd(), '.env.mobile'), // common when running from apps/mobile
  path.resolve(process.cwd(), 'apps/mobile/.env.mobile'), // common when running from monorepo root
  path.resolve(__dirname, '.env.mobile'), // fallback relative to this config file
];

let envVars: Record<string, string> = {};
let loadedPath: string | null = null;

for (const candidate of envCandidates) {
  try {
    if (fs.existsSync(candidate)) {
      // Read as buffer to handle encoding properly
      const fileBuffer = fs.readFileSync(candidate);
      envVars = parseEnvFile(fileBuffer);
      loadedPath = candidate;
      // Also set process.env for compatibility
      Object.keys(envVars).forEach((key) => {
        process.env[key] = envVars[key];
      });
      break;
    }
  } catch (error) {
    console.error('[app.config] Error loading .env.mobile from', candidate, error);
  }
}

console.log(
  '[app.config] Loaded',
  Object.keys(envVars).length,
  'env vars from .env.mobile',
  loadedPath ? `(${loadedPath})` : '(not found)'
);

// Debug: Log what we're setting in extra
const apiBaseUrlValue = envVars.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
console.log('[app.config] envVars keys:', Object.keys(envVars));
console.log('[app.config] envVars.EXPO_PUBLIC_API_BASE_URL:', envVars.EXPO_PUBLIC_API_BASE_URL);
console.log('[app.config] Setting extra.apiBaseUrl to:', apiBaseUrlValue);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Voyo',
  slug: 'voyo-mobile',
  scheme: 'voyo',
  sdkVersion: '54.0.0',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    // @ts-ignore - usesCleartextTraffic is valid but not in ExpoConfig types for SDK 54
    usesCleartextTraffic: true,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router'],
  extra: {
    apiBaseUrl: apiBaseUrlValue,
    clerkPublishableKey:
      envVars.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
});
