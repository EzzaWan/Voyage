import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { config } from '../src/config';
import { theme } from '../src/theme';
import { CurrencyProvider } from '../src/context/CurrencyContext';

export default function RootLayout() {
  const publishableKey = config.clerkPublishableKey;

  const screenOptions = {
    headerStyle: {
      backgroundColor: theme.colors.background,
      height: 44, // Reduced header height for tighter spacing
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: {
      fontWeight: '600' as const,
      fontSize: 18, // Slightly smaller header title
    },
    contentStyle: {
      backgroundColor: theme.colors.background,
    },
    headerShadowVisible: false,
    animation: 'none' as const,
  };

  if (!publishableKey) {
    console.warn('Clerk publishable key not configured');
    return (
      <CurrencyProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={screenOptions}
        />
      </CurrencyProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <CurrencyProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            ...screenOptions,
            headerTitle: 'Voyage',
          }}
        />
      </CurrencyProvider>
    </ClerkProvider>
  );
}
