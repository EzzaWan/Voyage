import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';

type Country = {
  code: string;
  name: string;
  type: number;
  locationLogo?: string;
  lowestPrice?: number;
  currency?: string;
};

type Plan = {
  packageCode?: string;
  id?: string;
  name: string;
  price: number;
  currency?: string;
};

// Popular countries to show on homepage
const POPULAR_CODES = ['US', 'GB', 'FR', 'JP', 'ES', 'IT', 'TR', 'TH'];
const REGIONS = [
  { id: 'europe', name: 'Europe', icon: '🇪🇺' },
  { id: 'asia', name: 'Asia', icon: '🌏' },
  { id: 'north-america', name: 'N. America', icon: '🌎' },
  { id: 'south-america', name: 'S. America', icon: '🌎' },
  { id: 'africa', name: 'Africa', icon: '🌍' },
  { id: 'oceania', name: 'Oceania', icon: '🌏' },
];

export default function Home() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const isLoaded = userLoaded && authLoaded;
  
  const [popularCountries, setPopularCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch all countries
      const allCountries = await apiFetch<Country[]>('/countries');
      
      // Filter for popular ones and sort them by POPULAR_CODES order
      const popular = allCountries.filter(c => POPULAR_CODES.includes(c.code));
      const sortedPopular = popular.sort((a, b) => {
        return POPULAR_CODES.indexOf(a.code) - POPULAR_CODES.indexOf(b.code);
      });
      
      // Fetch prices for each country
      const countriesWithPrices = await Promise.all(
        sortedPopular.map(async (country) => {
          try {
            setLoadingPrices(prev => ({ ...prev, [country.code]: true }));
            const plans = await apiFetch<Plan[]>(`/countries/${country.code}/plans`);
            if (plans && plans.length > 0) {
              const prices = plans.map(p => p.price).filter(p => p > 0);
              const lowestPrice = prices.length > 0 ? Math.min(...prices) : undefined;
              const currency = plans[0]?.currency || 'USD';
              return { ...country, lowestPrice, currency };
            }
          } catch (err) {
            console.warn(`Failed to fetch plans for ${country.code}:`, err);
          } finally {
            setLoadingPrices(prev => ({ ...prev, [country.code]: false }));
          }
          return country;
        })
      );
      
      setPopularCountries(countriesWithPrices);
    } catch (err) {
      console.error('Failed to fetch popular countries', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getFlagUrl = (country: Country) => {
    if (country.locationLogo) return country.locationLogo;
    return `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`;
  };

  const handleImageError = (code: string) => {
    setImageErrors(prev => ({ ...prev, [code]: true }));
  };

  const handleCountryPress = (country: Country) => {
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

  const handleSearchPress = () => {
    router.push('/countries');
  };

  const getUserName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split('@')[0];
    }
    return 'Traveler';
  };

  const formatPrice = (price?: number, currency: string = 'USD') => {
    if (!price) return 'Check price';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {isLoaded && isSignedIn ? `Hi, ${getUserName()}!` : 'Welcome to Voyage'}
            </Text>
            <Text style={styles.tagline}>Global connectivity made simple</Text>
          </View>
          {isLoaded && !isSignedIn && (
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/sign-in')} 
              style={styles.signInButton}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
          {isLoaded && isSignedIn && (
            <TouchableOpacity onPress={() => router.push('/my-esims')} style={styles.myEsimsButton}>
              <Text style={styles.myEsimsIcon}>📱</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Connectivity without boundaries</Text>
            <Text style={styles.heroSubtitle}>
              Instant eSIM delivery for global travelers. No roaming fees.
            </Text>
          </View>
        </View>

        {/* Search Bar - Moved here */}
        <TouchableOpacity 
          style={styles.searchContainer} 
          onPress={handleSearchPress}
          activeOpacity={0.9}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Where do you need an eSIM?</Text>
        </TouchableOpacity>

        {/* Why Choose Voyage - Simplified */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}><Text style={styles.featureIcon}>⚡</Text></View>
            <Text style={styles.featureText}>Instant</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}><Text style={styles.featureIcon}>🌍</Text></View>
            <Text style={styles.featureText}>Global</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}><Text style={styles.featureIcon}>💸</Text></View>
            <Text style={styles.featureText}>Affordable</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureIconBox}><Text style={styles.featureIcon}>🛡️</Text></View>
            <Text style={styles.featureText}>Secure</Text>
          </View>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <TouchableOpacity onPress={() => router.push('/countries')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularList}>
            {popularCountries.map((country) => (
              <TouchableOpacity 
                key={country.code} 
                style={styles.popularCard}
                onPress={() => handleCountryPress(country)}
                activeOpacity={0.8}
              >
                <View style={styles.cardFlagContainer}>
                  {!imageErrors[country.code] ? (
                    <Image
                      source={{ uri: getFlagUrl(country) }}
                      style={styles.cardFlag}
                      resizeMode="cover"
                      onError={() => handleImageError(country.code)}
                    />
                  ) : (
                    <Text style={styles.cardFlagFallback}>🌍</Text>
                  )}
                </View>
                <Text style={styles.cardName} numberOfLines={1}>{country.name}</Text>
                {loadingPrices[country.code] ? (
                  <View style={styles.priceLoading}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                ) : (
                  <View style={styles.cardPriceBadge}>
                    <Text style={styles.cardPriceLabel}>Starting at</Text>
                    <Text style={styles.cardPriceText}>
                      {formatPrice(country.lowestPrice, country.currency)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
            
            {/* View All Card */}
            <TouchableOpacity 
              style={[styles.popularCard, styles.viewAllCard]}
              onPress={() => router.push('/countries')}
              activeOpacity={0.8}
            >
              <View style={styles.viewAllIconCircle}>
                <Text style={styles.viewAllIcon}>→</Text>
              </View>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Browse by Region */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Region</Text>
          <View style={styles.regionsGrid}>
            {REGIONS.map((region) => (
              <TouchableOpacity 
                key={region.id} 
                style={styles.regionCard}
                onPress={() => router.push('/countries')}
                activeOpacity={0.7}
              >
                <Text style={styles.regionIcon}>{region.icon}</Text>
                <Text style={styles.regionName}>{region.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing for nav bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
      <BottomNav activeTab="store" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  signInButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  signInButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  myEsimsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  myEsimsIcon: {
    fontSize: 20,
  },
  heroBanner: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: '#0f172a',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  searchContainer: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
    color: theme.colors.textSecondary,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  popularList: {
    paddingHorizontal: theme.spacing.lg,
    paddingRight: 8,
  },
  popularCard: {
    width: 140,
    height: 180,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'space-between',
  },
  cardFlagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardFlag: {
    width: '100%',
    height: '100%',
  },
  cardFlagFallback: {
    fontSize: 20,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
  },
  cardPriceBadge: {
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  cardPriceLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  cardPriceText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  priceLoading: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  viewAllCard: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
  },
  viewAllIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewAllIcon: {
    fontSize: 20,
    color: theme.colors.primary,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  regionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    gap: 12,
    marginTop: 12,
  },
  regionCard: {
    width: (Dimensions.get('window').width - 48 - 12) / 2,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  regionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
