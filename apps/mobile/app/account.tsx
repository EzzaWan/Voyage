import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';
import { RecentlyViewed } from '../src/components/RecentlyViewed';

interface VCashBalance {
  balanceCents: number;
  currency: string;
}

interface QuickLink {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
  accent?: boolean;
}

export default function Account() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { convert, formatPrice } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [vcashBalance, setVcashBalance] = useState<VCashBalance | null>(null);
  const [loadingVCash, setLoadingVCash] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      fetchVCash();
    } else if (isLoaded && !isSignedIn) {
      setLoadingVCash(false);
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchVCash = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      const data = await apiFetch<VCashBalance>('/vcash', {
        headers: { 'x-user-email': userEmail },
      });
      setVcashBalance(data);
    } catch (error) {
      console.error('Failed to fetch V-Cash balance:', error);
    } finally {
      setLoadingVCash(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVCash();
  };

  const formatCurrency = (cents: number) => {
    return formatPrice(convert(cents / 100));
  };

  const quickLinks: QuickLink[] = [
    {
      id: 'my-esims',
      icon: 'phone-portrait-outline' as keyof typeof Ionicons.glyphMap,
      title: 'My eSIMs',
      description: 'View and manage your purchased eSIMs',
      route: '/my-esims',
    },
    {
      id: 'orders',
      icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
      title: 'Order History',
      description: 'View your past orders',
      route: '/orders',
    },
    {
      id: 'affiliate',
      icon: '💸',
      title: 'Affiliate Program',
      description: 'Earn 10% commission on referrals',
      route: '/affiliate',
      accent: true,
    },
    {
      id: 'support-tickets',
      icon: '📩',
      title: 'Support Tickets',
      description: 'View your support conversations',
      route: '/my-tickets',
    },
  ];

  // Not signed in state
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.signInCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
            <Text style={styles.title}>Account</Text>
            <Text style={styles.description}>
              Sign in to view your account dashboard, V-Cash balance, and manage your eSIMs.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.8}
            >
              <Text style={styles.signUpButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.firstName || 'Traveler'}
          </Text>
        </View>

        {/* V-Cash Card */}
        <TouchableOpacity
          style={styles.vcashCard}
          onPress={() => router.push('/v-cash')}
          activeOpacity={0.85}
        >
          <View style={styles.vcashHeader}>
            <View style={styles.vcashIcon}>
              <Text style={styles.vcashIconText}>💰</Text>
            </View>
            <View style={styles.vcashInfo}>
              <Text style={styles.vcashLabel}>V-Cash Balance</Text>
              {loadingVCash ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.vcashAmount}>
                  {vcashBalance ? formatCurrency(vcashBalance.balanceCents) : '$0.00'}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.vcashHint}>
            Store credit for Voyage purchases. Earn from refunds or affiliate earnings.
          </Text>
        </TouchableOpacity>

        {/* Quick Links */}
        <View style={styles.quickLinksSection}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link) => (
              <TouchableOpacity
                key={link.id}
                style={[styles.quickLinkCard, link.accent && styles.quickLinkCardAccent]}
                onPress={() => router.push(link.route as any)}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={link.icon as keyof typeof Ionicons.glyphMap} 
                  size={32} 
                  color={link.accent ? theme.colors.white : theme.colors.primary} 
                />
                <Text style={[styles.quickLinkTitle, link.accent && styles.quickLinkTitleAccent]}>
                  {link.title}
                </Text>
                <Text style={styles.quickLinkDescription} numberOfLines={2}>
                  {link.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/contact')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Contact Support</Text>
              <Text style={styles.actionSubtitle}>Get help from our team</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/countries')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionIcon}>🛒</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Continue Shopping</Text>
              <Text style={styles.actionSubtitle}>Browse eSIM plans</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Recently Viewed */}
        <View style={styles.recentlyViewedSection}>
          <RecentlyViewed maxItems={6} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  
  // Sign In Card
  signInCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: (theme.colors as any).primaryMuted || theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  signInButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  signUpButton: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  signUpButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  
  // Header
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: theme.colors.text,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  
  // V-Cash Card
  vcashCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  vcashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  vcashIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: (theme.colors as any).primaryMuted || theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  vcashIconText: {
    fontSize: 24,
  },
  vcashInfo: {
    flex: 1,
  },
  vcashLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  vcashAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  vcashArrow: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  vcashHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  
  // Quick Links
  quickLinksSection: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  quickLinkCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 110,
  },
  quickLinkCardAccent: {
    backgroundColor: (theme.colors as any).primaryMuted || theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  quickLinkIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  quickLinkTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    color: theme.colors.text,
    marginBottom: 4,
  },
  quickLinkTitleAccent: {
    color: theme.colors.primary,
  },
  quickLinkDescription: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  
  // Actions
  actionsSection: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
    color: theme.colors.text,
  },
  actionSubtitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  actionArrow: {
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  
  // Recently Viewed
  recentlyViewedSection: {
    marginBottom: theme.spacing.lg,
  },
});




