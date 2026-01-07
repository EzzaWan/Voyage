import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

type OrderData = {
  id: string;
  amountCents: number;
  currency: string;
  displayCurrency?: string;
  displayAmountCents?: number;
  status: string;
  planId?: string;
  EsimProfile?: Array<{
    id: string;
    iccid?: string;
    qrCodeUrl?: string | null;
    ac?: string | null;
    esimStatus?: string | null;
  }>;
};

type PlanDetails = {
  name: string;
  packageCode: string;
  locationCode?: string;
  volume?: number; // in MB
  duration?: number; // in days
  durationUnit?: string;
};

type Country = {
  code: string;
  name: string;
};

export default function OrderSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; orderId?: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [countryName, setCountryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.sessionId) {
      fetchOrderBySession();
    } else if (params.orderId) {
      fetchOrderById();
    } else {
      setError('Session ID or Order ID is required');
      setLoading(false);
    }
  }, [params.sessionId, params.orderId]);

  const fetchPlanDetails = useCallback(async (planId: string) => {
    try {
      const plan = await apiFetch<PlanDetails>(`/plans/${planId}`);
      setPlanDetails(plan);
      if (plan.locationCode) {
        const countries = await apiFetch<Country[]>('/countries');
        const foundCountry = countries.find(c => c.code === plan.locationCode);
        setCountryName(foundCountry?.name || plan.locationCode.toUpperCase());
      }
    } catch (err) {
      console.warn('Failed to fetch plan details:', err);
    }
  }, []);

  async function fetchOrderBySession() {
    try {
      setLoading(true);
      setError(null);
      const orderData = await apiFetch<OrderData>(`/orders/by-session/${params.sessionId}`);
      setOrder(orderData);
      
      if (orderData.planId) {
        await fetchPlanDetails(orderData.planId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order by session';
      setError(errorMessage);
      console.error('Error fetching order by session:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrderById() {
    try {
      setLoading(true);
      setError(null);
      const orderData = await apiFetch<OrderData>(`/orders/${params.orderId}`);
      setOrder(orderData);
      
      if (orderData.planId) {
        await fetchPlanDetails(orderData.planId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order by ID';
      setError(errorMessage);
      console.error('Error fetching order by ID:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (cents: number, currency: string = 'USD'): string => {
    const amount = cents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDataSize = (volume?: number): string => {
    if (!volume) return '';
    if (volume < 1024) return `${volume}MB`;
    return `${(volume / 1024).toFixed(1)}GB`;
  };

  const formatValidity = (duration?: number, durationUnit?: string): string => {
    if (!duration) return '';
    const unit = durationUnit === 'day' ? 'day' : durationUnit === 'month' ? 'month' : 'day';
    return `${duration} ${unit}${duration !== 1 ? 's' : ''}`;
  };

  const handleViewInstructions = () => {
    if (order?.id) {
      router.push({
        pathname: '/esim-setup',
        params: { orderId: order.id },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
        </ScrollView>
      </View>
    );
  }

  const displayAmount = order.displayAmountCents || order.amountCents;
  const displayCurrency = order.displayCurrency || order.currency || 'USD';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.successIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Your eSIM is ready</Text>
          <Text style={styles.successSubtitle}>Payment successful</Text>
        </View>

        {/* Order Details */}
        <View style={styles.orderCard}>
          <Text style={styles.cardTitle}>Order Details</Text>
          
          {/* Country */}
          {countryName && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Country</Text>
              <Text style={styles.orderValue}>{countryName}</Text>
            </View>
          )}

          {/* Plan */}
          {planDetails && (
            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Plan</Text>
              <Text style={styles.orderValue}>
                {planDetails.name} ({formatDataSize(planDetails.volume)} / {formatValidity(planDetails.duration, planDetails.durationUnit)})
              </Text>
            </View>
          )}

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Order Number</Text>
            <Text style={styles.orderValue}>{order.id}</Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Amount Paid</Text>
            <Text style={styles.orderAmount}>
              {formatCurrency(displayAmount, displayCurrency)}
            </Text>
          </View>

          <View style={styles.orderRow}>
            <Text style={styles.orderLabel}>Status</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.orderStatus}>
                {order.status === 'paid' ? 'Paid' : order.status === 'pending' ? 'Pending' : order.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            You will receive an email with your eSIM QR code and installation instructions shortly.
          </Text>
          <Text style={styles.infoText}>
            Check your email inbox for order confirmation and setup instructions.
          </Text>
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleViewInstructions}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>View eSIM setup instructions</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkmark: {
    fontSize: 48,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  orderValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: '600',
    color: theme.colors.text,
  },
  orderAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
    marginRight: 8,
  },
  orderStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
});
