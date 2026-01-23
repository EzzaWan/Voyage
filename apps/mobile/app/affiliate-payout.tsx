import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';
import { useToast } from '../src/context/ToastContext';

type TabKey = 'request' | 'method' | 'history';

interface PayoutMethod {
  type: 'paypal' | 'bank';
  paypalEmail?: string;
  bankHolderName?: string;
  bankIban?: string;
  bankSwift?: string;
}

interface PayoutRequest {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

interface DashboardData {
  balances?: {
    availableBalance: number;
  };
  payoutMethod?: PayoutMethod;
}

const MIN_PAYOUT = 2000; // $20 minimum in cents

export default function AffiliatePayout() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { convert, formatPrice } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [activeTab, setActiveTab] = useState<TabKey>('request');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dashboard data
  const [availableBalance, setAvailableBalance] = useState(0);
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod | null>(null);
  const [history, setHistory] = useState<PayoutRequest[]>([]);
  
  // Request form
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Method form
  const [methodType, setMethodType] = useState<'paypal' | 'bank'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [savingMethod, setSavingMethod] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      fetchData();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchData = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      // Fetch dashboard data
      const dashboard = await apiFetch<DashboardData>('/affiliate/dashboard', {
        headers: { 'x-user-email': userEmail },
      });
      
      setAvailableBalance(dashboard.balances?.availableBalance || 0);
      
      if (dashboard.payoutMethod) {
        setPayoutMethod(dashboard.payoutMethod);
        setMethodType(dashboard.payoutMethod.type);
        if (dashboard.payoutMethod.type === 'paypal') {
          setPaypalEmail(dashboard.payoutMethod.paypalEmail || '');
        } else {
          setBankHolderName(dashboard.payoutMethod.bankHolderName || '');
          setBankIban(dashboard.payoutMethod.bankIban || '');
          setBankSwift(dashboard.payoutMethod.bankSwift || '');
        }
      }

