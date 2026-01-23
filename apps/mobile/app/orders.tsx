import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';

interface Order {
  id: string;
  status: string;
  amountCents: number;
  displayAmountCents?: number;
  displayCurrency?: string;
  currency: string;
  createdAt: string;
  planId?: string;
  planDetails?: {
    name?: string;
    location?: string;
    volume?: number;
    duration?: number;
    durationUnit?: string;
  };
  EsimProfile?: Array<{
    iccid?: string;
    esimStatus?: string;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24' },
  paid: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
  processing: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7' },
  completed: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  failed: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
  refunded: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
  cancelled: { bg: 'rgba(156, 163, 175, 0.15)', text: '#9ca3af' },
};

export default function Orders() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { formatPrice, convert } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrders();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  const fetchOrders = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      const data = await apiFetch<Order[]>('/orders', {
        headers: { 'x-user-email': userEmail },
      });
      
      // Sort by date (newest first)
      const sortedOrders = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(sortedOrders);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDataSize = (volume?: number): string => {
    if (!volume || volume <= 0) return '—';
    if (volume >= 1024) {
      return `${(volume / 1024).toFixed(volume % 1024 === 0 ? 0 : 1)} GB`;
    }
    return `${volume} MB`;
  };

  const getOrderPrice = (order: Order): string => {
    // Use display amount if available, otherwise convert from cents
    const amountUSD = (order.displayAmountCents || order.amountCents) / 100;
    return formatPrice(convert(amountUSD));
  };

  // Not signed in state
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.content}>
          <View style={styles.signInCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text-outline" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Order History</Text>
            <Text style={styles.description}>
              Sign in to view your past orders and purchase history.
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
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const statusLabel = STATUS_LABELS[item.status] || item.status;
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
    const planName = item.planDetails?.name || 'eSIM Plan';
    const hasEsim = item.EsimProfile && item.EsimProfile.length > 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          if (item.id) {
            router.push({
              pathname: '/order-detail',
              params: { orderId: item.id },
            });
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.orderHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {statusLabel}
            </Text>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>

        <Text style={styles.planName} numberOfLines={2}>{planName}</Text>

        {item.planDetails && (
          <View style={styles.orderDetails}>
            {item.planDetails.volume && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📊</Text>
                <Text style={styles.detailText}>{formatDataSize(item.planDetails.volume)}</Text>
              </View>
            )}
            {item.planDetails.duration && (
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>📅</Text>
                <Text style={styles.detailText}>
                  {item.planDetails.duration} {item.planDetails.durationUnit === 'month' ? 'Month' : 'Day'}
                  {item.planDetails.duration !== 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {item.planDetails.location && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
                <Text style={styles.detailText}>{item.planDetails.location}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.orderFooter}>
          <Text style={styles.orderPrice}>{getOrderPrice(item)}</Text>
          {hasEsim && (
            <View style={styles.viewEsimButton}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.viewEsimText}>View eSIM</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>
              Your purchase history will appear here once you buy an eSIM.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => router.push('/countries')}
              activeOpacity={0.85}
            >
              <Text style={styles.browseButtonText}>Browse eSIMs</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          orders.length > 0 ? (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Order History</Text>
              <Text style={styles.headerSubtitle}>
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </Text>
            </View>
          ) : null
        }
      />
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
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
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
    ...theme.typography.body, fontWeight: '600' as const,
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
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
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
    ...theme.typography.body, fontWeight: '600' as const,
  },
  
  // Header
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingLeft: 16,
    paddingRight: 16,
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
  
  // Order Card
  orderCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
    letterSpacing: 0.5,
  },
  orderDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  planName: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  orderDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIcon: {
    fontSize: 12,
  },
  detailText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  orderPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  viewEsimButton: {
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  viewEsimText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browseButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '600' as const,
  },
});

