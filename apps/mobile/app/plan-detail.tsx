import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, TextInput, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { useUser } from '@clerk/clerk-expo';
import { theme } from '../src/theme';
import { PriceComparison } from '../src/components/PriceComparison';
import { SharePlanButton } from '../src/components/ShareButton';
import { useCurrency } from '../src/context/CurrencyContext';
import { AnimatedButton } from '../src/components/AnimatedButton';
import { FadeInView } from '../src/components/FadeInView';
import { useToast } from '../src/context/ToastContext';
import {
  Plan,
  calculateGB,
  formatDataSize,
  formatValidity,
  isDailyUnlimitedPlan,
  getDisplayName,
  getDisplayDataSize,
} from '../src/utils/planUtils';

// Global icon for global plans
const globalIcon = require('../assets/regions/global.png');

type OrderResponse = {
  orderId: string;
  [key: string]: any;
};

// Get network operator for a country
const getNetworkOperator = (locationCode?: string) => {
  if (!locationCode) return "Best Available Network";
  
  const code = locationCode.split('-')[0].toUpperCase();
  const operators: Record<string, string> = {
    'US': 'AT&T / T-Mobile',
    'GB': 'O2 / Three / Vodafone',
    'FR': 'Orange / Bouygues / SFR',
    'DE': 'Telekom / Vodafone / O2',
    'ES': 'Movistar / Orange / Vodafone',
    'IT': 'TIM / Vodafone / Wind Tre',
    'JP': 'Softbank / KDDI / Docomo',
    'KR': 'SK Telecom / KT / LG U+',
    'CN': 'China Unicom / China Mobile',
    'HK': 'CSL / SmartTone / 3HK',
    'TW': 'Chunghwa / Taiwan Mobile',
    'SG': 'Singtel / Starhub / M1',
    'MY': 'Celcom / Digi / Maxis',
    'TH': 'AIS / DTAC / TrueMove',
    'ID': 'Telkomsel / XL Axiata',
    'VN': 'Viettel / Vinaphone',
    'PH': 'Globe / Smart',
    'AU': 'Telstra / Optus / Vodafone',
    'NZ': 'Spark / One NZ',
    'CA': 'Rogers / Bell / Telus',
    'TR': 'Turkcell / Vodafone / Turk Telekom',
    'AE': 'Etisalat / Du',
    'SA': 'STC / Mobily',
    'PL': 'Plus / Orange / Play / T-Mobile',
  };
  return operators[code] || "Best Available Network";
};

// Get country name from code
const getCountryName = (code?: string): string => {
  if (!code) return 'Unknown';
  
  const countryNames: Record<string, string> = {
    'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'ES': 'Spain', 'IT': 'Italy', 'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China',
    'HK': 'Hong Kong', 'TW': 'Taiwan', 'SG': 'Singapore', 'MY': 'Malaysia',
    'TH': 'Thailand', 'ID': 'Indonesia', 'VN': 'Vietnam', 'PH': 'Philippines',
    'AU': 'Australia', 'NZ': 'New Zealand', 'CA': 'Canada', 'TR': 'Turkey',
    'AE': 'UAE', 'SA': 'Saudi Arabia', 'PL': 'Poland', 'NL': 'Netherlands',
    'BE': 'Belgium', 'AT': 'Austria', 'CH': 'Switzerland', 'PT': 'Portugal',
    'GR': 'Greece', 'CZ': 'Czech Republic', 'SE': 'Sweden', 'NO': 'Norway',
    'DK': 'Denmark', 'FI': 'Finland', 'IE': 'Ireland', 'IN': 'India',
    'BR': 'Brazil', 'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile',
  };
  
  const upperCode = code.split('-')[0].toUpperCase();
  return countryNames[upperCode] || code.toUpperCase();
};

