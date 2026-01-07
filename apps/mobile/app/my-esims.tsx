import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { formatDataSize, calculateRemainingData, calculateUsagePercentage, formatExpiryDate } from '../src/utils/dataUtils';

type PlanDetails = {
  name: string;
  packageCode: string;
  locationCode?: string;
  volume?: number;
  duration?: number;
  durationUnit?: string;
};

type EsimProfile = {
  id: string;
  orderId: string;
  esimTranNo?: string;
  iccid?: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  smdpStatus?: string;
  esimStatus?: string;
  totalVolume?: string | null;
  orderUsage?: string | null;
  expiredTime?: string | null;
  planDetails?: PlanDetails;
};

export default function MyEsims() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [esims, setEsims] = useState<EsimProfile[]>([]);
  const [cachedEsims, setCachedEsims] = useState<EsimProfile[]>([]); // Cache last successful data
  const cachedEsimsRef = useRef<EsimProfile[]>([]); // Ref to avoid dependency issues
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      // Still loading Clerk
      return;
    }
    
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchEsims(false);
    } else {
      // Clerk loaded but no user/email available
      setLoading(false);
      setError('Please log in to view your eSIMs.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress]);

  async function fetchCountries() {
    try {
      const countries = await apiFetch<Array<{ code: string; name: string }>>('/countries');
      const countryMap: Record<string, string> = {};
      countries.forEach(country => {
        countryMap[country.code] = country.name;
      });
      setCountryNames(countryMap);
    } catch (err) {
      console.warn('Failed to fetch countries:', err);
    }
  }

  const fetchEsims = useCallback(async (isRefresh = false) => {
    const email = user?.primaryEmailAddress?.emailAddress;
    
    if (!email) {
      setLoading(false);
      setError('Please log in to view your eSIMs.');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const data = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
      const esimsData = Array.isArray(data) ? data : [];
      setEsims(esimsData);
      // Cache successful data
      if (esimsData.length > 0) {
        setCachedEsims(esimsData);
        cachedEsimsRef.current = esimsData;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load eSIMs';
      const isNetworkError = errorMessage.includes('Network request failed') || 
                             errorMessage.includes('network') ||
                             errorMessage.includes('fetch');
      
      setError(isNetworkError 
        ? 'Unable to connect. Please check your internet connection.'
        : errorMessage);
      console.error('Error fetching eSIMs:', err);
      
      // Show cached data if available (use ref to avoid stale closure)
      if (cachedEsimsRef.current.length > 0) {
        setEsims(cachedEsimsRef.current);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.primaryEmailAddress?.emailAddress]);

  const onRefresh = useCallback(() => {
    fetchEsims(true);
  }, [fetchEsims]);

  const shortenOrderId = (orderId: string): string => {
    if (orderId.length <= 12) return orderId;
    return `${orderId.slice(0, 8)}...`;
  };

  const getCountryName = (locationCode?: string): string => {
    if (!locationCode) return 'Unknown';
    return countryNames[locationCode] || locationCode.toUpperCase();
  };


  const handleEsimPress = (esim: EsimProfile) => {
    // Navigate to eSIM setup/details screen with orderId
    router.push({
      pathname: '/esim-setup',
      params: {
        orderId: esim.orderId,
      },
    });
  };

  const renderEsimItem = ({ item }: { item: EsimProfile }) => {
    const countryName = item.planDetails?.locationCode 
      ? getCountryName(item.planDetails.locationCode)
      : 'Unknown';
    const planName = item.planDetails?.name || 'Unknown Plan';
    const statusLabel = getStatusLabel(item.esimStatus);
    const orderId = shortenOrderId(item.orderId);
    const statusColor = getStatusColor(item.esimStatus);
    const remainingData = calculateRemainingData(item.totalVolume, item.orderUsage);
    const usagePercentage = calculateUsagePercentage(item.totalVolume, item.orderUsage);
    const expiryText = formatExpiryDate(item.expiredTime);

    return (
      <TouchableOpacity
        style={styles.esimItem}
        onPress={() => handleEsimPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.esimContent}>
          <View style={styles.esimHeader}>
            <Text style={styles.countryName}>{countryName}</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor + '40', backgroundColor: statusColor + '10' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.planName}>{planName}</Text>
          
          {/* Data Usage Progress Bar */}
          {item.totalVolume && (
            <View style={styles.dataUsageContainer}>
              <View style={styles.dataUsageRow}>
                <Text style={styles.dataUsageText}>{remainingData} left</Text>
                {item.totalVolume && (
                  <Text style={styles.dataUsageTotal}>{formatDataSize(item.totalVolume)}</Text>
                )}
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${usagePercentage}%`, backgroundColor: usagePercentage > 80 ? theme.colors.warning : theme.colors.primary }
                  ]} 
                />
              </View>
            </View>
          )}
          
          {/* Validity */}
          <View style={styles.validityRow}>
            <Text style={styles.validityText}>{expiryText}</Text>
          </View>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  // Show sign in prompt if not authenticated (instead of error state)
  const isAuthError = error && (error.includes('log in') || error.includes('Please log in'));
  if (isAuthError && cachedEsims.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>
            Login or sign up to access your eSIMs
          </Text>
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signUpButton}
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.8}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  // Show error only if we have no cached data to display (and it's not an auth error)
  if (error && cachedEsims.length === 0 && !loading && !isAuthError) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>My eSIMs</Text>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>We couldn't load your eSIMs</Text>
          <Text style={styles.errorText}>Check your connection and try again</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchEsims(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  if (esims.length === 0 && !loading && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>My eSIMs</Text>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              style={styles.refreshButton}
              activeOpacity={0.7}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.refreshButtonText}>↻</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📱</Text>
          <Text style={styles.emptyTitle}>No eSIMs yet</Text>
          <Text style={styles.emptyText}>
            Browse countries and buy your first eSIM
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/countries')}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse eSIMs</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  // Show cached data indicator if we have error but cached data
  const showStaleDataWarning = error && cachedEsims.length > 0 && esims.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>My eSIMs</Text>
            <Text style={styles.subtitle}>{esims.length} eSIM{esims.length !== 1 ? 's' : ''}</Text>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            disabled={refreshing}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.refreshButtonText}>↻</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stale data warning banner */}
      {showStaleDataWarning && (
        <View style={styles.staleDataBanner}>
          <Text style={styles.staleDataText}>
            ⚠️ Showing previously saved data. Pull to refresh to update.
          </Text>
          <TouchableOpacity
            style={styles.staleDataButton}
            onPress={() => fetchEsims(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.staleDataButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={esims}
        keyExtractor={(item) => item.id}
        renderItem={renderEsimItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: 80 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
      <BottomNav activeTab="my-esims" />
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  refreshButtonText: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: theme.spacing.md,
  },
  esimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  esimContent: {
    flex: 1,
  },
  esimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  countryName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
  },
  dataUsageContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dataUsageText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dataUsageTotal: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  validityRow: {
    marginTop: 4,
  },
  validityText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginLeft: 12,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: 'center',
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
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  staleDataBanner: {
    backgroundColor: theme.colors.warningBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.warning,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  staleDataText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    marginRight: 12,
  },
  staleDataButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.warning,
    borderRadius: 6,
  },
  staleDataButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 12,
    marginTop: 8,
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    width: '100%',
  },
  signInButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  signUpButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
