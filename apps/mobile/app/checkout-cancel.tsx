import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';
import { AnimatedButton } from '../src/components/AnimatedButton';
import { FadeInView } from '../src/components/FadeInView';

export default function CheckoutCancel() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <FadeInView duration={200}>
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✕</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Payment Cancelled</Text>

          {/* Description */}
          <Text style={styles.description}>
            Your payment was cancelled. You have not been charged. You can try again whenever you're ready.
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <AnimatedButton
              style={styles.primaryButton}
              onPress={() => router.push('/countries')}
            >
              <Text style={styles.primaryButtonText}>Browse eSIMs</Text>
            </AnimatedButton>

            <AnimatedButton
              style={styles.secondaryButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.secondaryButtonText}>Return Home</Text>
            </AnimatedButton>
          </View>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Having trouble with checkout?{' '}
            <Text 
              style={styles.helpLink}
              onPress={() => router.push('/contact')}
            >
              Contact support
            </Text>
          </Text>
        </View>
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  
  // Icon
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 36,
    color: '#ef4444',
    fontWeight: '700',
  },
  
  // Text
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  
  // Actions
  actions: {
    width: '100%',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '600' as const,
  },
  secondaryButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    ...theme.typography.body, fontWeight: '500' as const,
  },
  
  // Help
  helpText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  helpLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});




