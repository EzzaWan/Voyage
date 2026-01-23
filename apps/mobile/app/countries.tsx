import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Image, Keyboard, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { AnimatedListItem } from '../src/components/AnimatedListItem';
import { AnimatedButton } from '../src/components/AnimatedButton';

type Country = {
  code: string;
  name: string;
  type: number;
  locationLogo?: string;
};

export default function Countries() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCountries();
  }, []);

  async function fetchCountries() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch<Country[]>('/countries');
      setCountries(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch countries';
      setError(errorMessage);
      console.error('Error fetching countries:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(country => 
      country.name.toLowerCase().includes(query) ||
      country.code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  const handleCountryPress = (country: Country) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/plans',
      params: {
        countryId: country.code,
        countryName: country.name,
        regionId: country.code,
        regionName: country.name,
      },
    });
  };

  const handleImageError = (code: string) => {
    setImageErrors(prev => ({ ...prev, [code]: true }));
  };

  const getFlagUrl = (country: Country) => {
    if (country.locationLogo) return country.locationLogo;
    return `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`;
  };

  const clearSearch = () => {
    setSearchQuery('');
    Keyboard.dismiss();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading countries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={48} color={theme.colors.warning} />
        <Text style={styles.errorTitle}>Unable to Load</Text>
        <Text style={styles.errorText}>{error}</Text>
        <AnimatedButton 
          style={styles.retryButton} 
          onPress={fetchCountries}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </AnimatedButton>
      </View>
    );
  }

  const renderCountryItem = ({ item, index }: { item: Country; index: number }) => {
    const hasError = imageErrors[item.code];
    
    return (
      <AnimatedListItem index={index}>
        <TouchableOpacity
          style={styles.countryItem}
          onPress={() => handleCountryPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.countryFlagContainer}>
            {!hasError ? (
              <Image
                source={{ uri: getFlagUrl(item) }}
                style={styles.flagIcon}
                resizeMode="cover"
                onError={() => handleImageError(item.code)}
              />
            ) : (
              <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
            )}
          </View>
          <View style={styles.countryInfo}>
            <Text style={styles.countryName}>{item.name}</Text>
            <Text style={styles.countryCode}>{item.code}</Text>
          </View>
          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </View>
        </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {/* Search Header */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search countries..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={clearSearch}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {searchQuery && (
          <Text style={styles.resultCount}>
            {filteredCountries.length} {filteredCountries.length === 1 ? 'result' : 'results'}
          </Text>
        )}
      </View>

      {/* Country List */}
      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.code}
        renderItem={renderCountryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No countries found</Text>
            <Text style={styles.emptySubtext}>Try a different search term</Text>
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
  
  // Loading State
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
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
    paddingHorizontal: theme.spacing.lg + theme.spacing.xs,
    paddingVertical: theme.spacing.sm + theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
  
  // Search
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  searchSection: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  resultCount: {
    marginTop: theme.spacing.sm,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // List
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 72,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 0, // Ensure no extra horizontal margin
  },
  countryFlagContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.round,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flagIcon: {
    width: '100%',
    height: '100%',
  },
  countryIconFallback: {
    fontSize: 24,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  countryCode: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});
