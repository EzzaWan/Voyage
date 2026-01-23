import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView, ScrollView, TextInput, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { useUser } from '@clerk/clerk-expo';
import { theme } from '../src/theme';
import { useToast } from '../src/context/ToastContext';

type OrderData = {
  id: string;
  planId?: string;
  amountCents: number;
  displayAmountCents?: number;
  displayCurrency?: string;
  currency: string;
  status: string;
  userEmail?: string;
};

type PromoDiscount = {
  percent: number;
  originalAmount: number;
  originalDisplayAmount: number;
};

type PlanDetails = {
  name: string;
  volume: number;
  packageCode: string;
  duration?: number;
  durationUnit?: string;
};

export default function Checkout() {
  const router = useRouter();
  const toast = useToast();
  const { user, isLoaded: userLoaded } = useUser();
  const params = useLocalSearchParams<{ orderId: string }>();
  
  // State
  const [order, setOrder] = useState<OrderData | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [updatingEmail, setUpdatingEmail] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<PromoDiscount | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  
  // Checkout step: 'summary' or 'payment'
  const [step, setStep] = useState<'summary' | 'payment'>('summary');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (params.orderId) {
      fetchOrder();
    } else {
      setError('Order ID is required');
      setLoading(false);
    }
  }, [params.orderId]);

  // Set email from logged-in user
  useEffect(() => {
    if (userLoaded && user?.primaryEmailAddress?.emailAddress) {
      setEmail(user.primaryEmailAddress.emailAddress);
    }
  }, [userLoaded, user]);

  async function fetchOrder() {
    try {
      setLoading(true);
      setError(null);
      
      const orderData = await apiFetch<OrderData>(`/orders/${params.orderId}`);
      setOrder(orderData);
      
      // Fetch plan details if planId exists
      if (orderData.planId) {
        try {
          const plan = await apiFetch<PlanDetails>(`/plans/${orderData.planId}`);
          setPlanDetails(plan);
        } catch (err) {
          console.warn('Failed to fetch plan details:', err);
        }
      }
      
      // Set email from order if available and user not logged in
      if (orderData.userEmail && !user?.primaryEmailAddress?.emailAddress) {
        setEmail(orderData.userEmail);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyPromo() {
    if (!promoCode.trim()) {
      toast.warning('Invalid Code', 'Please enter a promo code.');
      return;
    }

    if (appliedPromo) {
      toast.info('Promo Applied', 'You already have a promo code applied. Remove it first to apply a different one.');
      return;
    }

    setApplyingPromo(true);
    try {
      const result = await apiFetch<{
        valid: boolean;
        promoCode: string;
        discountPercent: number;
        originalAmount: number;
        originalDisplayAmount?: number;
        discountedAmount: number;
        displayAmount: number;
        displayCurrency: string;
      }>(
        `/orders/${params.orderId}/validate-promo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promoCode: promoCode.trim() }),
        }
      );

      if (result.valid) {
        const originalDisplayAmount = result.originalDisplayAmount || order?.displayAmountCents || order?.amountCents || 0;
        
        setAppliedPromo(result.promoCode);
        setPromoDiscount({
          percent: result.discountPercent,
          originalAmount: result.originalAmount,
          originalDisplayAmount: originalDisplayAmount,
        });
        
        // Update order with new amounts
        setOrder(prev => prev ? {
          ...prev,
          amountCents: result.discountedAmount,
          displayAmountCents: result.displayAmount,
          displayCurrency: result.displayCurrency,
        } : null);
        
        setPromoCode('');
        toast.success('Success', `${result.discountPercent}% discount applied!`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid promo code';
      toast.error('Invalid Code', errorMessage);
    } finally {
      setApplyingPromo(false);
    }
  }

  async function handleRemovePromo() {
    if (!appliedPromo || !promoDiscount) return;

    try {
      await apiFetch(
        `/orders/${params.orderId}/remove-promo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Restore original amounts
      setOrder(prev => prev && promoDiscount ? {
        ...prev,
        amountCents: promoDiscount.originalAmount,
        displayAmountCents: promoDiscount.originalDisplayAmount,
      } : prev);

      setAppliedPromo(null);
      setPromoDiscount(null);
      toast.success('Removed', 'Promo code removed and original price restored.');
    } catch (err) {
      // Still remove from UI even if backend call fails
      if (promoDiscount && order) {
        setOrder({
          ...order,
          amountCents: promoDiscount.originalAmount,
          displayAmountCents: promoDiscount.originalDisplayAmount,
        });
      }
      setAppliedPromo(null);
      setPromoDiscount(null);
    }
  }

  async function handleProceedToPayment() {
    // Validate email for guests
    if (!user && !email.trim()) {
      toast.warning('Email Required', 'Please enter your email address to receive your eSIM.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user && !emailRegex.test(email.trim())) {
      toast.warning('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setProcessing(true);
    try {
      // Update order email if guest user
      if (!user && email.trim()) {
        setUpdatingEmail(true);
        try {
          await apiFetch(
            `/orders/${params.orderId}/update-email`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim() }),
            }
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to update email';
          toast.error('Error', errorMessage);
          setUpdatingEmail(false);
          setProcessing(false);
          return;
        }
        setUpdatingEmail(false);
      }

      // Create Stripe checkout session
      const data = await apiFetch<{ url: string }>(
        `/orders/${params.orderId}/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      if (data.url) {
        setCheckoutUrl(data.url);
        setStep('payment');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start payment';
      toast.error('Payment Error', errorMessage);
      console.error('Error starting payment:', err);
    } finally {
      setProcessing(false);
    }
  }

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    
    const successMatch = url.match(/\/checkout\/success(?:\?|&)(?:[^&]*&)*session_id=([^&]+)/);
    
    if (successMatch && successMatch[1]) {
      const sessionId = successMatch[1];
      router.replace({
        pathname: '/order-success',
        params: {
          sessionId: sessionId,
        },
      });
    } else if (url.includes('/checkout/cancel') || url.includes(`/checkout/${params.orderId}`)) {
      setStep('summary');
      setCheckoutUrl(null);
    }
  };

  const formatPrice = (cents: number, currency?: string) => {
    const amount = cents / 100;
    const curr = currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr.toUpperCase(),
    }).format(amount);
  };

  const getDisplayName = () => {
    if (!planDetails) return order?.planId || 'Unknown Plan';
    
    let name = planDetails.name;
    
    // Check if it's an unlimited plan (2GB + FUP1Mbps)
    if (planDetails.volume !== -1) {
      const volumeGB = planDetails.volume / (1024 * 1024 * 1024);
      if (volumeGB >= 1.95 && volumeGB <= 2.05) {
        const nameLower = (planDetails.name || '').toLowerCase();
        const hasFUP = /\bfup(\d+)?mbps?\b/i.test(nameLower) || 
                      nameLower.includes('fup');
        if (hasFUP) {
          name = name
            .replace(/\b2gb\b/gi, 'Unlimited')
            .replace(/\b2\s*gb\b/gi, 'Unlimited')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
    }
    
    return name;
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Order Not Found</Text>
          <Text style={styles.errorText}>{error || 'Unable to load order details'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrder}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Payment step - Show Stripe WebView
  if (step === 'payment' && checkoutUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setStep('summary'); setCheckoutUrl(null); }} style={styles.backButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="chevron-back" size={18} color={theme.colors.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.backButton} />
        </View>
        <WebView
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webviewLoading}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </SafeAreaView>
    );
  }

  // Summary step - Show order review
  const displayAmount = order.displayAmountCents || order.amountCents;
  const displayCurrency = order.displayCurrency || order.currency;

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <Text style={[styles.progressText, styles.progressTextActive]}>Review</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot} />
            <Text style={styles.progressText}>Payment</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.progressDot} />
            <Text style={styles.progressText}>Complete</Text>
          </View>
        </View>

        {/* Order Review Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Review Your Order</Text>
          
          <View style={styles.orderInfoBox}>
            <Text style={styles.orderInfoLabel}>Order ID</Text>
            <Text style={styles.orderInfoValue}>{params.orderId}</Text>
          </View>
          
          <View style={styles.orderInfoBox}>
            <Text style={styles.orderInfoLabel}>Plan</Text>
            <Text style={styles.orderInfoValue}>{getDisplayName()}</Text>
          </View>
        </View>

        {/* Email Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Email Address</Text>
          
          {user?.primaryEmailAddress?.emailAddress ? (
            <View style={styles.emailDisplay}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textMuted} />
              <View>
                <Text style={styles.emailText}>{user.primaryEmailAddress.emailAddress}</Text>
                <Text style={styles.emailHint}>Your eSIM will be sent to this email</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.emailDescription}>
                Enter your email to receive your eSIM and order confirmation
              </Text>
              <TextInput
                style={styles.emailInput}
                placeholder="your.email@example.com"
                placeholderTextColor={theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!updatingEmail}
              />
            </>
          )}
        </View>

        {/* Promo Code Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Promo Code</Text>
          
          {appliedPromo ? (
            <View style={styles.appliedPromoContainer}>
              <View style={styles.appliedPromoInfo}>
                <Text style={styles.appliedPromoIcon}>🏷️</Text>
                <Text style={styles.appliedPromoCode}>{appliedPromo}</Text>
                <Text style={styles.appliedPromoDiscount}>-{promoDiscount?.percent}%</Text>
              </View>
              <TouchableOpacity
                style={styles.removePromoButton}
                onPress={handleRemovePromo}
                activeOpacity={0.7}
              >
                <Text style={styles.removePromoText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputContainer}>
              <TextInput
                style={styles.promoInput}
                placeholder="Enter promo code"
                placeholderTextColor={theme.colors.textMuted}
                value={promoCode}
                onChangeText={(text) => setPromoCode(text.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!applyingPromo}
              />
              <TouchableOpacity
                style={[
                  styles.applyPromoButton,
                  (!promoCode.trim() || applyingPromo) && styles.applyPromoButtonDisabled,
                ]}
                onPress={handleApplyPromo}
                disabled={!promoCode.trim() || applyingPromo}
                activeOpacity={0.85}
              >
                {applyingPromo ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text style={styles.applyPromoButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {promoDiscount 
                ? formatPrice(promoDiscount.originalDisplayAmount || promoDiscount.originalAmount, displayCurrency)
                : formatPrice(displayAmount, displayCurrency)
              }
            </Text>
          </View>
          
          {appliedPromo && promoDiscount && (
            <View style={styles.summaryRow}>
              <Text style={styles.discountLabel}>Discount ({appliedPromo})</Text>
              <Text style={styles.discountValue}>
                -{formatPrice(
                  (promoDiscount.originalDisplayAmount || promoDiscount.originalAmount) - displayAmount, 
                  displayCurrency
                )}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>Included</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(displayAmount, displayCurrency)}</Text>
          </View>
        </View>

        {/* Proceed to Payment Button */}
        <TouchableOpacity
          style={[
            styles.paymentButton,
            (processing || updatingEmail || order.status !== 'pending' || (!user && !email.trim())) && 
            styles.paymentButtonDisabled
          ]}
          onPress={handleProceedToPayment}
          disabled={processing || updatingEmail || order.status !== 'pending' || (!user && !email.trim())}
          activeOpacity={0.85}
        >
          {processing || updatingEmail ? (
            <View style={styles.paymentButtonContent}>
              <ActivityIndicator color={theme.colors.white} size="small" />
              <Text style={styles.paymentButtonText}>
                {updatingEmail ? 'Updating email...' : 'Processing...'}
              </Text>
            </View>
          ) : (
            <View style={styles.paymentButtonContent}>
              <Ionicons name="card-outline" size={20} color={theme.colors.white} />
              <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
            </View>
          )}
        </TouchableOpacity>

        {order.status !== 'pending' && (
          <Text style={styles.statusWarning}>
            This order has already been processed.
          </Text>
        )}

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={18} color={theme.colors.success} />
          <Text style={styles.securityText}>Secure payment powered by Stripe</Text>
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
  
  // Header
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    minHeight: 56,
  },
  backButton: {
    minWidth: 70,
    paddingVertical: theme.spacing.sm,
  },
  backButtonText: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
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
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
  
  // Scroll content
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  progressTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
    marginBottom: 16,
  },
  
  // Card
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  
  // Order Info
  orderInfoBox: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderInfoLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  orderInfoValue: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  
  // Email
  emailDescription: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  emailInput: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emailIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  emailText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  emailHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  
  // Promo Code
  promoInputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  applyPromoButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  applyPromoButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  applyPromoButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
  appliedPromoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  appliedPromoIcon: {
    fontSize: 16,
  },
  appliedPromoCode: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
  },
  appliedPromoDiscount: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  removePromoButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePromoText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  discountLabel: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
  discountValue: {
    ...theme.typography.body,
    color: theme.colors.primary,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  totalLabel: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  
  // Payment Button
  paymentButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: theme.spacing.md,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  paymentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  paymentButtonIcon: {
    fontSize: 20,
  },
  paymentButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  
  statusWarning: {
    ...theme.typography.small,
    color: theme.colors.warning,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  
  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  
  // WebView
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
