import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

interface SupportTicketReply {
  id: string;
  message: string;
  isAdmin: boolean;
  adminEmail?: string | null;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  name: string;
  email: string;
  orderId: string | null;
  device: string | null;
  message: string;
  createdAt: string;
  SupportTicketReply: SupportTicketReply[];
}

export default function MyTickets() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const isLoaded = userLoaded && authLoaded;
  
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      fetchTickets();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user]);

  const fetchTickets = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      const data = await apiFetch<SupportTicket[]>('/support/tickets', {
        headers: { 'x-user-email': userEmail },
      });
      
      // Sort by date (newest first)
      const sortedTickets = (data || []).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setTickets(sortedTickets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tickets';
      setError(errorMessage);
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Not signed in state
  if (isLoaded && !isSignedIn) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.content}>
          <View style={styles.signInCard}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💬</Text>
            </View>
            <Text style={styles.title}>Support Tickets</Text>
            <Text style={styles.description}>
              Sign in to view your support tickets and communicate with our team.
            </Text>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => router.push('/(auth)/sign-in')}
              activeOpacity={0.85}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </View>
    );
  }

  const renderTicket = ({ item }: { item: SupportTicket }) => {
    const replyCount = item.SupportTicketReply?.length || 0;
    const hasAdminReply = item.SupportTicketReply?.some(r => r.isAdmin);

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => router.push({
          pathname: '/ticket-detail',
          params: { ticketId: item.id },
        })}
        activeOpacity={0.8}
      >
        <View style={styles.ticketHeader}>
          <Text style={styles.ticketId}>#{item.id.substring(0, 8)}</Text>
          <View style={styles.badges}>
            {replyCount > 0 && (
              <View style={[styles.badge, hasAdminReply && styles.badgeAccent]}>
                <Text style={[styles.badgeText, hasAdminReply && styles.badgeTextAccent]}>
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <Text style={styles.ticketMessage} numberOfLines={2}>
          {item.message}
        </Text>
        
        <View style={styles.ticketFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
            <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.device && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="phone-portrait-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.ticketDevice}>{item.device}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.ticketArrow}>
          <Text style={styles.arrowText}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textMuted} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyTitle}>No Tickets Yet</Text>
            <Text style={styles.emptyText}>
              You haven't submitted any support tickets. Need help?
            </Text>
            <TouchableOpacity
              style={styles.newTicketButton}
              onPress={() => router.push('/contact')}
              activeOpacity={0.85}
            >
              <Text style={styles.newTicketButtonText}>Create New Ticket</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          tickets.length > 0 ? (
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerTitle}>Support Tickets</Text>
                  <Text style={styles.headerSubtitle}>
                    {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.newTicketHeaderButton}
                  onPress={() => router.push('/contact')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.newTicketHeaderButtonText}>+ New</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  listContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  
  // Sign In Card
  signInCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  signInButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '600' as const,
  },
  
  // Header
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingLeft: 16,
    paddingRight: 16,
    marginBottom: theme.spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  headerSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  newTicketHeaderButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  newTicketHeaderButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '500' as const,
  },
  
  // Ticket Card
  ticketCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  ticketId: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  badge: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  badgeAccent: {
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
  },
  badgeText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  badgeTextAccent: {
    color: theme.colors.primary,
  },
  ticketMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  ticketDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  ticketDevice: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  ticketArrow: {
    position: 'absolute',
    right: theme.spacing.md,
    top: '50%',
    marginTop: -10,
  },
  arrowText: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.lg,
  },
  newTicketButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newTicketButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '600' as const,
  },
});




