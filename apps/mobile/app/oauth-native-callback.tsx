import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { theme } from '../src/theme';

const CALLBACK_TIMEOUT_MS = 8000;

/**
 * OAuth callback handler for Clerk.
 * After Apple/Google redirect, Clerk may set the session asynchronously.
 * Wait for isSignedIn or session in params; otherwise timeout and go to sign-in.
 */
export default function OAuthCallback() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const params = useLocalSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const hasSession = Boolean(params.created_session_id ?? params.createdSessionId) || isSignedIn;

    if (hasSession) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const t = setTimeout(() => router.replace('/'), 100);
      return () => clearTimeout(t);
    }

    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        router.replace('/(auth)/sign-in');
      }, CALLBACK_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoaded, isSignedIn, params.created_session_id, params.createdSessionId, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});

