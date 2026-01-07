import { View, Text, StyleSheet } from 'react-native';
import BottomNav from '../src/components/BottomNav';
import { theme } from '../src/theme';

export default function VCash() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>v-Cash</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
      <BottomNav activeTab="v-cash" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 80, // Space for bottom nav
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});







