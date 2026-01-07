import { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { theme } from '../../src/theme';

type SignInState = 'initial' | 'second_factor';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<SignInState>('initial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignInPress = async () => {
    if (!isLoaded) {
      return;
    }

    if (!emailAddress || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.replace('/');
        return;
      }

      if (result.status === 'needs_second_factor') {
        const strategies = signIn.supportedSecondFactors || [];
        const emailCodeStrategy = strategies.find(s => s.strategy === 'email_code');
        
        if (emailCodeStrategy) {
          try {
            await signIn.prepareSecondFactor({ strategy: 'email_code' });
          } catch (prepareErr: any) {
            console.error('[SignIn] Failed to prepare email_code:', prepareErr);
          }
        }
        
        setState('second_factor');
        setError(null);
        return;
      }

      setError('Sign in incomplete. Please check your email for verification or contact support.');
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'An error occurred during sign in';
      setError(errorMessage);
      console.error('Sign in error:', err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back to Voyage</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {state === 'initial' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={emailAddress}
                onChangeText={(text) => {
                  setEmailAddress(text);
                  setError(null);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoCorrect={false}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onSignInPress}
                disabled={loading || !isLoaded}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.verificationText}>
                Two-factor authentication required
              </Text>
              <Text style={styles.verificationSubtext}>
                Enter the verification code sent to your email.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Verification Code"
                placeholderTextColor={theme.colors.textSecondary}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setError(null);
                }}
                autoCapitalize="none"
                keyboardType="number-pad"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={async () => {
                  if (!isLoaded || !code) {
                    setError('Please enter the verification code');
                    return;
                  }

                  try {
                    setLoading(true);
                    setError(null);

                    const availableStrategies = signIn.supportedSecondFactors || [];
                    const emailCodeStrategy = availableStrategies.find(s => s.strategy === 'email_code');
                    const strategy = emailCodeStrategy?.strategy || availableStrategies[0]?.strategy || 'email_code';

                    const result = await signIn.attemptSecondFactor({
                      strategy: strategy as any,
                      code: code.trim(),
                    });

                    if (result.status === 'complete' && result.createdSessionId) {
                      await setActive({ session: result.createdSessionId });
                      router.replace('/');
                    } else {
                      setError('Verification failed. Please check your code and try again.');
                    }
                  } catch (err: any) {
                    const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed';
                    setError(errorMessage);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !isLoaded}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Verify</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setState('initial');
                  setCode('');
                  setError(null);
                }}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {state === 'initial' && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>No account yet?</Text>
            <Link href="/(auth)/sign-up" style={styles.link}>
              Sign up
            </Link>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    fontSize: 16,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: theme.colors.errorBackground,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  verificationText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  verificationSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
