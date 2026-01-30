import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Platform, StatusBar } from 'react-native';
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
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryNames, setCountryNames] = useState<Record<string, string>>({});
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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

  // Auto-refresh usage every 5 minutes when app is active
  useEffect(() => {
    if (!isLoaded || !user?.primaryEmailAddress?.emailAddress || esims.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      // Silently refresh usage (don't show loading spinner)
      fetchEsims(false, true); // Sync usage but don't show refresh spinner
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoaded, user?.primaryEmailAddress?.emailAddress, esims.length, fetchEsims]);

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

  const fetchEsims = useCallback(async (isRefresh = false, syncUsage = false) => {
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
      
      // If refreshing, sync usage for all eSIMs first
      if (syncUsage && isRefresh) {
        // Fetch current eSIMs to get ICCIDs
        const currentData = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
        const currentEsims = Array.isArray(currentData) ? currentData : [];
        
        // Sync usage for each eSIM (in parallel, but limit to avoid rate limits)
        const syncPromises = currentEsims
          .filter(esim => esim.iccid) // Only sync if ICCID exists
          .slice(0, 5) // Limit to 5 at a time to avoid rate limits
          .map(esim => 
            apiFetch(`/esim/${esim.iccid}/sync`, {
              method: 'POST',
              headers: {
                'x-user-email': email,
              },
            }).catch(err => {
              console.warn(`Failed to sync usage for ${esim.iccid}:`, err);
              return null; // Don't fail if one sync fails
            })
          );
        
        // Wait for syncs to complete (but don't block if they fail)
        await Promise.allSettled(syncPromises);
        setLastSyncTime(new Date()); // Update last sync time
      }
      
      // Fetch updated eSIM data
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

  const handleSyncNow = useCallback(async () => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email || syncing) return;

    try {
      setSyncing(true);
      setError(null);
      
      // Fetch current eSIMs to get ICCIDs
      const currentData = await apiFetch<EsimProfile[]>(`/user/esims?email=${encodeURIComponent(email)}`);
      const currentEsims = Array.isArray(currentData) ? currentData : [];
      
      // Sync usage for each eSIM (in parallel, but limit to avoid rate limits)
      const syncPromises = currentEsims
        .filter(esim => esim.iccid) // Only sync if ICCID exists
        .slice(0, 5) // Limit to 5 at a time to avoid rate limits
        .map(esim => 
          apiFetch(`/esim/${esim.iccid}/sync`, {
            method: 'POST',
            headers: {
              'x-user-email': email,
            },
          }).catch(err => {
            console.warn(`Failed to sync usage for ${esim.iccid}:`, err);
            return null; // Don't fail if one sync fails
          })
        );
      
      // Wait for syncs to complete
      await Promise.allSettled(syncPromises);
      setLastSyncTime(new Date()); // Update last sync time
      
      // Refresh eSIM data to show updated usage
      await fetchEsims(false, false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync usage';
      setError(errorMessage);
    } finally {
      setSyncing(false);
    }
  }, [user?.primaryEmailAddress?.emailAddress, syncing, fetchEsims]);

  const formatTimeAgo = (date: Date | null): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const onRefresh = useCallback(() => {
    fetchEsims(true, true); // Refresh and sync usage
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
            <View style={styles.esimHeaderLeft}>
              <Text style={styles.countryName}>{countryName}</Text>
              <Text style={styles.planName}>{planName}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor + '30' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>
          
          {item.totalVolume && (
            <View style={styles.dataUsageContainer}>
              <View style={styles.dataUsageRow}>
                <View style={styles.dataUsageLeft}>
                  <Text style={styles.dataUsageLabel}>REMAINING DATA</Text>
                  <Text style={styles.dataUsageText}>{remainingData}</Text>
                </View>
                <View style={styles.dataUsageRight}>
                  <Text style={styles.dataUsageLabel}>TOTAL</Text>
                  <Text style={styles.dataUsageTotal}>{formatDataSize(item.totalVolume)}</Text>
                </View>
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
          
          <View style={styles.esimFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.textMuted} />
              <Text style={styles.validityText}>{expiryText}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Auth Error / Not Signed In
  const isAuthError = error && (error.includes('log in') || error.includes('Please log in'));
  if (isAuthError && cachedEsims.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.emptyContainer}>
          <View style={styles.illustrationCircle}>
            <Ionicons name="lock-closed" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
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
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
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
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.header}>
        <Text style={styles.title}>My eSIMs</Text>
        
        {/* Sync Status and Controls - Redesigned */}
        <View style={styles.syncSection}>
          <View style={styles.syncRow}>
            <View style={styles.syncInfoContainer}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.syncText}>
                Last synced: {formatTimeAgo(lastSyncTime)}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleSyncNow} 
              disabled={syncing || refreshing}
              style={[styles.syncButton, (syncing || refreshing) && styles.syncButtonDisabled]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="sync" size={16} color={theme.colors.white} />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Provider Delay Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={13} color={theme.colors.textMuted} />
            <Text style={styles.infoNoteText}>
              Usage data updates every 2–3 hours from your carrier
            </Text>
          </View>
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
    backgroundColor: theme.colors.background,
  },
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingBottom: theme.spacing.md,
    paddingLeft: 16,
    paddingRight: 16,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
    marginBottom: theme.spacing.md,
  },
  syncSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  syncInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  syncText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.primaryGlow,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    fontSize: 13,
    color: theme.colors.white,
    fontWeight: '600',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '30',
  },
  infoNoteText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: 100,
  },
  // List Item (Redesigned)
  esimItem: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  esimContent: {
    flex: 1,
  },
  esimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  esimHeaderLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  countryName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  planName: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  dataUsageContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  dataUsageLeft: {
    flex: 1,
  },
  dataUsageRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dataUsageLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 6,
  },
  dataUsageText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: -0.4,
  },
  dataUsageTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  esimFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border + '40',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validityText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '500',
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
    borderRadius: theme.borderRadius.full, // Pill or rounded
    ...theme.shadows.primaryGlow,
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
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.primaryGlow,
  },
  signInButtonText: {
    color: theme.colors.white,
    fontWeight: '600',
  },
});
