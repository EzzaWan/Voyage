import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';

interface AffiliateDashboard {
  affiliate: {
    id: string;
    referralCode: string;
    referralLink: string;
    totalCommission: number;
    isFrozen: boolean;
    createdAt: string;
  };
  stats: {
    totalCommission: number;
    totalReferrals: number;
    totalPurchases: number;
    totalCommissions: number;
  };
  remainingCommission: number;
  recentPurchases: Array<{
    type: 'order' | 'topup';
    id: string;
    userEmail: string;
    userName: string | null;
    amountCents: number;
    displayCurrency?: string | null;
    displayAmountCents?: number | null;
    status: string;
    createdAt: string;
  }>;
}

export default function Affiliate() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { convert, formatPrice } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDashboard();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchDashboard = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      const data = await apiFetch<AffiliateDashboard>('/affiliate/dashboard', {
        headers: { 'x-user-email': userEmail },
      });
      
      setDashboard({
        ...data,
        affiliate: data.affiliate || null,
        stats: data.stats || { totalCommission: 0, totalReferrals: 0, totalPurchases: 0, totalCommissions: 0 },
        remainingCommission: data.remainingCommission || 0,
        recentPurchases: Array.isArray(data.recentPurchases) ? data.recentPurchases : [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load affiliate dashboard';
      setError(errorMessage);
      console.error('Error fetching affiliate dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleCopyLink = async () => {
    if (!dashboard?.affiliate?.referralLink) return;
    
    try {
      await Clipboard.setStringAsync(dashboard.affiliate.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      Alert.alert('Error', 'Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!dashboard?.affiliate?.referralLink) return;
    
    try {
      await Share.share({
        message: `Use my referral code ${dashboard.affiliate.referralCode} to get eSIM data for your travels! ${dashboard.affiliate.referralLink}`,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleConvertToVCash = async () => {
    if (!user || !dashboard?.remainingCommission || dashboard.remainingCommission <= 0) return;
    
    Alert.alert(
      'Convert to V-Cash',
      `Convert ${formatPrice(convert(dashboard.remainingCommission / 100))} to V-Cash (store credit)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert All',
          onPress: async () => {
            setConverting(true);
            try {
              const userEmail = user.primaryEmailAddress?.emailAddress || '';
              await apiFetch('/affiliate/vcash/convert', {
                method: 'POST',
                headers: {
                  'x-user-email': userEmail,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ amountCents: dashboard.remainingCommission }),
              });
              
              Alert.alert('Success', 'Commission converted to V-Cash successfully!');
              fetchDashboard();
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to convert';
              Alert.alert('Error', errorMessage);
            } finally {
              setConverting(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (cents: number): string => {
    return formatPrice(convert(cents / 100));
  };

  // Not signed in state
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.signInCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💰</Text>
            </View>
            <Text style={styles.title}>Affiliate Program</Text>
            <Text style={styles.description}>
              Sign in to access your affiliate dashboard and earn 10% commission on all referrals.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading affiliate dashboard...</Text>
        </View>
      </View>
    );
  }

  // Error or no affiliate account
  if (error || !dashboard?.affiliate) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚀</Text>
          <Text style={styles.errorTitle}>Join Our Affiliate Program</Text>
          <Text style={styles.errorText}>
            Earn 10% lifetime commission on all purchases made by users you refer. Contact us to get started!
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push('/support')}
          >
            <Text style={styles.retryButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Affiliate Dashboard</Text>
          <Text style={styles.headerSubtitle}>Earn 10% lifetime commission</Text>
        </View>

        {/* Frozen Warning */}
        {dashboard.affiliate.isFrozen && (
          <View style={styles.frozenBanner}>
            <Text style={styles.frozenIcon}>⚠️</Text>
            <Text style={styles.frozenText}>
              Your affiliate account is frozen. Contact support for assistance.
            </Text>
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCurrency(dashboard.stats.totalCommission)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboard.stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Referrals</Text>
          </View>
        </View>

        {/* Referral Link Card */}
        <View style={styles.referralCard}>
          <Text style={styles.cardTitle}>Your Referral Link</Text>
          
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Code</Text>
            <Text style={styles.codeValue}>{dashboard.affiliate.referralCode}</Text>
          </View>

          <View style={styles.linkBox}>
            <Text style={styles.linkLabel}>Link</Text>
            <Text style={styles.linkValue} numberOfLines={2}>
              {dashboard.affiliate.referralLink}
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, copied && styles.actionButtonSuccess]}
              onPress={handleCopyLink}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {copied ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                      <Text>Copied!</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="copy-outline" size={16} color={theme.colors.text} />
                      <Text>Copy Link</Text>
                    </>
                  )}
                </View>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonSecondaryText}>📤 Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Convert to V-Cash */}
        {dashboard.remainingCommission > 0 && !dashboard.affiliate.isFrozen && (
          <View style={styles.convertCard}>
            <View style={styles.convertHeader}>
              <View>
                <Text style={styles.cardTitle}>Available Commission</Text>
                <Text style={styles.convertAmount}>
                  {formatCurrency(dashboard.remainingCommission)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.convertButton, converting && styles.convertButtonDisabled]}
              onPress={handleConvertToVCash}
              disabled={converting}
              activeOpacity={0.85}
            >
              {converting ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.convertButtonText}>Convert to V-Cash</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.convertHint}>
              V-Cash can be used as store credit for future purchases
            </Text>
            
            {/* Cash Payout Link */}
            <TouchableOpacity
              style={styles.payoutLink}
              onPress={() => router.push('/affiliate-payout')}
              activeOpacity={0.8}
            >
              <Text style={styles.payoutLinkText}>Or request cash payout →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Purchases */}
        <View style={styles.purchasesSection}>
          <Text style={styles.sectionTitle}>Recent Referral Purchases</Text>
          
          {dashboard.recentPurchases.length === 0 ? (
            <View style={styles.emptyPurchases}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No purchases yet from your referrals</Text>
              <Text style={styles.emptyHint}>Share your link to start earning!</Text>
            </View>
          ) : (
            <View style={styles.purchasesList}>
              {dashboard.recentPurchases.slice(0, 10).map((purchase) => (
                <View key={purchase.id} style={styles.purchaseItem}>
                  <View style={styles.purchaseLeft}>
                    <Text style={styles.purchaseUser}>
                      {purchase.userName || purchase.userEmail.split('@')[0]}
                    </Text>
                    <Text style={styles.purchaseDate}>{formatDate(purchase.createdAt)}</Text>
                  </View>
                  <View style={styles.purchaseRight}>
                    <Text style={styles.purchaseAmount}>
                      {formatCurrency(purchase.displayAmountCents || purchase.amountCents)}
                    </Text>
                    <Text style={styles.purchaseCommission}>
                      +{formatCurrency(Math.round((purchase.displayAmountCents || purchase.amountCents) * 0.1))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
    paddingBottom: theme.spacing.md,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Error/Join
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
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
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.h2,
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
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  },
  
  // Header
  header: {
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Frozen Banner
  frozenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: theme.spacing.sm,
  },
  frozenIcon: {
    fontSize: 20,
  },
  frozenText: {
    flex: 1,
    ...theme.typography.small,
    color: '#ef4444',
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  
  // Referral Card
  referralCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  codeBox: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  codeLabel: {
    ...theme.typography.tiny,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  linkBox: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  linkLabel: {
    ...theme.typography.tiny,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  linkValue: {
    ...theme.typography.small,
    color: theme.colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  actionButtonSuccess: {
    backgroundColor: '#22c55e',
  },
  actionButtonText: {
    color: theme.colors.white,
    ...theme.typography.bodyMedium,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonSecondaryText: {
    color: theme.colors.text,
    ...theme.typography.bodyMedium,
  },
  
  // Convert Card
  convertCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  convertHeader: {
    marginBottom: theme.spacing.md,
  },
  convertAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  convertButton: {
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
  convertButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  convertButtonText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  },
  convertHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  payoutLink: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  payoutLinkText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.primary,
  },
  
  // Purchases Section
  purchasesSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyPurchases: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  emptyHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  purchasesList: {
    gap: theme.spacing.sm,
  },
  purchaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  purchaseLeft: {
    flex: 1,
  },
  purchaseUser: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  purchaseDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  purchaseRight: {
    alignItems: 'flex-end',
  },
  purchaseAmount: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: 2,
  },
  purchaseCommission: {
    ...theme.typography.small,
    color: '#22c55e',
    fontWeight: '600',
  },
});

