import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import { config } from '../src/config';
import { theme } from '../src/theme';
import { CurrencyProvider } from '../src/context/CurrencyContext';
import { ToastProvider } from '../src/context/ToastContext';

export default function RootLayout() {
  const publishableKey = config.clerkPublishableKey;

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
        </ToastProvider>
      </CurrencyProvider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <CurrencyProvider>
        <ToastProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              ...screenOptions,
              headerShown: false,
            }}
          />
        </ToastProvider>
      </CurrencyProvider>
    </ClerkProvider>
  );
}