      // Fetch history
      try {
        const historyData = await apiFetch<{ history: PayoutRequest[] }>('/affiliate/payout/history', {
          headers: { 'x-user-email': userEmail },
        });
        setHistory(historyData.history || []);
      } catch {
        // History might fail if no payouts yet
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to fetch affiliate data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatCurrency = (cents: number): string => {
    return formatPrice(convert(cents / 100));
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSubmitRequest = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    const amountCents = Math.round(parseFloat(amount) * 100);
    
    if (isNaN(amountCents) || amountCents < MIN_PAYOUT) {
      toast.warning('Error', `Minimum payout is ${formatCurrency(MIN_PAYOUT)}`);
      return;
    }

    if (amountCents > availableBalance) {
      toast.warning('Error', 'Requested amount exceeds available balance');
      return;
    }

    setSubmitting(true);
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      await apiFetch('/affiliate/payout/request', {
        method: 'POST',
        headers: {
          'x-user-email': userEmail,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amountCents }),
      });

      toast.success('Success', 'Payout request submitted successfully');
      setAmount('');
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit request';
      toast.error('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMethod = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    if (methodType === 'paypal' && !paypalEmail.trim()) {
      toast.warning('Error', 'PayPal email is required');
      return;
    }

    if (methodType === 'bank' && (!bankHolderName.trim() || !bankIban.trim())) {
      toast.warning('Error', 'Account holder name and IBAN are required');
      return;
    }

    setSavingMethod(true);
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      const requestBody: Record<string, string> = { type: methodType };
      
      if (methodType === 'paypal') {
        requestBody.paypalEmail = paypalEmail.trim();
      } else {
        requestBody.bankHolderName = bankHolderName.trim();
        requestBody.bankIban = bankIban.trim();
        if (bankSwift.trim()) {
          requestBody.bankSwift = bankSwift.trim();
        }
      }

      await apiFetch('/affiliate/payout/method', {
        method: 'POST',
        headers: {
          'x-user-email': userEmail,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      toast.success('Success', 'Payout method saved successfully');
      fetchData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save method';
      toast.error('Error', errorMessage);
    } finally {
      setSavingMethod(false);
    }
  };

  const getStatusColor = (status: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
      approved: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
      declined: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
      paid: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
    };
    return colors[status] || { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' };
  };

  // Not signed in
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.signInCard}>
            <Ionicons name="wallet" size={40} color={theme.colors.primary} />
            <Text style={styles.title}>Affiliate Payouts</Text>
            <Text style={styles.description}>
              Sign in to request payouts and manage your payout methods.
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

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading payout info...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabBar}>
        {([
          { key: 'request', label: 'Request' },
          { key: 'method', label: 'Method' },
          { key: 'history', label: 'History' },
        ] as { key: TabKey; label: string }[]).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
        {/* Request Tab */}
        {activeTab === 'request' && (
          <View>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
              {payoutMethod && (
                <Text style={styles.balanceMethod}>
                  Payout to: {payoutMethod.type === 'paypal' ? `PayPal (${payoutMethod.paypalEmail})` : `Bank (${payoutMethod.bankHolderName})`}
                </Text>
              )}
              <Text style={styles.balanceMin}>Minimum payout: {formatCurrency(MIN_PAYOUT)}</Text>
            </View>

            {!payoutMethod ? (
              <View style={styles.card}>
                <Text style={styles.cardText}>You need to add a payout method first.</Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setActiveTab('method')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Add Payout Method</Text>
                </TouchableOpacity>
              </View>
            ) : availableBalance < MIN_PAYOUT ? (
              <View style={styles.card}>
                <Text style={styles.cardText}>
                  You need {formatCurrency(MIN_PAYOUT - availableBalance)} more to request a payout.
                </Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Request Payout</Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount ($) *</Text>
                  <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="20.00"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.inputHint}>
                    Enter amount between {formatCurrency(MIN_PAYOUT)} and {formatCurrency(availableBalance)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, submitting && styles.buttonDisabled]}
                  onPress={handleSubmitRequest}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Method Tab */}
        {activeTab === 'method' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {payoutMethod ? 'Update' : 'Add'} Payout Method
            </Text>

            {/* Method Type Selector */}
            <View style={styles.methodTypeContainer}>
              <TouchableOpacity
                style={[styles.methodTypeButton, methodType === 'paypal' && styles.methodTypeButtonActive]}
                onPress={() => setMethodType('paypal')}
                activeOpacity={0.8}
              >
                <Text style={[styles.methodTypeText, methodType === 'paypal' && styles.methodTypeTextActive]}>
                  PayPal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodTypeButton, methodType === 'bank' && styles.methodTypeButtonActive]}
                onPress={() => setMethodType('bank')}
                activeOpacity={0.8}
              >
                <Text style={[styles.methodTypeText, methodType === 'bank' && styles.methodTypeTextActive]}>
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>

            {methodType === 'paypal' ? (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PayPal Email *</Text>
                <TextInput
                  style={styles.input}
                  value={paypalEmail}
                  onChangeText={setPaypalEmail}
                  placeholder="your.email@example.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Account Holder Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={bankHolderName}
                    onChangeText={setBankHolderName}
                    placeholder="John Doe"
                    placeholderTextColor={theme.colors.textMuted}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>IBAN *</Text>
                  <TextInput
                    style={[styles.input, styles.inputMono]}
                    value={bankIban}
                    onChangeText={(text) => setBankIban(text.toUpperCase())}
                    placeholder="GB82WEST12345698765432"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>SWIFT/BIC (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.inputMono]}
                    value={bankSwift}
                    onChangeText={(text) => setBankSwift(text.toUpperCase())}
                    placeholder="WESTGB22"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="characters"
                  />
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, savingMethod && styles.buttonDisabled]}
              onPress={handleSaveMethod}
              disabled={savingMethod}
              activeOpacity={0.85}
            >
              {savingMethod ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {payoutMethod ? 'Update Method' : 'Save Method'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payout History</Text>
            
            {history.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
                <Text style={styles.emptyText}>No payout requests yet</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.map((payout) => {
                  const statusColor = getStatusColor(payout.status);
                  return (
                    <View key={payout.id} style={styles.historyItem}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyAmount}>{formatCurrency(payout.amountCents)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                          <Text style={[styles.statusText, { color: statusColor.text }]}>
                            {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyDate}>Requested: {formatDate(payout.createdAt)}</Text>
                        {payout.processedAt && (
                          <Text style={styles.historyDate}>Processed: {formatDate(payout.processedAt)}</Text>
                        )}
                      </View>
                      {payout.adminNote && (
                        <Text style={styles.historyNote}>Note: {payout.adminNote}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

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
  centerContent: {
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
  
  // Sign In
  signInCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
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
    ...theme.typography.body, fontWeight: '600' as const,
  },
  
  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  
  // Balance Card
  balanceCard: {
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  balanceLabel: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  balanceMethod: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  balanceMin: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  
  // Card
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  cardText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  
  // Input
  inputContainer: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  inputMono: {
    fontFamily: 'monospace',
  },
  inputHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  
  // Method Type
  methodTypeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  methodTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  methodTypeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  methodTypeText: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.textSecondary,
  },
  methodTypeTextActive: {
    color: theme.colors.white,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
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
  buttonDisabled: {
    backgroundColor: theme.colors.border,
  },
  
  // History
  historyList: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyAmount: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  statusText: {
    ...theme.typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  historyDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  historyNote: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});




