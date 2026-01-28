import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { theme } from '../src/theme';

/**
 * OAuth callback handler for Clerk
 * This route handles the OAuth redirect after Google/Apple sign-in
 */
export default function OAuthCallback() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    if (!isLoaded) return;

    // If we have a session ID in params, Clerk has already handled the OAuth
    // Just redirect to home
    if (params.created_session_id || isSignedIn) {
      // Small delay to ensure session is fully set
      const timer = setTimeout(() => {
        router.replace('/');
      }, 100);
      return () => clearTimeout(timer);
    }

    // If not signed in and no session ID, redirect to sign-in
    const timer = setTimeout(() => {
      router.replace('/(auth)/sign-in');
    }, 500);
    return () => clearTimeout(timer);
  }, [isLoaded, isSignedIn, params.created_session_id, router]);

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

