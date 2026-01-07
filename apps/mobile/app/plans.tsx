import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { useUser } from '@clerk/clerk-expo';
import { theme } from '../src/theme';

type Plan = {
  packageCode?: string;
  id?: string;
  name: string;
  price: number;
  volume?: number; // in MB
  duration?: number; // in days
  durationUnit?: string;
  description?: string;
};

type OrderResponse = {
  orderId: string;
  [key: string]: any;
};

export default function Plans() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{
    countryId: string;
    countryName: string;
    regionId?: string;
    regionName?: string;
  }>();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (params.countryId) {
      fetchPlans();
    }
  }, [params.countryId, params.regionId]);

  async function fetchPlans() {
    try {
      setLoading(true);
      setError(null);
      const plansData = await apiFetch<Plan[]>(`/countries/${params.countryId}/plans`);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(errorMessage);
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  }

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

  const handleBuyPress = async (plan: Plan) => {
    if (!plan.packageCode) {
      setError('Plan code is missing');
      return;
    }

    try {
      setProcessingOrder(plan.packageCode);
      setError(null);

      const userEmail = user?.primaryEmailAddress?.emailAddress;
      const orderBody: {
        planCode: string;
        amount: number;
        currency: string;
        planName: string;
        paymentMethod: string;
        email?: string;
      } = {
        planCode: plan.packageCode,
        amount: plan.price,
        currency: 'USD',
        planName: plan.name,
        paymentMethod: 'stripe',
      };

      if (userEmail) {
        orderBody.email = userEmail;
      }

      const order = await apiFetch<OrderResponse>('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderBody),
      });

      if (order.orderId) {
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
      console.error('Error creating order:', err);
    } finally {
      setProcessingOrder(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>eSIM Plans</Text>
          <Text style={styles.subtitle}>
            {params.regionName ? `${params.regionName} • ` : ''}
            {params.countryName}
          </Text>
        </View>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>eSIM Plans</Text>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (plans.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>eSIM Plans</Text>
        <Text style={styles.emptyText}>No plans available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>eSIM Plans</Text>
        <Text style={styles.subtitle}>
          {params.regionName ? `${params.regionName} • ` : ''}
          {params.countryName}
        </Text>
      </View>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.packageCode || item.id || item.name}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isProcessing = processingOrder === item.packageCode;
          return (
            <View style={styles.planItem}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{item.name}</Text>
                  <View style={styles.planBadges}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{formatDataSize(item.volume)}</Text>
                    </View>
                    <View style={[styles.badge, styles.badgeSecondary]}>
                      <Text style={styles.badgeText}>{formatValidity(item.duration, item.durationUnit)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.planPrice}>${item.price.toFixed(2)}</Text>
              </View>
              
              {item.description && (
                <Text style={styles.planDescription}>{item.description}</Text>
              )}

              <TouchableOpacity
                style={[styles.buyButton, isProcessing && styles.buyButtonDisabled]}
                onPress={() => handleBuyPress(item)}
                activeOpacity={0.8}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buyButtonText}>Buy eSIM</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  loader: {
    marginVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginTop: 16,
    padding: theme.spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  planItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  planName: {
    fontSize: 20,
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  planBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(30, 144, 255, 0.2)',
  },
  badgeSecondary: {
    backgroundColor: 'rgba(168, 181, 200, 0.1)',
    borderColor: 'rgba(168, 181, 200, 0.2)',
  },
  badgeText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  planPrice: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buyButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  buyButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
