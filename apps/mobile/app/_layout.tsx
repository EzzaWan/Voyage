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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const publishableKey = config.clerkPublishableKey;
  
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

  if (!publishableKey) {
    console.warn('Clerk publishable key not configured');
    return (
      <CurrencyProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={screenOptions}
          />
          <FloatingChatButton />
        </ToastProvider>
      </CurrencyProvider>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey}
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
