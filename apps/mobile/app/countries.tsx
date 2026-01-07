import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

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

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCountryPress = (country: Country) => {
    router.push({
      pathname: '/plans',
      params: {
        countryId: country.code,
        countryName: country.name,
        regionId: country.code, // Use country code as regionId for single country plans
        regionName: country.name,
      },
    });
  };

  const handleImageError = (code: string) => {
    setImageErrors(prev => ({ ...prev, [code]: true }));
  };

  const getFlagUrl = (country: Country) => {
    if (country.locationLogo) return country.locationLogo;
    // Fallback to flagcdn if no logo (using w160 for better quality on retina)
    return `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading countries...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCountries}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search countries..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const hasError = imageErrors[item.code];
          
          return (
            <TouchableOpacity
              style={styles.countryItem}
              onPress={() => handleCountryPress(item)}
              activeOpacity={0.7}
            >
              <View style={styles.countryIconContainer}>
                {!hasError ? (
                  <Image
                    source={{ uri: getFlagUrl(item) }}
                    style={styles.flagIcon}
                    resizeMode="cover"
                    onError={() => handleImageError(item.code)}
                  />
                ) : (
                  <Text style={styles.countryIcon}>🌍</Text>
                )}
              </View>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
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
  searchContainer: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  countryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden', // Ensure flag stays within circle
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flagIcon: {
    width: '100%',
    height: '100%',
  },
  countryIcon: {
    fontSize: 20,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    flex: 1,
  },
  arrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
