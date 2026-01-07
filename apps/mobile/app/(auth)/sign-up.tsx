import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { theme } from '../../src/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignUpPress = async () => {
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

      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'An error occurred during sign up';
      setError(errorMessage);
      console.error('Sign up error:', err.errors);
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    if (!code) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      await setActive({ session: completeSignUp.createdSessionId });
      router.replace('/');
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'An error occurred during verification';
      setError(errorMessage);
      console.error('Verification error:', err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Create your Voyage account</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          {!pendingVerification ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={theme.colors.textSecondary}
                value={emailAddress}
                onChangeText={setEmailAddress}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onSignUpPress}
                disabled={loading || !isLoaded}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.verificationText}>
                Check your email for the verification code
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Verification Code"
                placeholderTextColor={theme.colors.textSecondary}
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={onPressVerify}
                disabled={loading || !isLoaded}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {!pendingVerification && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/(auth)/sign-in" style={styles.link}>
              Sign in
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
    fontWeight: 'bold',
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
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
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
