import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export function PriceComparison() {
  const competitors = [
    { name: 'Airalo', premium: '+25%' },
    { name: 'Holafly', premium: '+34%' },
    { name: 'Saily', premium: '+28%' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Save up to 35%</Text>
          <Text style={styles.subtitle}>Vs leading providers on similar plans</Text>
        </View>
        <View style={styles.infoBadge}>
          <Ionicons name="information-circle-outline" size={12} color={theme.colors.textMuted} style={styles.infoBadgeIcon} />
          <Text style={styles.infoBadgeText}>Based on public prices</Text>
        </View>
      </View>

      {/* Comparison Grid */}
      <View style={styles.grid}>
        {competitors.map((competitor) => (
          <View key={competitor.name} style={styles.competitorBox}>
            <Text style={styles.competitorName}>{competitor.name}</Text>
            <Text style={styles.competitorPremium}>{competitor.premium}</Text>
          </View>
        ))}
        
        {/* Voyage - Highlighted */}
        <View style={styles.voyageBox}>
          <Text style={styles.voyageName}>Voyage</Text>
          <View style={styles.bestBadge}>
            <Ionicons name="checkmark" size={10} color={theme.colors.white} style={styles.bestBadgeIcon} />
            <Text style={styles.bestBadgeText}>Best</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoBadgeIcon: {
    marginRight: 4,
  },
  infoBadgeText: {
    fontSize: 9,
    color: theme.colors.textMuted,
  },
  
  // Grid
  grid: {
    flexDirection: 'row',
  },
  competitorBox: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    opacity: 0.7,
    minHeight: 60,
    marginRight: theme.spacing.sm,
  },
  competitorName: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  competitorPremium: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  
  // Voyage
  voyageBox: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  voyageName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 4,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.round,
  },
  bestBadgeIcon: {
    fontSize: 10,
    color: theme.colors.white,
    marginRight: 4,
  },
  bestBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.white,
  },
});






