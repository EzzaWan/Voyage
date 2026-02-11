import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { config } from '../src/config';
import { theme } from '../src/theme';
import { CurrencyProvider } from '../src/context/CurrencyContext';
import { ToastProvider } from '../src/context/ToastContext';
import FloatingChatButton from '../src/components/FloatingChatButton';
import { tokenCache } from '../src/utils/tokenCache';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const publishableKey = config.clerkPublishableKey;
  
  if (!publishableKey) {
    console.error('[RootLayout] WARNING: Clerk publishable key is missing! Authentication will not work.');
    console.error('[RootLayout] Make sure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set in .env.mobile');
  }
  
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  const screenOptions = {
    headerShown: false,
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
  };

  // Always render ClerkProvider, even if key is missing (it will show errors but won't crash)
  // This prevents "useUser can only be used within ClerkProvider" errors
  return (
    <ClerkProvider 
      publishableKey={publishableKey || ''}
      tokenCache={tokenCache}
      // Configure OAuth redirect URLs for Expo
      afterSignInUrl="/"
      afterSignUpUrl="/"
    >
      <CurrencyProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              ...screenOptions,
              headerShown: false,
            }}
          />
          <FloatingChatButton />
        </ToastProvider>
      </CurrencyProvider>
    </ClerkProvider>
  );
}
