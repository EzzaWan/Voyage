import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { useUser } from '@clerk/clerk-expo';
import { theme } from '../src/theme';

interface TopUpOption {
  packageCode: string;
  name: string;
  price: number;
  volume: number;
  duration: number;
  durationUnit: string;
  location: string;
}

interface EsimProfile {
  iccid: string;
  planDetails?: {
    name?: string;
    location?: string;
  };
  esimStatus?: string;
}

export default function TopUp() {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams<{ iccid: string }>();
  
  const [profile, setProfile] = useState<EsimProfile | null>(null);
  const [options, setOptions] = useState<TopUpOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    if (params.iccid) {
      fetchData();
    } else {
      setError('ICCID is required');
      setLoading(false);
    }
  }, [params.iccid]);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch eSIM profile details
      try {
        const profileData = await apiFetch<EsimProfile>(`/esim/${params.iccid}`);
        setProfile(profileData);
      } catch (err) {
        console.warn('Failed to fetch profile:', err);
      }

      // Fetch top-up options
      const topupOptions = await apiFetch<TopUpOption[]>(`/esim/topup-options?iccid=${params.iccid}`);
      setOptions(topupOptions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load top-up options';
      setError(errorMessage);
      console.error('Error fetching top-up data:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDataSize = (volumeBytes: number): string => {
    const gb = volumeBytes / 1024 / 1024 / 1024;
    if (gb >= 1) {
      return `${gb.toFixed(gb % 1 === 0 ? 0 : 1)} GB`;
    }
    const mb = volumeBytes / 1024 / 1024;
    return `${mb.toFixed(0)} MB`;
  };

  const formatValidity = (duration: number, unit: string): string => {
    const unitLabel = unit === 'day' ? 'Day' : unit === 'month' ? 'Month' : unit;
    return `${duration} ${unitLabel}${duration !== 1 ? 's' : ''}`;
  };

  const handleTopUp = async (plan: TopUpOption) => {
    if (!plan.packageCode) {
      Alert.alert('Error', 'Plan code is missing');
      return;
    }

    try {
      setProcessingPlan(plan.packageCode);
      setError(null);

      const response = await apiFetch<{ url?: string }>('/topup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iccid: params.iccid,
          planCode: plan.packageCode,
          amount: plan.price,
          currency: 'USD',
          displayCurrency: 'USD',
        }),
      });

      if (response.url) {
        // Navigate to checkout with the Stripe URL
        router.push({
          pathname: '/checkout',
          params: {
            stripeUrl: response.url,
            isTopup: 'true',
          },
        });
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start top-up';
      Alert.alert('Error', errorMessage);
      console.error('Error starting top-up:', err);
    } finally {
      setProcessingPlan(null);
    }
  };

  const renderTopUpOption = ({ item }: { item: TopUpOption }) => {
    const isProcessing = processingPlan === item.packageCode;
    const dataSize = formatDataSize(item.volume);
    const validity = formatValidity(item.duration, item.durationUnit);

    return (
      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => handleTopUp(item)}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        {/* Duration Badge */}
        <View style={styles.durationBadge}>
          <Text style={styles.durationBadgeText}>{validity}</Text>
        </View>

        {/* Data Size */}
        <Text style={styles.dataSize}>{dataSize}</Text>

        {/* Plan Name */}
        <Text style={styles.planName} numberOfLines={2}>{item.name}</Text>

        {/* Specs */}
        <View style={styles.specs}>
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>📊</Text>
            <Text style={styles.specText}>{dataSize}</Text>
          </View>
          <View style={styles.specDivider} />
          <View style={styles.specItem}>
            <Text style={styles.specIcon}>📅</Text>
            <Text style={styles.specText}>{validity}</Text>
          </View>
        </View>

        {/* Price & Button */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.topupButton, isProcessing && styles.topupButtonDisabled]}>
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.white} size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.topupButtonText}>Top Up</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.white} />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading top-up options...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>📶</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            Top-Up {profile?.planDetails?.name || 'eSIM'}
          </Text>
          <Text style={styles.headerSubtitle}>Add more data instantly</Text>
          {params.iccid && (
            <Text style={styles.iccidText} numberOfLines={1}>
              {params.iccid}
            </Text>
          )}
        </View>
      </View>

      {/* Options List */}
      {options.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No Top-Up Plans</Text>
          <Text style={styles.emptyText}>
            No compatible top-up plans were found for this eSIM. Contact support if you need assistance.
          </Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={options}
          renderItem={renderTopUpOption}
          keyExtractor={(item) => item.packageCode}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    ...theme.typography.bodyBold,
  },
  
  // Header Card
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  headerIconText: {
    fontSize: 28,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  iccidText: {
    ...theme.typography.tiny,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  
  // List
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: 0,
    paddingBottom: theme.spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  
  // Option Card
  optionCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  durationBadgeText: {
    ...theme.typography.tiny,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dataSize: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  planName: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    minHeight: 36,
  },
  specs: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  specText: {
    ...theme.typography.tiny,
    color: theme.colors.textMuted,
  },
  specDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    ...theme.typography.tiny,
    color: theme.colors.textMuted,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  topupButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    minWidth: 80,
    alignItems: 'center',
  },
  topupButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  topupButtonText: {
    ...theme.typography.small,
    color: theme.colors.white,
    fontWeight: '600',
  },
  
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  backButtonText: {
    color: theme.colors.text,
    ...theme.typography.bodyBold,
  },
});




