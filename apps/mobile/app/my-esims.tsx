import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { calculateRemainingData, calculateUsagePercentage, formatExpiryDate, formatDataSize } from '../src/utils/dataUtils';
import { AnimatedButton } from '../src/components/AnimatedButton';

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
  const [cachedEsims, setCachedEsims] = useState<EsimProfile[]>([]);
  const cachedEsimsRef = useRef<EsimProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    if (user?.primaryEmailAddress?.emailAddress) {
      fetchEsims(false);
    } else {
      setLoading(false);
      setError('Please log in to view your eSIMs.');
    }
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
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      
      const data = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
      const esimsData = Array.isArray(data) ? data : [];
      setEsims(esimsData);
      if (esimsData.length > 0) {
        setCachedEsims(esimsData);
        cachedEsimsRef.current = esimsData;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load eSIMs';
      setError(errorMessage);
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

  const getCountryName = (locationCode?: string): string => {
    if (!locationCode) return 'Unknown';
    return countryNames[locationCode] || locationCode.toUpperCase();
  };

  const handleEsimPress = (esim: EsimProfile) => {
    router.push({
      pathname: '/esim-setup',
      params: { orderId: esim.orderId },
    });
  };

  const renderEsimItem = ({ item }: { item: EsimProfile }) => {
    const countryName = item.planDetails?.locationCode 
      ? getCountryName(item.planDetails.locationCode)
      : 'Unknown';
    const planName = item.planDetails?.name || 'Unknown Plan';
    const statusLabel = getStatusLabel(item.esimStatus);
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
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.planName}>{planName}</Text>
          
          {item.totalVolume && (
            <View style={styles.dataUsageContainer}>
              <View style={styles.dataUsageRow}>
                <Text style={styles.dataUsageText}>{remainingData} left</Text>
                <Text style={styles.dataUsageTotal}>{formatDataSize(item.totalVolume)}</Text>
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
          
          <Text style={styles.validityText}>{expiryText}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </TouchableOpacity>
    );
  };

  // Auth Error / Not Signed In
  const isAuthError = error && (error.includes('log in') || error.includes('Please log in'));
  if (isAuthError && cachedEsims.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
             <Text style={styles.illustrationIcon}>🔒</Text>
          </View>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyText}>Login or sign up to access your eSIMs</Text>
          <View style={styles.authButtonsContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  if (esims.length === 0 && !loading && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>My eSIMs</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
             <Ionicons name="phone-portrait-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
          </View>
          <Text style={styles.emptyTitle}>No data plans... yet!</Text>
          <Text style={styles.emptyText}>Purchase a plan for it to appear here.</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/countries')}
          >
            <Text style={styles.browseButtonText}>Explore plans</Text>
          </TouchableOpacity>
        </View>
        <BottomNav activeTab="my-esims" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My eSIMs</Text>
          <TouchableOpacity onPress={onRefresh} disabled={refreshing} style={styles.refreshButton}>
            {refreshing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <Text style={styles.refreshButtonText}>↻</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={esims}
        keyExtractor={(item) => item.id}
        renderItem={renderEsimItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
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
    backgroundColor: theme.colors.backgroundLight,
  },
  header: {
    paddingTop: 4,
    paddingBottom: theme.spacing.xs,
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    backgroundColor: theme.colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.base,
    paddingBottom: 100,
  },
  // List Item (Flat)
  esimItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  esimContent: {
    flex: 1,
  },
  esimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  countryName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  planName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  dataUsageContainer: {
    marginBottom: theme.spacing.sm,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dataUsageText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text,
  },
  dataUsageTotal: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  validityText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  arrow: {
    fontSize: 20,
    color: theme.colors.textMuted,
    marginLeft: theme.spacing.md,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background, // Or a light grey/navy
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  illustrationIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  browseButton: {
    backgroundColor: theme.colors.primary, // Yellow -> Blue
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: theme.borderRadius.md, // Pill or rounded
  },
  browseButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  authButtonsContainer: {
    width: '100%',
    maxWidth: 200,
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  signInButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});
