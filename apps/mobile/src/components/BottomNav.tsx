import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Bottom navigation tabs: Home, V-Cash, My eSIMs, Profile
type Tab = 'store' | 'v-cash' | 'my-esims' | 'profile';

interface BottomNavProps {
  activeTab: Tab | 'support'; // Keeping support for backward compatibility if needed
}

const TABS: Array<{ id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap; route: string }> = [
  { id: 'store', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/' },
  { id: 'v-cash', label: 'V-Cash', icon: 'wallet-outline', activeIcon: 'wallet', route: '/v-cash' },
  { id: 'my-esims', label: 'My eSIMs', icon: 'phone-portrait-outline', activeIcon: 'phone-portrait', route: '/my-esims' },
  { id: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/profile' },
];

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
                <Ionicons
                  name={active ? tab.activeIcon : tab.icon}
                  size={24}
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                />
              </View>
              <Text 
                style={[styles.tabLabel, active && styles.tabLabelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {/* Active indicator bar */}
              {active && <View style={styles.indicatorBar} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const BOTTOM_SAFE_AREA = Platform.OS === 'ios' ? 34 : 16;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card, // Dark blue (#132742)
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: BOTTOM_SAFE_AREA,
    // Ensure consistent background in both dev and production
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 2,
    height: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    minHeight: 56,
    minWidth: 0, // Allow flex to work properly
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: 'transparent',
  },
  tabLabel: {
    ...theme.typography.small,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
    includeFontPadding: false, // Remove extra padding that can cause truncation
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  indicatorBar: {
    position: 'absolute',
    bottom: -4, // Position at bottom of content area (accounting for tab paddingVertical: 4)
    left: '50%',
    marginLeft: -20, // Half of width (40/2)
    width: 40,
    height: 2,
    backgroundColor: theme.colors.textMuted, // Light gray bar
    borderRadius: 1,
  },
});
