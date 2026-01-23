import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Share, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '../src/api/client';
import BottomNav from '../src/components/BottomNav';
import { theme } from '../src/theme';

interface VCashBalance {
  balanceCents: number;
  currency: string;
}

interface VCashTransaction {
  id: string;
  type: 'credit' | 'debit';
  amountCents: number;
  reason: string;
  metadata?: any;
  createdAt: string;
}

export default function VCash() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const isLoaded = userLoaded && authLoaded;
  
  const [balance, setBalance] = useState<VCashBalance | null>(null);
  const [transactions, setTransactions] = useState<VCashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [loadingReferral, setLoadingReferral] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchData();
      fetchReferralCode();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchData = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      const [balanceData, transactionsData] = await Promise.all([
        apiFetch<VCashBalance>('/vcash', { headers: { 'x-user-email': userEmail } }),
        apiFetch<{ transactions: VCashTransaction[] }>('/vcash/transactions?page=1&pageSize=5', { headers: { 'x-user-email': userEmail } }),
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchReferralCode = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;
    
    try {
      setLoadingReferral(true);
      const userEmail = user.primaryEmailAddress.emailAddress;
      const data = await apiFetch<{ referralCode: string; referralLink: string }>('/affiliate/referral-code', {
        headers: { 'x-user-email': userEmail },
      });
      setReferralCode(data.referralCode);
      setReferralLink(data.referralLink);
    } catch (err) {
      console.error('Failed to fetch referral code:', err);
    } finally {
      setLoadingReferral(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBuyPlan = () => {
    router.push('/');
  };

  if (!isLoaded) return null;

  // Not signed in state - show informational page
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.infoContent}>
          <View style={styles.infoTopSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.infoTitle}>V-Cash Rewards</Text>
            <Text style={styles.infoDescription}>
              Store credit for your eSIM purchases. Earn through refunds, referrals, and special promotions.
            </Text>
          </View>

          <View style={styles.benefitsSection}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Instant checkout discounts</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>10% lifetime commission</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Automatic refund credits</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Full earning history</Text>
            </View>
          </View>

          <View style={styles.infoBottomSection}>
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
        <BottomNav activeTab="v-cash" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your V-Cash</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Balance Section */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>
            ${balance ? (balance.balanceCents / 100).toFixed(2) : '0.00'}
          </Text>
          <Text style={styles.balanceSubtitle}>
            You can use your credits at checkout to get a discount.
          </Text>
          
          <TouchableOpacity style={styles.buyButton} onPress={handleBuyPlan}>
            <Text style={styles.buyButtonText}>Buy data plan</Text>
          </TouchableOpacity>
        </View>

        {/* Affiliate Program Card */}
        {isSignedIn && (
          <View style={styles.referralCard}>
            <Text style={styles.referralTitle}>Voyage Affiliate Program</Text>
            <Text style={styles.referralText}>
              Earn 10% lifetime commission on all purchases made by users you refer. Share your unique referral code and start earning today!
            </Text>
            
            {loadingReferral ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: theme.spacing.md }} />
            ) : referralCode ? (
              <>
                <View style={styles.referralCodeContainer}>
                  <Text style={styles.referralCodeLabel}>Your referral code</Text>
                  <View style={styles.codeRow}>
                    <Text style={styles.codeText}>{referralCode}</Text> 
                    <TouchableOpacity onPress={() => {
                      if (referralLink) {
                        Clipboard.setStringAsync(referralLink);
                      }
                    }}>
                      <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={() => {
                    if (referralLink) {
                      Share.share({
                        message: `Use my referral code ${referralCode} to get eSIM data for your travels! ${referralLink}`,
                      });
                    }
                  }}
                >
                  <Text style={styles.shareButtonText}>Share code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={() => router.push('/affiliate')}
              >
                <Text style={styles.shareButtonText}>View Affiliate Dashboard</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Credits history</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No history yet.</Text>
            </View>
          ) : (
            transactions.map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <Text style={styles.txReason}>{tx.reason}</Text>
                <Text style={[
                  styles.txAmount, 
                  tx.type === 'credit' ? styles.textSuccess : styles.textError
                ]}>
                  {tx.type === 'credit' ? '+' : '-'}${ (tx.amountCents / 100).toFixed(2) }
                </Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
      <BottomNav activeTab="v-cash" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingBottom: 100,
    paddingTop: theme.spacing.sm, // Add top padding for breathing room
  },
  balanceContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  buyButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: 20, // Pill
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  referralCard: {
    backgroundColor: '#1E3A5F', // Slightly blue-er navy for "gradient" feel
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  referralTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  referralText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  referralCodeContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  referralCodeLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  copyIcon: {
    fontSize: 18,
    color: theme.colors.text,
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24, // Pill
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
  sectionContainer: {
    backgroundColor: 'rgba(30, 144, 255, 0.1)', // Light blue tint
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.md,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.backgroundLight,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.white,
  },
  submitButtonTextDisabled: {
    color: theme.colors.textMuted,
  },
  historyContainer: {
    marginTop: theme.spacing.sm,
  },
  emptyHistory: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyHistoryText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  txReason: {
    color: theme.colors.text,
    fontSize: 14,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  textSuccess: {
    color: theme.colors.success,
  },
  textError: {
    color: theme.colors.error,
  },
  // Info Content (Not signed in)
  infoContent: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: theme.spacing.xl,
    paddingBottom: 100, // Add space for bottom nav + button
    justifyContent: 'space-between',
  },
  infoTopSection: {
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
  infoTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  benefitsSection: {
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
    fontWeight: '500' as const,
  },
  infoBottomSection: {
    gap: theme.spacing.sm,
  },
  signInButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
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
    borderRadius: theme.borderRadius.lg,
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
});
