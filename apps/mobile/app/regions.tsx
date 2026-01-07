import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

type Location = {
  code: string;
  name: string;
  type: number; // 1 for country, 2 for region
  locationLogo?: string;
};

export default function Regions() {
  const router = useRouter();
  const params = useLocalSearchParams<{ countryId: string; countryName: string }>();
  const [regions, setRegions] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.countryId) {
      fetchRegions();
    }
  }, [params.countryId]);

  async function fetchRegions() {
    try {
      setLoading(true);
      setError(null);
      
      const allLocations = await apiFetch<Location[]>('/countries');
      const filteredRegions = Array.isArray(allLocations) 
        ? allLocations.filter(loc => loc.type === 2) 
        : [];
      setRegions(filteredRegions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch regions';
      setError(errorMessage);
      console.error('Error fetching regions:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleRegionPress = (region: Location) => {
    router.push({
      pathname: '/plans',
      params: {
        countryId: params.countryId,
        countryName: params.countryName,
        regionId: region.code,
        regionName: region.name,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Regions for {params.countryName || '...'}</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        <Text style={styles.loadingText}>Loading regions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Regions for {params.countryName || '...'}</Text>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (regions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Regions for {params.countryName || '...'}</Text>
        <Text style={styles.emptyText}>No regions available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Regions for {params.countryName}</Text>
      <FlatList
        data={regions}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => handleRegionPress(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
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
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  arrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});
