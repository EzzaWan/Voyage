import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';
import { getRecentlyViewed, clearRecentlyViewed, RecentlyViewedItem } from '../utils/recentlyViewed';

interface RecentlyViewedProps {
  maxItems?: number;
  onNavigate?: () => void;
}

export function RecentlyViewed({ maxItems = 5, onNavigate }: RecentlyViewedProps) {
  const router = useRouter();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    const recent = await getRecentlyViewed();
    setItems(recent.slice(0, maxItems));
    setLoading(false);
  };

  const handleClear = async () => {
    await clearRecentlyViewed();
    setItems([]);
  };

  const handleItemPress = (item: RecentlyViewedItem) => {
    if (item.type === 'country') {
      router.push({
        pathname: '/plans',
        params: { countryId: item.code || item.id, countryName: item.name },
      });
    } else if (item.type === 'region') {
      router.push({
        pathname: '/region-plans',
        params: { regionId: item.code || item.id, regionName: item.name },
      });
    }
    onNavigate?.();
  };

  const getCountryFlag = (code: string) => {
    if (!code || code.includes('-')) return '🌐';
    try {
      const codePoints = code
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌐';
    }
  };

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🕐</Text>
          <Text style={styles.headerTitle}>Recently Viewed</Text>
        </View>
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.clearButton}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.itemIcon}>
              {item.type === 'country' ? getCountryFlag(item.code || '') : '🌐'}
            </Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
  },
  clearButton: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  scrollContent: {
    gap: theme.spacing.sm,
  },
  item: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 80,
  },
  itemIcon: {
    fontSize: 16,
  },
  itemName: {
    ...theme.typography.small,
    color: theme.colors.text,
    maxWidth: 80,
  },
});






