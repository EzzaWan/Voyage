import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

// Updated to match Saily's tabs: Home, Credits, Help, Profile
type Tab = 'store' | 'v-cash' | 'support' | 'profile';

interface BottomNavProps {
  activeTab: Tab | 'my-esims'; // Keeping my-esims for backward compatibility if needed, but UI shows Saily structure
}

const TABS: Array<{ id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap; route: string }> = [
  { id: 'store', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/' },
  { id: 'v-cash', label: 'V-Cash', icon: 'wallet-outline', activeIcon: 'wallet', route: '/v-cash' },
  { id: 'support', label: 'Help', icon: 'help-circle-outline', activeIcon: 'help-circle', route: '/support' },
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
          // Map internal activeTab names to the new structure if needed
          const isSelected = activeTab === tab.id || (activeTab === 'my-esims' && tab.id === 'profile'); // Fallback or mapping? 
          // Actually, if we are on "my-esims", we probably aren't highlighting any of these perfectly unless we decided "My eSIMs" is under Home or Profile.
          // Let's just match exact ID for now.
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
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
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
    backgroundColor: theme.colors.card, // Navy
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: BOTTOM_SAFE_AREA,
    // Saily has a very subtle shadow or just border
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 8,
    height: 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 56,
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
    backgroundColor: 'transparent', // Saily doesn't use pill background for active tab icons, just color change usually.
    // But Voyage used pill. I'll remove pill bg to match Saily's cleaner look.
  },
  tabLabel: {
    ...theme.typography.tiny,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