export default function PlanDetail() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useUser();
  const { convert, formatPrice } = useCurrency();
  const params = useLocalSearchParams<{
    planId: string;
    countryName?: string;
  }>();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // For unlimited plans - day selection
  const [selectedDays, setSelectedDays] = useState<number>(1);

  useEffect(() => {
    if (params.planId) {
      fetchPlan();
    } else {
      setError('Plan ID is required');
      setLoading(false);
    }
  }, [params.planId]);

  async function fetchPlan() {
    try {
      setLoading(true);
      setError(null);
      const planData = await apiFetch<Plan>(`/plans/${params.planId}`);
      setPlan(planData);
      
      // Set initial selected days from plan duration
      if (planData.duration) {
        setSelectedDays(planData.duration);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load plan';
      setError(errorMessage);
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  }

  const isUnlimited = useMemo(() => {
    if (!plan) return false;
    return isDailyUnlimitedPlan(plan);
  }, [plan]);

  // Check if this is a global plan
  const isGlobalPlan = useMemo(() => {
    if (!plan?.location) return false;
    const loc = plan.location.toUpperCase();
    return loc.startsWith('GL-') || loc === 'GL-139' || params.countryName === 'Global';
  }, [plan, params.countryName]);

  const displayName = useMemo(() => {
    if (!plan) return '';
    
    // For global plans, format as "Data Size Duration" (e.g., "1 GB 7 Days")
    if (isGlobalPlan) {
      const dataSize = getDisplayDataSize(plan);
      const duration = formatValidity(plan.duration, plan.durationUnit);
      return `${dataSize} ${duration}`;
    }
    
    return getDisplayName(plan);
  }, [plan, isGlobalPlan]);

  const displayDataSize = useMemo(() => {
    if (!plan) return '';
    return getDisplayDataSize(plan);
  }, [plan]);

  const locationCode = useMemo(() => {
    if (!plan?.location) return '';
    return plan.location.split(',')[0].trim().toUpperCase();
  }, [plan]);

  // Calculate price for unlimited plans (daily price × selected days)
  const dailyPrice = useMemo(() => {
    if (!plan) return 0;
    return plan.price; // For unlimited plans, plan.price is the daily price
  }, [plan]);

  const totalPrice = useMemo(() => {
    if (!plan) return 0;
    if (isUnlimited) {
      return dailyPrice * selectedDays;
    }
    return plan.price;
  }, [plan, isUnlimited, dailyPrice, selectedDays]);

  const getFlagUrl = () => {
    if (!locationCode) return '';
    return `https://flagcdn.com/w160/${locationCode.toLowerCase()}.png`;
  };

  const handleDaysChange = (text: string) => {
    const num = parseInt(text) || 1;
    // Clamp between 1 and 365
    const clamped = Math.max(1, Math.min(365, num));
    setSelectedDays(clamped);
  };

  const adjustDays = (delta: number) => {
    setSelectedDays(prev => Math.max(1, Math.min(365, prev + delta)));
  };

  const handleCompleteOrder = async () => {
    if (!plan?.packageCode) {
      toast.error('Error', 'Plan code is missing');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const orderBody: {
        planCode: string;
        amount: number;
        currency: string;
        planName: string;
        paymentMethod: string;
        email?: string;
        duration?: number;
      } = {
        planCode: plan.packageCode,
        amount: totalPrice,
        currency: 'USD',
        planName: plan.name,
        paymentMethod: 'stripe',
      };

      if (userEmail) {
        orderBody.email = userEmail;
      }

      // For unlimited plans, pass the selected duration
      if (isUnlimited) {
        orderBody.duration = selectedDays;
      }

      const order = await apiFetch<OrderResponse>('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderBody),
      });

      if (order.orderId) {
        // Navigate to checkout page (order summary before Stripe)
        router.push({
          pathname: '/checkout',
          params: {
            orderId: order.orderId,
          },
        });
      } else {
        throw new Error('Order ID not returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      toast.error('Error', errorMessage);
      console.error('Error creating order:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </View>
    );
  }

  if (error || !plan) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Plan Not Found</Text>
          <Text style={styles.errorText}>
            {error || "The plan you're looking for doesn't exist or has been removed."}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <FadeInView duration={180}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card with Flag */}
          <View style={styles.headerCard}>
          <View style={[styles.flagContainer, isGlobalPlan && styles.globalIconContainer]}>
            {isGlobalPlan ? (
              <Image
                source={globalIcon}
                style={styles.globalIconImage}
                resizeMode="contain"
              />
            ) : !imageError && locationCode ? (
              <Image
                source={{ uri: getFlagUrl() }}
                style={styles.flagImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
              ) : (
              <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
            )}
          </View>
          
          <Text style={styles.planTitle}>{displayName}</Text>
          
          {/* Feature badges */}
          <View style={styles.featureBadges}>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeIcon}>✓</Text>
              <Text style={styles.featureBadgeText}>Instant delivery</Text>
            </View>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeIcon}>✓</Text>
              <Text style={styles.featureBadgeText}>QR code install</Text>
            </View>
            <View style={styles.featureBadge}>
              <Text style={styles.featureBadgeIcon}>✓</Text>
              <Text style={styles.featureBadgeText}>Top-up available</Text>
            </View>
          </View>
          
          {/* Share Button */}
          <View style={styles.shareContainer}>
            <SharePlanButton
              countryName={params.countryName || locationCode || 'Travel'}
              planName={displayName}
              planPrice={formatPrice(convert(totalPrice))}
              style="icon"
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>TOTAL DATA</Text>
            <Text style={styles.statValue}>{displayDataSize}</Text>
          </View>
          
          {/* Duration - Editable for unlimited plans */}
          <View style={[styles.statBox, isUnlimited && styles.statBoxEditable]}>
            <Text style={styles.statLabel}>DURATION</Text>
            {isUnlimited ? (
              <View style={styles.daysSelectorContainer}>
                <TouchableOpacity 
                  style={styles.daysButton} 
                  onPress={() => adjustDays(-1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={20} color={theme.colors.text} />
                </TouchableOpacity>
                <TextInput
                  style={styles.daysInput}
                  value={selectedDays.toString()}
                  onChangeText={handleDaysChange}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={3}
                />
                <TouchableOpacity 
                  style={styles.daysButton} 
                  onPress={() => adjustDays(1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.daysButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.statValue}>{formatValidity(plan.duration, plan.durationUnit)}</Text>
            )}
            {isUnlimited && (
              <Text style={styles.daysLabel}>Days</Text>
            )}
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>SPEED</Text>
            <Text style={styles.statValue}>{plan.speed || '4G/LTE'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ACTIVATION</Text>
            <Text style={styles.statValue}>Automatic</Text>
          </View>
        </View>

        {/* Coverage Region */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="globe-outline" size={16} color={theme.colors.textMuted} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>COVERAGE REGION</Text>
          </View>
          
          <View style={styles.coverageCard}>
            <View style={[styles.coverageFlagContainer, isGlobalPlan && styles.globalIconContainer]}>
              {isGlobalPlan ? (
                <Image
                  source={globalIcon}
                  style={styles.globalIconImage}
                  resizeMode="contain"
                />
              ) : !imageError && locationCode ? (
                <Image
                  source={{ uri: getFlagUrl() }}
                  style={styles.coverageFlag}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
              )}
            </View>
            <View style={styles.coverageInfo}>
              <Text style={styles.coverageCountry}>{isGlobalPlan ? 'Global' : getCountryName(locationCode)}</Text>
              {!isGlobalPlan && (
                <Text style={styles.coverageNetwork}>{getNetworkOperator(locationCode)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Price Comparison */}
        <View style={styles.section}>
          <PriceComparison />
        </View>

        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <Text style={styles.orderSummaryTitle}>ORDER SUMMARY</Text>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Item:</Text>
            <Text style={styles.orderValue} numberOfLines={2}>{displayName}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Data:</Text>
            <Text style={styles.orderValue}>{displayDataSize}</Text>
          </View>
          
          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Validity:</Text>
            <Text style={styles.orderValue}>
              {isUnlimited ? `${selectedDays} Days` : formatValidity(plan.duration, plan.durationUnit)}
            </Text>
          </View>
          
          {isUnlimited && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Daily Rate:</Text>
              <Text style={styles.orderValue}>{formatPrice(convert(dailyPrice))}/day</Text>
            </View>
          )}
          
          <View style={styles.orderDivider} />
          
          <View style={styles.orderTotalRow}>
            <Text style={styles.orderTotalLabel}>TOTAL:</Text>
            <Text style={styles.orderTotalValue}>{formatPrice(convert(totalPrice))}</Text>
          </View>
        </View>

        {/* Complete Order Button */}
        <AnimatedButton
          style={[styles.completeOrderButton, processing && styles.completeOrderButtonDisabled]}
          onPress={handleCompleteOrder}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={theme.colors.white} size="small" />
          ) : (
            <Text style={styles.completeOrderButtonText}>COMPLETE ORDER</Text>
          )}
        </AnimatedButton>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="lock-closed" size={18} color={theme.colors.success} />
          <Text style={styles.securityText}>Secure Checkout • Instant Delivery</Text>
        </View>

        {/* Spacer for bottom */}
        <View style={{ height: 40 }} />
      </ScrollView>
      </FadeInView>
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
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
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
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  retryButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  
  // Header Card
  headerCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  flagContainer: {
    width: 80,
    height: 60,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundLight,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flagImage: {
    width: '100%',
    height: '100%',
  },
  flagFallback: {
    fontSize: 32,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  featureBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureBadgeIcon: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  featureBadgeText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  shareContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 90,
    justifyContent: 'center',
  },
  statBoxEditable: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  statLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  
  // Days Selector (for unlimited plans)
  daysSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  daysButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  daysButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
    lineHeight: 24,
  },
  daysInput: {
    width: 50,
    height: 36,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    padding: 0,
  },
  daysLabel: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  
  // Section
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  sectionIcon: {
    // Icon component handles its own size
  },
  sectionTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  
  // Coverage
  coverageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  coverageFlagContainer: {
    width: 48,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundLight,
    marginRight: theme.spacing.md,
  },
  coverageFlag: {
    width: '100%',
    height: '100%',
  },
  coverageFlagFallback: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 36,
  },
  globalIconContainer: {
    // Drop shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Drop shadow for Android
    elevation: 4,
  },
  globalIconImage: {
    width: 48,
    height: 48,
  },
  coverageInfo: {
    flex: 1,
  },
  coverageCountry: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 2,
  },
  coverageNetwork: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  
  // Order Summary
  orderSummaryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderSummaryTitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  orderLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  orderValue: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  orderDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotalLabel: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
  },
  orderTotalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  
  // Complete Order Button
  completeOrderButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    marginBottom: theme.spacing.md,
    ...theme.shadows.primaryGlow,
  },
  completeOrderButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  completeOrderButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
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
});
