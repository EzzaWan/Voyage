import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../theme';

type Tab = 'store' | 'my-esims' | 'v-cash' | 'profile';

interface BottomNavProps {
  activeTab: Tab;
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const router = useRouter();

  const tabs: Array<{ id: Tab; label: string; icon: string; route: string }> = [
    { id: 'store', label: 'Store', icon: '🛍️', route: '/' },
    { id: 'my-esims', label: 'My eSIMs', icon: '📱', route: '/my-esims' },
    { id: 'v-cash', label: 'v-Cash', icon: '💰', route: '/v-cash' },
    { id: 'profile', label: 'Profile', icon: '👤', route: '/profile' },
  ];

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const isActive = (tabId: Tab) => {
    return activeTab === tabId;
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = isActive(tab.id);
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {active && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 20, // Safe area for iPhone home indicator
    paddingTop: 8,
    paddingHorizontal: 8,
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    height: 70,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});

