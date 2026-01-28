import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl, ActivityIndicator, TextInput, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';
import { useCurrency } from '../src/context/CurrencyContext';
import { getLowestPriceFromPlans } from '../src/utils/planUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  volume?: number; // in MB from API
  duration?: number;
  durationUnit?: string;
  fup1Mbps?: boolean;
};

// Popular countries to show on homepage
const POPULAR_CODES = ['US', 'GB', 'FR', 'JP', 'ES', 'IT', 'TR', 'TH'];

// Filter Tabs
const FILTER_TABS = [
  { id: 'country', label: 'Country' },
  { id: 'regional', label: 'Regional' },
  { id: 'global', label: 'Global' },
];

// Region definitions
type Region = {
  code: string;
  name: string;
  icon: any | null; // Image source (require() or null)
  fallbackIcon: keyof typeof Ionicons.glyphMap; // Fallback Ionicons icon
};

// Local region icons
const asiaIcon = require('../assets/regions/asia.png');
const europeIcon = require('../assets/regions/europe.png');
const northAmericaIcon = require('../assets/regions/north-america.png');
const southAmericaIcon = require('../assets/regions/south-america.png');
const africaIcon = require('../assets/regions/africa.png');
const oceaniaIcon = require('../assets/regions/oceania.png');
const globalIcon = require('../assets/regions/global.png');

const REGIONS: Region[] = [
  { code: 'asia', name: 'Asia', icon: asiaIcon, fallbackIcon: 'globe-outline' },
  { code: 'europe', name: 'Europe', icon: europeIcon, fallbackIcon: 'location-outline' },
  { code: 'north-america', name: 'North America', icon: northAmericaIcon, fallbackIcon: 'map-outline' },
  { code: 'south-america', name: 'South America', icon: southAmericaIcon, fallbackIcon: 'compass-outline' },
  { code: 'africa', name: 'Africa', icon: africaIcon, fallbackIcon: 'earth-outline' },
  { code: 'oceania', name: 'Oceania', icon: oceaniaIcon, fallbackIcon: 'water-outline' },
];

// Country to region mapping
const COUNTRY_TO_REGION: Record<string, string> = {
  // Asia
  AF: 'asia', AM: 'asia', AZ: 'asia', BH: 'asia', BD: 'asia', BT: 'asia',
  BN: 'asia', KH: 'asia', CN: 'asia', GE: 'asia', HK: 'asia', IN: 'asia',
  ID: 'asia', IR: 'asia', IQ: 'asia', IL: 'asia', JP: 'asia', JO: 'asia',
  KZ: 'asia', KW: 'asia', KG: 'asia', LA: 'asia', LB: 'asia', MY: 'asia',
  MV: 'asia', MN: 'asia', MM: 'asia', NP: 'asia', KP: 'asia', OM: 'asia',
  PK: 'asia', PH: 'asia', QA: 'asia', SA: 'asia', SG: 'asia', KR: 'asia',
  LK: 'asia', SY: 'asia', TW: 'asia', TJ: 'asia', TH: 'asia', TL: 'asia',
  TR: 'asia', TM: 'asia', AE: 'asia', UZ: 'asia', VN: 'asia', YE: 'asia',
  
  // Europe
  AL: 'europe', AD: 'europe', AT: 'europe', BY: 'europe', BE: 'europe',
  BA: 'europe', BG: 'europe', HR: 'europe', CY: 'europe', CZ: 'europe',
  DK: 'europe', EE: 'europe', FI: 'europe', FR: 'europe', DE: 'europe',
  GR: 'europe', HU: 'europe', IS: 'europe', IE: 'europe', IT: 'europe',
  LV: 'europe', LI: 'europe', LT: 'europe', LU: 'europe', MT: 'europe',
  MD: 'europe', MC: 'europe', ME: 'europe', NL: 'europe', MK: 'europe',
  NO: 'europe', PL: 'europe', PT: 'europe', RO: 'europe', RU: 'europe',
  SM: 'europe', RS: 'europe', SK: 'europe', SI: 'europe', ES: 'europe',
  SE: 'europe', CH: 'europe', UA: 'europe', GB: 'europe', VA: 'europe',
  
  // North America
  CA: 'north-america', MX: 'north-america', US: 'north-america',
  BZ: 'north-america', CR: 'north-america', SV: 'north-america',
  GT: 'north-america', HN: 'north-america', NI: 'north-america',
  PA: 'north-america',
  
  // South America
  AR: 'south-america', BO: 'south-america', BR: 'south-america',
  CL: 'south-america', CO: 'south-america', EC: 'south-america',
  GY: 'south-america', PY: 'south-america', PE: 'south-america',
  SR: 'south-america', UY: 'south-america', VE: 'south-america',
  
  // Africa
  DZ: 'africa', AO: 'africa', BJ: 'africa', BW: 'africa', BF: 'africa',
  BI: 'africa', CV: 'africa', CM: 'africa', CF: 'africa', TD: 'africa',
  KM: 'africa', CG: 'africa', CD: 'africa', CI: 'africa', DJ: 'africa',
  EG: 'africa', GQ: 'africa', ER: 'africa', SZ: 'africa', ET: 'africa',
  GA: 'africa', GM: 'africa', GH: 'africa', GN: 'africa', GW: 'africa',
  KE: 'africa', LS: 'africa', LR: 'africa', LY: 'africa', MG: 'africa',
  MW: 'africa', ML: 'africa', MR: 'africa', MU: 'africa', MA: 'africa',
  MZ: 'africa', NA: 'africa', NE: 'africa', NG: 'africa', RW: 'africa',
  ST: 'africa', SN: 'africa', SC: 'africa', SL: 'africa', SO: 'africa',
  ZA: 'africa', SS: 'africa', SD: 'africa', TZ: 'africa', TG: 'africa',
  TN: 'africa', UG: 'africa', ZM: 'africa', ZW: 'africa',
  
  // Oceania
  AU: 'oceania', NZ: 'oceania', FJ: 'oceania', PG: 'oceania',
  NC: 'oceania', PF: 'oceania', WS: 'oceania', SB: 'oceania',
  VU: 'oceania',
};

