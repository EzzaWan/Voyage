import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSignIn, useOAuth, useSignInWithApple } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { theme } from '../../src/theme';

type SignInState = 'initial' | 'second_factor';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startAppleAuthenticationFlow } = useSignInWithApple();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [state, setState] = useState<SignInState>('initial');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSignInPress = async () => {
    if (!isLoaded) return;

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

  const onVerifyPress = async () => {
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
  };

  const onGooglePress = async () => {
    try {
      setOauthLoading('google');
      setError(null);

      // Clerk Expo automatically uses the app's custom URL scheme for OAuth
      // The redirect URL is handled automatically based on app.config.ts scheme
      const { createdSessionId, setActive: setActiveFromOAuth } = await startGoogleOAuth();

      if (createdSessionId && setActiveFromOAuth) {
        await setActiveFromOAuth({ session: createdSessionId });
        router.replace('/');
      } else if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        const errorMessage = err.errors[0]?.longMessage || err.errors[0]?.message || 'Google sign-in failed';
        setError(errorMessage);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const onApplePress = async () => {
    try {
      setOauthLoading('apple');
      setError(null);

      const { createdSessionId, setActive: setActiveFromOAuth } = await startAppleAuthenticationFlow();

      if (createdSessionId && setActiveFromOAuth) {
        await setActiveFromOAuth({ session: createdSessionId });
        router.replace('/');
        return;
      }

      if (!createdSessionId) {
        setError('Apple sign-in did not complete. Please try again.');
      }
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED' || err?.code === 'ERR_CANCELED') {
        setError(null);
      } else if (err?.errors?.length > 0) {
        const msg = err.errors[0]?.longMessage || err.errors[0]?.message || 'Apple sign-in failed';
        setError(msg);
      } else {
        setError(err?.message || 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="airplane" size={36} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your Voyo account</Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={48} color={theme.colors.warning} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {state === 'initial' ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={theme.colors.textMuted}
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
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={theme.colors.textMuted}
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
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={onSignInPress}
                  disabled={loading || !isLoaded}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Login Buttons */}
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton, oauthLoading === 'google' && styles.socialButtonDisabled]}
                  onPress={onGooglePress}
                  disabled={oauthLoading !== null || !isLoaded}
                  activeOpacity={0.85}
                >
                  {oauthLoading === 'google' ? (
                    <ActivityIndicator color="#4285F4" />
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                      <Text style={styles.socialButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  oauthLoading === 'apple' ? (
                    <View style={styles.appleButtonLoading}>
                      <ActivityIndicator color={theme.colors.white} />
                    </View>
                  ) : (
                    <AppleAuthentication.AppleAuthenticationButton
                      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                      cornerRadius={theme.borderRadius.md}
                      style={styles.appleAuthButton}
                      onPress={onApplePress}
                    />
                  )
                )}
              </>
            ) : (
              <>
                <View style={styles.verificationHeader}>
                  <View style={styles.verificationIconContainer}>
                    <Ionicons name="lock-closed" size={28} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.verificationTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.verificationSubtitle}>
                    Enter the verification code sent to your email
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, styles.codeInput]}
                      placeholder="000000"
                      placeholderTextColor={theme.colors.textMuted}
                      value={code}
                      onChangeText={(text) => {
                        setCode(text);
                        setError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="number-pad"
                      autoCorrect={false}
                      maxLength={6}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={onVerifyPress}
                  disabled={loading || !isLoaded}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setState('initial');
                    setCode('');
                    setError(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="chevron-back" size={16} color={theme.colors.textMuted} />
                    <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer */}
          {state === 'initial' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.footerLink}>Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorBackground,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
    flex: 1,
  },
  
  // Form
  form: {
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.caption, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 16,
    minHeight: 56,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: 8,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: theme.spacing.sm,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  primaryButtonText: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.white,
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    ...theme.typography.caption, fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  
  // Verification
  verificationHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  verificationIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  verificationTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  verificationSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    ...theme.typography.caption, fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Social Buttons
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 56,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  googleButton: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.border,
  },
  appleAuthButton: {
    width: '100%',
    minHeight: 56,
    marginBottom: theme.spacing.sm,
  },
  appleButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#000000',
    marginBottom: theme.spacing.sm,
  },
  socialButtonText: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: '#1F2937', // Dark gray for Google button text
  },
});
