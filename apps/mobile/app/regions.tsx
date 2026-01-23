import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

type Country = {
  code: string;
  name: string;
  type: number;
  locationLogo?: string;
};

type Region = {
  code: string;
  name: string;
  icon: string;
};

// Region definitions matching web app
const REGIONS: Region[] = [
  { code: 'asia', name: 'Asia', icon: '🌏' },
  { code: 'europe', name: 'Europe', icon: '🇪🇺' },
  { code: 'north-america', name: 'North America', icon: '🌎' },
  { code: 'south-america', name: 'South America', icon: '🌎' },
  { code: 'africa', name: 'Africa', icon: '🌍' },
  { code: 'oceania', name: 'Oceania', icon: '🌏' },
];

// Country to region mapping (simplified version)
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

export default function Regions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [regionCountries, setRegionCountries] = useState<Country[]>([]);

  const handleRegionPress = async (region: Region) => {
    if (selectedRegion === region.code) {
      // If already selected, deselect
      setSelectedRegion(null);
      setRegionCountries([]);
      return;
    }

    setSelectedRegion(region.code);
    setLoading(true);

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

      setRegionCountries(sorted);
    } catch (err) {
      console.error('Error fetching region countries:', err);
    } finally {
      setLoading(false);
    }
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

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse by Region</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Regions List with Inline Countries */}
        <View style={styles.groupedList}>
          {REGIONS.map((region, regionIndex) => (
            <View key={region.code}>
              {/* Region Item */}
              <TouchableOpacity
                style={[
                  styles.regionItem,
                  selectedRegion === region.code && styles.regionItemSelected,
                  regionIndex === REGIONS.length - 1 && selectedRegion !== region.code && styles.lastRegionItem
                ]}
                onPress={() => handleRegionPress(region)}
                activeOpacity={0.7}
              >
                <View style={styles.regionIcon}>
                  <Text style={styles.regionIconText}>{region.icon}</Text>
                </View>
                <Text style={styles.regionName}>{region.name}</Text>
                <Text style={styles.chevron}>
                  {selectedRegion === region.code ? '−' : '›'}
                </Text>
              </TouchableOpacity>

              {/* Expanded Countries */}
              {selectedRegion === region.code && (
                <>
                  {loading ? (
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
                            regionIndex === REGIONS.length - 1 && countryIndex === regionCountries.length - 1 && styles.lastCountryItem
                          ]}
                          onPress={() => handleCountryPress(country)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.countryIndent} />
                          <View style={styles.flagContainer}>
                            {country.locationLogo ? (
                              <Image
                                source={{ uri: country.locationLogo }}
                                style={styles.flag}
                                resizeMode="cover"
                              />
                            ) : (
                              <Ionicons name="globe-outline" size={20} color={theme.colors.textMuted} />
                            )}
                          </View>
                          <View style={styles.countryTextContainer}>
                            <Text style={styles.countryName}>{country.name}</Text>
                            <Text style={styles.viewPlansText}>View plans</Text>
                          </View>
                          <Text style={styles.chevron}>›</Text>
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

        <View style={{ height: 100 }} />
      </ScrollView>
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
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2, // Add bottom padding
  },
  groupedList: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.xl,
  },
  regionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  regionItemSelected: {
    backgroundColor: theme.colors.backgroundLight,
  },
  lastRegionItem: {
    borderBottomWidth: 0,
  },
  regionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  regionIconText: {
    fontSize: 20,
  },
  regionName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
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
  lastCountryItem: {
    borderBottomWidth: 0,
  },
  countryIndent: {
    width: 20,
  },
  flagContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  flag: {
    width: '100%',
    height: '100%',
  },
  flagFallback: {
    fontSize: 18,
  },
  countryTextContainer: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  viewPlansText: {
    fontSize: 13,
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
});
