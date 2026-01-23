import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { useToast } from '../src/context/ToastContext';

interface EsimProfile {
  id: string;
  iccid: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  esimStatus?: string | null;
  totalVolume?: number;
  usedVolume?: number;
  expiredTime?: string | null;
}

interface OrderDetails {
  id: string;
  planId: string;
  amountCents: number;
  displayAmountCents?: number;
  displayCurrency?: string;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  planDetails?: {
    name?: string;
    location?: string;
    volume?: number;
    duration?: number;
    durationUnit?: string;
  };
  EsimProfile?: EsimProfile[];
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  paid: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  processing: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' },
  completed: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  failed: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  refunded: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
  cancelled: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
};

export default function OrderDetail() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useUser();
  const { convert, formatPrice } = useCurrency();
  const params = useLocalSearchParams<{ orderId: string }>();
  
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.orderId) {
      fetchOrder();
    }
  }, [params.orderId]);

  const fetchOrder = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !params.orderId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      const data = await apiFetch<OrderDetails>(`/orders/${params.orderId}`, {
        headers: { 'x-user-email': userEmail },
      });
      
      setOrder(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      setError(errorMessage);
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number, currency?: string): string => {
    if (currency && currency !== 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(cents / 100);
    }
    return formatPrice(convert(cents / 100));
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDataSize = (volume?: number): string => {
    if (!volume || volume <= 0) return '—';
    if (volume >= 1024) {
      return `${(volume / 1024).toFixed(volume % 1024 === 0 ? 0 : 1)} GB`;
    }
    return `${volume} MB`;
  };

  const handleCopyOrderId = async () => {
    if (order?.id) {
      await Clipboard.setStringAsync(order.id);
      toast.success('Copied', 'Order ID copied to clipboard');
    }
  };

  const handleViewEsim = () => {
    if (order?.EsimProfile?.[0]) {
      router.push({
        pathname: '/esim-setup',
        params: { orderId: order.id },
      });
    }
  };

  // Loading
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

  // Error
  if (error || !order) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={colors.status.warning.main} />
          <Text style={styles.errorTitle}>Unable to Load Order</Text>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const esimProfile = order.EsimProfile?.[0];
  const displayAmount = order.displayAmountCents || order.amountCents;
  const displayCurrency = order.displayCurrency || order.currency;
  const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
  const statusColor = ORDER_STATUS_COLORS[order.status] || ORDER_STATUS_COLORS.pending;

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Order Info Card */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Order Number</Text>
            <TouchableOpacity onPress={handleCopyOrderId} activeOpacity={0.8}>
              <Text style={styles.cardValueMono}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text>{order.id.substring(0, 12)}...</Text>
                  <Ionicons name="copy-outline" size={16} color={theme.colors.textMuted} />
                </View>
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount Paid</Text>
            <Text style={styles.cardValueAccent}>
              {formatCurrency(displayAmount, displayCurrency)}
            </Text>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Payment Method</Text>
            <Text style={styles.cardValue}>
              {order.paymentMethod === 'stripe' ? 'Card' : order.paymentMethod}
            </Text>
          </View>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Order Date</Text>
            <Text style={styles.cardValue}>{formatDate(order.createdAt)}</Text>
          </View>
        </View>

        {/* Plan Details */}
        {order.planDetails && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Plan Details</Text>
            
            <View style={styles.planInfo}>
              <Text style={styles.planName}>{order.planDetails.name || 'eSIM Plan'}</Text>
              
              <View style={styles.planSpecs}>
                {order.planDetails.volume && (
                  <View style={styles.specItem}>
                    <Text style={styles.specIcon}>📊</Text>
                    <Text style={styles.specText}>{formatDataSize(order.planDetails.volume)}</Text>
                  </View>
                )}
                {order.planDetails.duration && (
                  <View style={styles.specItem}>
                    <Text style={styles.specIcon}>📅</Text>
                    <Text style={styles.specText}>
                      {order.planDetails.duration} {order.planDetails.durationUnit === 'month' ? 'Month' : 'Day'}
                      {order.planDetails.duration !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
                {order.planDetails.location && (
                  <View style={styles.specItem}>
                    <Text style={styles.specIcon}>📍</Text>
                    <Text style={styles.specText}>{order.planDetails.location}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* eSIM Info */}
        {esimProfile && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>eSIM Information</Text>
            
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>ICCID</Text>
              <Text style={styles.cardValueMono}>{esimProfile.iccid}</Text>
            </View>
            
            {esimProfile.esimStatus && (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Status</Text>
                  <View style={[
                    styles.esimStatusBadge,
                    { backgroundColor: getStatusColor(esimProfile.esimStatus).bg }
                  ]}>
                    <Text style={[
                      styles.esimStatusText,
                      { color: getStatusColor(esimProfile.esimStatus).text }
                    ]}>
                      {getStatusLabel(esimProfile.esimStatus)}
                    </Text>
                  </View>
                </View>
              </>
            )}
            
            {/* QR Code Preview */}
            {esimProfile.qrCodeUrl && (
              <View style={styles.qrSection}>
                <View style={styles.qrPreview}>
                  <Image
                    source={{ uri: esimProfile.qrCodeUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <TouchableOpacity
                  style={styles.viewEsimButton}
                  onPress={handleViewEsim}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.viewEsimButtonText}>View Full eSIM Details</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {esimProfile && (
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={handleViewEsim}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>View eSIM & QR Code</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/contact')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryActionText}>Need Help?</Text>
          </TouchableOpacity>
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
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  
  // Loading & Error
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
    ...theme.typography.h2,
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
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  },
  
  // Header
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    ...theme.typography.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
  },
  cardValue: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  cardValueMono: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  cardValueAccent: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  
  // Plan Info
  planInfo: {
    gap: theme.spacing.sm,
  },
  planName: {
    ...theme.typography.bodyBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  planSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specIcon: {
    fontSize: 14,
  },
  specText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  
  // eSIM Status
  esimStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  esimStatusText: {
    ...theme.typography.tiny,
    fontWeight: '600',
  },
  
  // QR Section
  qrSection: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  qrPreview: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  viewEsimButton: {
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  viewEsimButtonText: {
    color: theme.colors.primary,
    ...theme.typography.bodyMedium,
  },
  
  // Actions
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  primaryAction: {
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
  primaryActionText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  },
  secondaryAction: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryActionText: {
    color: theme.colors.text,
    ...theme.typography.bodyMedium,
  },
});