function getCountriesForRegion(regionCode: string): string[] {
  return Object.entries(COUNTRY_TO_REGION)
    .filter(([_, region]) => region === regionCode)
    .map(([code]) => code);
}

export default function Home() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { convert, convertFromCurrency, formatPrice: formatCurrencyPrice } = useCurrency();
  const isLoaded = userLoaded && authLoaded;
  
  const [popularCountries, setPopularCountries] = useState<Country[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('country');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionCountries, setRegionCountries] = useState<Country[]>([]);
  const [loadingRegionCountries, setLoadingRegionCountries] = useState(false);
  const [globalPlans, setGlobalPlans] = useState<Plan[]>([]);
  const [loadingGlobalPlans, setLoadingGlobalPlans] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const countriesData = await apiFetch<Country[]>('/countries');
      
      // Filter to only show countries (type === 1), exclude multi-region plans (type === 2)
      const countriesOnly = countriesData.filter((item: Country) => 
        item.type === 1 || !item.type
      );
      
      // Sort all countries alphabetically
      const sortedAllCountries = countriesOnly.sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setAllCountries(sortedAllCountries);
      
      // Fetch popular countries with prices
      const popular = countriesData.filter(c => POPULAR_CODES.includes(c.code));
      const sortedPopular = popular.sort((a, b) => {
        return POPULAR_CODES.indexOf(a.code) - POPULAR_CODES.indexOf(b.code);
      });
      
      const countriesWithPrices = await Promise.all(
        sortedPopular.map(async (country) => {
          try {
            setLoadingPrices(prev => ({ ...prev, [country.code]: true }));
            const plans = await apiFetch<Plan[]>(`/countries/${country.code}/plans`);
            if (plans && plans.length > 0) {
              // Use the same filtering logic as web app - only get price from plans we actually sell
              const lowestPrice = getLowestPriceFromPlans(plans);
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
      console.error('Failed to fetch countries', err);
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

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return 'View plans';
    // Convert from the source currency (from API) to user's selected currency
    const convertedPrice = currency ? convertFromCurrency(price, currency) : convert(price);
    return `From ${formatCurrencyPrice(convertedPrice)}`;
  };

  const handleTabPress = async (tabId: string) => {
    setActiveTab(tabId);
    // Reset region selection when switching tabs
    if (tabId !== 'regional') {
      setSelectedRegion(null);
      setRegionCountries([]);
    }
    if (tabId === 'global') {
      // Load global plans within the tab
      await fetchGlobalPlans();
    }
  };

  const fetchGlobalPlans = async () => {
    if (globalPlans.length > 0) return; // Already loaded
    
    try {
      setLoadingGlobalPlans(true);
      // Fetch GL-139 global plans
      const plans = await apiFetch<Plan[]>(`/countries/GL-139/plans`);
      if (plans && plans.length > 0) {
        // Filter out 1GB 365 day plans
        const filtered = plans.filter(plan => {
          // Check by plan name first (most reliable) - case insensitive
          const planName = (plan.name || '').toLowerCase();
          
          // Check for "1gb" and "365" in the name
          const has1GB = planName.includes('1gb') || planName.includes('1 gb');
          const has365 = planName.includes('365') || planName.includes('365days') || planName.includes('365 days');
          
          if (has1GB && has365) {
            return false; // Exclude this plan
          }
          
          // Also check packageCode/slug for pattern like "GL-139_1_365"
          const packageCode = (plan.packageCode || plan.id || '').toLowerCase();
          if (packageCode.includes('_1_365') || packageCode.includes('-1-365')) {
            return false;
          }
          
          // Also check by volume and duration as backup
          let gb = 0;
          if (plan.volume) {
            if (plan.volume > 1000000) {
              // Bytes to GB
              gb = plan.volume / 1024 / 1024 / 1024;
            } else {
              // MB to GB
              gb = plan.volume / 1024;
            }
          }
          
          const duration = plan.duration || 0;
          const durationUnit = (plan.durationUnit || 'day').toLowerCase();
          
          // Exclude 1GB 365 day plans (with some tolerance for rounding)
          if (gb >= 0.9 && gb <= 1.1 && duration === 365 && durationUnit === 'day') {
            return false;
          }
          
          return true;
        });
        
        // Sort by price ascending
        const sorted = filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        
        setGlobalPlans(sorted);
      }
    } catch (err) {
      console.error('Error fetching global plans:', err);
    } finally {
      setLoadingGlobalPlans(false);
    }
  };

  const handleGlobalPlanPress = (plan: Plan) => {
    router.push({
      pathname: '/plan-detail',
      params: {
        planId: plan.packageCode || plan.id || '',
        countryName: 'Global',
      },
    });
  };

  const handleRegionPress = async (region: Region) => {
    if (selectedRegion === region.code) {
      // If already selected, deselect
      setSelectedRegion(null);
      setRegionCountries([]);
      return;
    }

    setSelectedRegion(region.code);
    setLoadingRegionCountries(true);

    try {
      // Fetch all countries
      const countriesData = await apiFetch<Country[] | { locationList: Country[] }>('/countries');
      const countriesArray = Array.isArray(countriesData) 
        ? countriesData 
        : (countriesData.locationList || []);

      // Filter to only countries (type === 1)
      const countriesOnly = countriesArray.filter((item: Country) => 
        item.type === 1 || !item.type
      );

      // Get country codes for this region
      const regionCountryCodes = getCountriesForRegion(region.code);
      
      // Filter countries that belong to this region
      const filtered = countriesOnly.filter((country: Country) =>
        regionCountryCodes.includes(country.code.toUpperCase())
      );

      // Sort alphabetically
      const sorted = filtered.sort((a: Country, b: Country) =>
        a.name.localeCompare(b.name)
      );

      // Fetch prices for each country in the region
      const countriesWithPrices = await Promise.all(
        sorted.map(async (country) => {
          try {
            setLoadingPrices(prev => ({ ...prev, [country.code]: true }));
            const plans = await apiFetch<Plan[]>(`/countries/${country.code}/plans`);
            if (plans && plans.length > 0) {
              // Use the same filtering logic as web app - only get price from plans we actually sell
              const lowestPrice = getLowestPriceFromPlans(plans);
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

      setRegionCountries(countriesWithPrices);
    } catch (err) {
      console.error('Error fetching region countries:', err);
    } finally {
      setLoadingRegionCountries(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {/* Fixed Header Area */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Data plans</Text>
        
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabsContainer}
        >
          {FILTER_TABS.map((tab) => (
            <TouchableOpacity 
              key={tab.id} 
              style={[
                styles.tab, 
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => handleTabPress(tab.id)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Regional Tab Content - Accordion Style */}
        {activeTab === 'regional' && !searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Browse by Region</Text>
            <View style={styles.groupedList}>
              {REGIONS.map((region, regionIndex) => (
                <View key={region.code}>
                  {/* Region Item */}
                  <TouchableOpacity
                    style={[
                      styles.regionItem,
                      selectedRegion === region.code && styles.regionItemSelected,
                      regionIndex === REGIONS.length - 1 && selectedRegion !== region.code && styles.lastListItem
                    ]}
                    onPress={() => handleRegionPress(region)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.regionIcon}>
                      {region.icon ? (
                        <Image 
                          source={region.icon} 
                          style={styles.regionIconImage}
                          resizeMode="contain"
                          defaultSource={region.icon}
                        />
                      ) : (
                        <Ionicons name={region.fallbackIcon} size={24} color={theme.colors.primary} />
                      )}
                    </View>
                    <Text style={styles.regionName}>{region.name}</Text>
                    <Text style={[
                      styles.chevron,
                      selectedRegion === region.code && styles.chevronExpanded
                    ]}>
                      {selectedRegion === region.code ? '−' : '›'}
                    </Text>
                  </TouchableOpacity>

                  {/* Expanded Countries */}
                  {selectedRegion === region.code && (
                    <>
                      {loadingRegionCountries ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={theme.colors.primary} />
                          <Text style={styles.loadingText}>Loading countries...</Text>
                        </View>
                      ) : regionCountries.length > 0 ? (
                        <>
                          {regionCountries.map((country, countryIndex) => (
                            <TouchableOpacity
                              key={country.code}
                              style={[
                                styles.countryItem,
                                regionIndex === REGIONS.length - 1 && countryIndex === regionCountries.length - 1 && styles.lastListItem
                              ]}
                              onPress={() => handleCountryPress(country)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.countryIndent} />
                              <View style={styles.flagContainer}>
                                {!imageErrors[country.code] ? (
                                  <Image
                                    source={{ uri: getFlagUrl(country) }}
                                    style={styles.flag}
                                    resizeMode="cover"
                                    onError={() => handleImageError(country.code)}
                                  />
                                ) : (
                                  <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
                                )}
                              </View>
                              <View style={styles.listItemContent}>
                                <Text style={styles.countryName}>{country.name}</Text>
                                {loadingPrices[country.code] ? (
                                  <ActivityIndicator size="small" color={theme.colors.textMuted} />
                                ) : (
                                  <Text style={styles.priceText}>{formatPrice(country.lowestPrice, country.currency)}</Text>
                                )}
                              </View>
                              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                            </TouchableOpacity>
                          ))}
                        </>
                      ) : (
                        <View style={styles.emptyContainer}>
                          <Text style={styles.emptyText}>No countries found</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Country Tab Content - Popular Destinations Group - Hide when searching or regional tab */}
        {activeTab === 'country' && !searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <View style={styles.groupedList}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
          ) : (
            popularCountries.map((country, index) => (
              <TouchableOpacity 
                key={country.code} 
                style={[
                  styles.listItem,
                  index === popularCountries.length - 1 && styles.lastListItem
                ]}
                onPress={() => handleCountryPress(country)}
                activeOpacity={0.7}
              >
                <View style={styles.flagContainer}>
                  {!imageErrors[country.code] ? (
                    <Image
                      source={{ uri: getFlagUrl(country) }}
                      style={styles.flag}
                      resizeMode="cover"
                      onError={() => handleImageError(country.code)}
                    />
                  ) : (
                    <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
                  )}
                </View>
                
                <View style={styles.listItemContent}>
                  <Text style={styles.countryName}>{country.name}</Text>
                  {loadingPrices[country.code] ? (
                    <ActivityIndicator size="small" color={theme.colors.textMuted} />
                  ) : (
                    <Text style={styles.priceText}>{formatPrice(country.lowestPrice, country.currency)}</Text>
                  )}
                </View>
                
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} style={styles.chevron} />
              </TouchableOpacity>
            ))
          )}
            </View>
          </>
        )}

        {/* All Destinations Group - Only show for country tab */}
        {activeTab === 'country' && (
          <>
            <Text style={styles.sectionTitle}>All destinations</Text>
            <View style={styles.groupedList}>
              {allCountries
                .filter(country => 
                  !searchQuery || 
                  country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  country.code.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((country, index) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.listItem,
                    index === allCountries.length - 1 && styles.lastListItem
                  ]}
                  onPress={() => handleCountryPress(country)}
                  activeOpacity={0.7}
                >
                  <View style={styles.flagContainer}>
                    {!imageErrors[country.code] ? (
                      <Image
                        source={{ uri: getFlagUrl(country) }}
                        style={styles.flag}
                        resizeMode="cover"
                        onError={() => handleImageError(country.code)}
                      />
                    ) : (
                      <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
                    )}
                  </View>
                  
                  <View style={styles.listItemContent}>
                    <Text style={styles.countryName}>{country.name}</Text>
                    {loadingPrices[country.code] ? (
                      <ActivityIndicator size="small" color={theme.colors.textMuted} />
                    ) : (
                      <Text style={styles.priceText}>{formatPrice(country.lowestPrice, country.currency)}</Text>
                    )}
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Global Tab Content */}
        {activeTab === 'global' && !searchQuery && (
          <>
            <Text style={styles.sectionTitle}>Global Plans</Text>
            <View style={styles.groupedList}>
              {loadingGlobalPlans ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} />
              ) : globalPlans.length > 0 ? (
                globalPlans.map((plan, index) => {
                  const planPrice = plan.price || 0;
                  const planCurrency = plan.currency || 'USD';
                  
                  // Format data size (handle both MB and bytes)
                  let dataSize = '';
                  if (plan.volume) {
                    if (plan.volume > 1000000) {
                      // Bytes to GB
                      const gb = plan.volume / 1024 / 1024 / 1024;
                      dataSize = gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
                    } else {
                      // MB to GB
                      const gb = plan.volume / 1024;
                      if (gb >= 1) {
                        dataSize = gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`;
                      } else {
                        dataSize = `${plan.volume} MB`;
                      }
                    }
                  }
                  
                  // Format duration
                  const duration = plan.duration 
                    ? `${plan.duration} ${plan.durationUnit === 'month' ? 'Month' : 'Day'}${plan.duration !== 1 ? 's' : ''}` 
                    : '';
                  
                  // Plan name is just data size and duration
                  const planName = dataSize && duration ? `${dataSize} ${duration}` : (dataSize || duration || 'Global Plan');
                  
                  return (
                    <TouchableOpacity
                      key={plan.packageCode || plan.id || index}
                      style={[
                        styles.listItem,
                        index === globalPlans.length - 1 && styles.lastListItem
                      ]}
                      onPress={() => handleGlobalPlanPress(plan)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.flagContainer, styles.globalIconContainer]}>
                        <Image 
                          source={globalIcon} 
                          style={styles.globalIconImage}
                          resizeMode="contain"
                        />
                      </View>
                      
                      <View style={styles.listItemContent}>
                        <Text style={styles.countryName}>{planName}</Text>
                        {planPrice > 0 && (
                          <Text style={styles.priceText}>
                            {planCurrency && planCurrency !== 'USD' 
                              ? new Intl.NumberFormat('en-US', {
                                  style: 'currency',
                                  currency: planCurrency.toUpperCase(),
                                }).format(convertFromCurrency(planPrice, planCurrency))
                              : formatCurrencyPrice(convert(planPrice))}
                          </Text>
                        )}
                      </View>
                      
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No global plans available</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="store" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Voyo Navy (Saily is Light Gray)
  },
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24, // Saily uses large bold headers
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs, // Minimal margin
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card, // Slightly lighter than background
    marginLeft: 16, // Explicit 16px margin
    marginRight: 16, // Explicit 16px margin
    paddingHorizontal: theme.spacing.md,
    height: 48, // Standard touch height
    borderRadius: theme.borderRadius.lg, // Rounded like Saily
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
  },
  tabsContainer: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  tab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
    backgroundColor: theme.colors.card, // Inactive tab background
    marginRight: theme.spacing.sm,
  },
  activeTab: {
    backgroundColor: theme.colors.primary, // Active tab (Blue for Voyo, Yellow for Saily)
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  activeTabText: {
    color: theme.colors.white,
  },
  scrollContent: {
    paddingTop: theme.spacing.lg,
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18, // Saily "Top picks" header
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  groupedList: {
    backgroundColor: theme.colors.card, // Grouped list background (Lighter Navy)
    borderRadius: theme.borderRadius.xl, // Large rounding for the group
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
    marginHorizontal: 0, // Ensure no extra horizontal margin (padding is on parent)
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border, // Subtle divider
  },
  lastListItem: {
    borderBottomWidth: 0,
  },
  flagContainer: {
    width: 40, // Saily flags are substantial
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flag: {
    width: '100%',
    height: '100%',
  },
  listItemContent: {
    flex: 1,
    justifyContent: 'center',
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 2,
  },
  priceText: {
    fontSize: 14,
    color: theme.colors.textMuted, // "From US$..."
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  chevronExpanded: {
    color: theme.colors.white,
  },
  // Region styles
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  regionItemSelected: {
    backgroundColor: theme.colors.backgroundLight,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingRight: theme.spacing.md,
    paddingLeft: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.backgroundLight,
  },
  countryIndent: {
    width: 20,
  },
  regionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  regionIconImage: {
    width: 32,
    height: 32,
    // Using 256px source images for crisp rendering on high-DPI displays
  },
  regionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.sm,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  emptyContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  globalIconContainer: {
    // Drop shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    // Drop shadow for Android
    elevation: 4,
  },
  globalIconImage: {
    width: 24,
    height: 24,
  },
});
