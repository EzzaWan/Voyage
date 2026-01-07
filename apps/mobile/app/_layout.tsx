import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { config } from '../src/config';
import { theme } from '../src/theme';

export default function RootLayout() {
  const publishableKey = config.clerkPublishableKey;

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.background,
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: {
      fontWeight: '600',
    },
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
    headerShadowVisible: false, // Cleaner look
  };

  if (!publishableKey) {
    console.warn('Clerk publishable key not configured');
    return (
      <>
        <StatusBar style="light" />
        <Stack
          screenOptions={screenOptions}
        />
      </>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          ...screenOptions,
          headerTitle: 'Voyage',
        }}
      />
    </ClerkProvider>
  );
}
