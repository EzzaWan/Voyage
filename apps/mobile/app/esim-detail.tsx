import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useCurrency } from '../src/context/CurrencyContext';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { formatDataSize, calculateRemainingData, calculateUsagePercentage, formatExpiryDate } from '../src/utils/dataUtils';
import { useToast } from '../src/context/ToastContext';

interface EsimProfile {
  id: string;
  iccid: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  esimStatus?: string | null;
  smdpStatus?: string | null;
  totalVolume?: number;
  usedVolume?: number;
  expiredTime?: string | null;
  order?: {
    id: string;
    status: string;
  };
  planDetails?: {
    name?: string;
    location?: string;
    volume?: number;
    duration?: number;
    durationUnit?: string;
  };
}

interface TopupHistory {
  id: string;
  planCode: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function EsimDetail() {
  const router = useRouter();
  const { user } = useUser();
  const toast = useToast();
  const { convert, formatPrice } = useCurrency();
  const params = useLocalSearchParams<{ iccid: string }>();
  
  const [profile, setProfile] = useState<EsimProfile | null>(null);
  const [topupHistory, setTopupHistory] = useState<TopupHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.iccid) {
      fetchData();
    }
  }, [params.iccid]);

  const fetchData = async () => {
    if (!params.iccid) return;

    try {
      setError(null);
      
      // Fetch eSIM profile
      const data = await apiFetch<EsimProfile>(`/esim/${params.iccid}`);
      setProfile(data);

      // Fetch top-up history
      try {
        const history = await apiFetch<TopupHistory[]>(`/esim/topups?iccid=${params.iccid}`);
        setTopupHistory(history || []);
      } catch {
        setTopupHistory([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load eSIM details';
      setError(errorMessage);
      console.error('Error fetching eSIM:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCopyIccid = async () => {
    if (profile?.iccid) {
      await Clipboard.setStringAsync(profile.iccid);
      toast.success('Copied', 'ICCID copied to clipboard');
    }
  };

  const handleCopyActivationCode = async () => {
    if (profile?.ac) {
      await Clipboard.setStringAsync(profile.ac);
      toast.success('Copied', 'Activation code copied to clipboard');
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading eSIM details...</Text>
        </View>
      </View>
    );
  }

  // Error
  if (error || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>eSIM Not Found</Text>
          <Text style={styles.errorText}>{error || 'Unable to load eSIM details'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.push('/my-esims')}
          >
            <Text style={styles.retryButtonText}>View My eSIMs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusLabel = getStatusLabel(profile.esimStatus || '');
  const statusColor = getStatusColor(profile.esimStatus || '');
  const remainingData = calculateRemainingData(profile.totalVolume, profile.usedVolume);
  const usagePercent = calculateUsagePercentage(profile.totalVolume, profile.usedVolume);

  // Get status badge colors
  const getStatusBadgeColors = (status?: string | null) => {
    if (!status) return { bg: 'rgba(30, 144, 255, 0.15)', text: theme.colors.primary };
    const normalizedStatus = status.toUpperCase();
    
    if (normalizedStatus === 'GOT_RESOURCE' || normalizedStatus === 'DOWNLOAD') {
      return { bg: 'rgba(30, 144, 255, 0.15)', text: theme.colors.primary };
    }
    if (normalizedStatus === 'INSTALLED' || normalizedStatus === 'INSTALLATION') {
      return { bg: theme.colors.warningBackground, text: theme.colors.warning };
    }
    if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'IN_USE' || normalizedStatus === 'ENABLED' || normalizedStatus === 'ACTIVATED') {
      return { bg: theme.colors.successBackground, text: theme.colors.success };
    }
    if (normalizedStatus === 'EXPIRED' || normalizedStatus === 'UNUSED_EXPIRED' || normalizedStatus === 'USED_EXPIRED' || normalizedStatus === 'DISABLED') {
      return { bg: theme.colors.backgroundLight, text: theme.colors.textMuted };
    }
    if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROVISIONING') {
      return { bg: theme.colors.warningBackground, text: theme.colors.warning };
    }
    if (normalizedStatus === 'FAILED' || normalizedStatus === 'ERROR') {
      return { bg: theme.colors.errorBackground, text: theme.colors.error };
    }
    return { bg: 'rgba(30, 144, 255, 0.15)', text: theme.colors.primary };
  };

  const statusBadgeColors = getStatusBadgeColors(profile.esimStatus);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeColors.bg }]}>
            <Text style={[styles.statusText, { color: statusBadgeColors.text }]}>
              {statusLabel}
            </Text>
          </View>
          
          <Text style={styles.planName}>
            {profile.planDetails?.name || 'eSIM Plan'}
          </Text>
          
          {profile.planDetails?.location && (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationText}>{profile.planDetails.location}</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statLabel}>Data Balance</Text>
            <Text style={styles.statValue}>{formatDataSize(remainingData)}</Text>
            {profile.totalVolume && profile.totalVolume > 0 && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.max(0, 100 - usagePercent)}%` }]} />
              </View>
            )}
          </View>
          
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statLabel}>Expires</Text>
            <Text style={styles.statValue}>{formatExpiryDate(profile.expiredTime)}</Text>
          </View>
        </View>

        {/* ICCID Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>ICCID</Text>
          <TouchableOpacity onPress={handleCopyIccid} activeOpacity={0.8}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.infoValueMono}>{profile.iccid}</Text>
              <Ionicons name="copy-outline" size={16} color={theme.colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* QR Code Section */}
        {(profile.qrCodeUrl || profile.ac) && (
          <View style={styles.qrSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Install eSIM</Text>
            </View>
            
            {profile.qrCodeUrl && (
              <View style={styles.qrContainer}>
                <View style={styles.qrImageWrapper}>
                  <Image
                    source={{ uri: profile.qrCodeUrl }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.qrHint}>
                  Scan this QR code with your device's camera to install the eSIM
                </Text>
              </View>
            )}

            {profile.ac && (
              <View style={styles.activationCodeContainer}>
                <Text style={styles.activationLabel}>Activation Code</Text>
                <TouchableOpacity
                  style={styles.activationCodeBox}
                  onPress={handleCopyActivationCode}
                  activeOpacity={0.8}
                >
                  <Text style={styles.activationCode} numberOfLines={2}>
                    {profile.ac}
                  </Text>
                  <Ionicons name="copy-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.activationHint}>
                  Tap to copy • Use for manual eSIM installation
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push({
              pathname: '/topup',
              params: { iccid: profile.iccid },
            })}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryActionText}>Top Up Data</Text>
          </TouchableOpacity>

          {profile.order?.id && (
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push({
                pathname: '/order-detail',
                params: { orderId: profile.order!.id },
              })}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryActionText}>View Order</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Top-Up History */}
        {topupHistory.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>🕐 Top-Up History</Text>
            <View style={styles.historyList}>
              {topupHistory.map((item) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <Text style={styles.historyPlan}>{item.planCode}</Text>
                    <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      {formatPrice(convert(item.amountCents / 100))}
                    </Text>
                    <View style={[
                      styles.historyStatusBadge,
                      item.status === 'completed' && styles.historyStatusCompleted,
                      item.status === 'pending' && styles.historyStatusPending,
                    ]}>
                      <Text style={[
                        styles.historyStatusText,
                        item.status === 'completed' && styles.historyStatusTextCompleted,
                        item.status === 'pending' && styles.historyStatusTextPending,
                      ]}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

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
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 19,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  
  // Header Section (Flat)
  headerCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.xs,
    marginBottom: theme.spacing.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationIcon: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  
  // Stats Grid (Flat)
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  statLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xs,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xs,
  },
  
  // Info Section (Flat)
  infoCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoValueMono: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  
  // QR Section (Flat)
  qrSection: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  qrImageWrapper: {
    backgroundColor: '#fff',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  activationCodeContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  activationLabel: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  activationCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activationCode: {
    flex: 1,
    ...theme.typography.small,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  copyIcon: {
    fontSize: 18,
    marginLeft: theme.spacing.sm,
  },
  activationHint: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Actions (Flat)
  actions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  primaryActionText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  secondaryAction: {
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryActionText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  
  // History Section (Flat)
  historySection: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyList: {
    gap: theme.spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyLeft: {},
  historyPlan: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
  },
  historyDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  historyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  historyStatusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  historyStatusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  historyStatusText: {
    ...theme.typography.small,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  historyStatusTextCompleted: {
    color: '#22c55e',
  },
  historyStatusTextPending: {
    color: '#fbbf24',
  },
});




