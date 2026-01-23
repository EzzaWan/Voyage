import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { REGION_NAMES, REGION_ICONS, Region, getCountriesForRegion } from '../src/utils/regions';

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
}

export default function RegionPlans() {
  const router = useRouter();
  const params = useLocalSearchParams<{ regionId: string; regionName: string }>();
  const regionId = params.regionId as Region;
  const regionName = params.regionName || REGION_NAMES[regionId] || regionId;
  const regionIcon = REGION_ICONS[regionId] || '🌐';
  
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (regionId === 'global') {
      // Special handling for global plans
      setLoading(false);
      return;
    }
    fetchCountries();
  }, [regionId]);

  const fetchCountries = async () => {
    try {
      setError(null);
      const data = await apiFetch<any>('/countries');
      const countriesArray = Array.isArray(data) ? data : (data.locationList || []);
      
      // Filter to region
      const regionCountryCodes = getCountriesForRegion(regionId);
      const regionCountries = countriesArray.filter((country: Country) =>
        regionCountryCodes.includes(country.code.toUpperCase())
      );
      
      // Sort alphabetically
      const sorted = regionCountries.sort((a: Country, b: Country) =>
        a.name.localeCompare(b.name)
      );
      
      setCountries(sorted);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load countries';
      setError(errorMessage);
      console.error('Error fetching region countries:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCountryFlag = (code: string) => {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const handleCountryPress = (country: Country) => {
    router.push({
      pathname: '/plans',
      params: {
        countryId: country.code,
        countryName: country.name,
      },
    });
  };

  // Loading
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading {regionName}...</Text>
        </View>
      </View>
    );
  }

  // Error
  if (error) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={colors.status.warning.main} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCountries}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Global region - show global plan options
  if (regionId === 'global') {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerCard}>
            <Text style={styles.headerIcon}>{regionIcon}</Text>
            <View>
              <Text style={styles.headerTitle}>Global eSIM Plans</Text>
              <Text style={styles.headerSubtitle}>Coverage in 100+ countries</Text>
            </View>
          </View>

          {/* Global Plan Options */}
          <View style={styles.globalOptions}>
            <TouchableOpacity
              style={styles.globalCard}
              onPress={() => router.push({
                pathname: '/plans',
                params: { countryId: 'GL-120', countryName: 'Global (120+ areas)' },
              })}
              activeOpacity={0.8}
            >
              <View style={styles.globalCardIcon}>
                <Text style={styles.globalCardIconText}>GL</Text>
              </View>
              <View style={styles.globalCardContent}>
                <Text style={styles.globalCardTitle}>Global (120+ areas)</Text>
                <Text style={styles.globalCardSubtitle}>120+ countries coverage</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.globalCard}
              onPress={() => router.push({
                pathname: '/plans',
                params: { countryId: 'GL-139', countryName: 'Global (130+ areas)' },
              })}
              activeOpacity={0.8}
            >
              <View style={styles.globalCardIcon}>
                <Text style={styles.globalCardIconText}>GL</Text>
              </View>
              <View style={styles.globalCardContent}>
                <Text style={styles.globalCardTitle}>Global (130+ areas)</Text>
                <Text style={styles.globalCardSubtitle}>130+ countries coverage</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const renderCountry = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryCard}
      onPress={() => handleCountryPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.countryFlag}>
        {item.locationLogo && !imageErrors[item.code] ? (
          <Image
            source={{ uri: item.locationLogo }}
            style={styles.flagImage}
            onError={() => setImageErrors(prev => ({ ...prev, [item.code]: true }))}
          />
        ) : (
          <Text style={styles.flagEmoji}>{getCountryFlag(item.code)}</Text>
        )}
      </View>
      <Text style={styles.countryName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <FlatList
        data={countries}
        renderItem={renderCountry}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerCard}>
              <Text style={styles.headerIcon}>{regionIcon}</Text>
              <View>
                <Text style={styles.headerTitle}>{regionName}</Text>
                <Text style={styles.headerSubtitle}>
                  {countries.length} countries available
                </Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="globe-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No countries found in this region</Text>
          </View>
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
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: theme.spacing.sm,
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
  errorText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
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
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  headerIcon: {
    fontSize: 48,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Country Card
  countryCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    minHeight: 100,
  },
  countryFlag: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  flagImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  flagEmoji: {
    fontSize: 24,
  },
  countryName: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  countryArrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  
  // Global Cards
  globalOptions: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  globalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  globalCardIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  globalCardIconText: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  globalCardContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  globalCardTitle: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
  },
  globalCardSubtitle: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  globalCardArrow: {
    fontSize: 20,
    color: theme.colors.textMuted,
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
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});




