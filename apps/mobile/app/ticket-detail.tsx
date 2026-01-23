import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useToast } from '../src/context/ToastContext';

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

export default function TicketDetail() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useUser();
  const params = useLocalSearchParams<{ ticketId: string }>();
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.primaryEmailAddress?.emailAddress && params.ticketId) {
      fetchTicket();
    }
  }, [user, params.ticketId]);

  const fetchTicket = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !params.ticketId) return;

    try {
      setError(null);
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      const data = await apiFetch<SupportTicket>(`/support/tickets/${params.ticketId}`, {
        headers: { 'x-user-email': userEmail },
      });
      
      setTicket(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load ticket';
      setError(errorMessage);
      console.error('Error fetching ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!user?.primaryEmailAddress?.emailAddress || !params.ticketId) return;
    
    if (!replyMessage.trim()) {
      toast.warning('Error', 'Please enter a message');
      return;
    }
    if (replyMessage.trim().length < 10) {
      toast.warning('Error', 'Message must be at least 10 characters');
      return;
    }
    if (replyMessage.trim().length > 1000) {
      toast.warning('Error', 'Message must be no more than 1000 characters');
      return;
    }

    setReplying(true);
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      await apiFetch(`/support/tickets/${params.ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
        },
        body: JSON.stringify({ message: replyMessage.trim() }),
      });

      toast.success('Success', 'Your reply has been sent');
      setReplyMessage('');
      fetchTicket(); // Refresh to show new reply
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reply';
      toast.error('Error', errorMessage);
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading ticket...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !ticket) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color={theme.colors.warning} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorText}>{error || 'Ticket not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const replies = ticket.SupportTicketReply || [];

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ticket #{ticket.id.substring(0, 8)}</Text>
          <Text style={styles.headerDate}>{formatDate(ticket.createdAt)}</Text>
        </View>

        {/* Original Message */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Your Message</Text>
          </View>
          <View style={styles.messageCard}>
            <View style={styles.messageHeader}>
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
              <Text style={styles.messageDate}>{formatDate(ticket.createdAt)}</Text>
            </View>
            <Text style={styles.messageText}>{ticket.message}</Text>
            
            {(ticket.orderId || ticket.device) && (
              <View style={styles.messageFooter}>
                {ticket.orderId && (
                  <Text style={styles.messageMeta}>
                    Order: <Text style={styles.messageMetaValue}>{ticket.orderId.substring(0, 8)}...</Text>
                  </Text>
                )}
                {ticket.device && (
                  <Text style={styles.messageMeta}>
                    Device: <Text style={styles.messageMetaValue}>{ticket.device}</Text>
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Replies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            💬 Responses {replies.length > 0 ? `(${replies.length})` : ''}
          </Text>
          
          {replies.length === 0 ? (
            <View style={styles.noRepliesCard}>
              <Text style={styles.noRepliesIcon}>⏳</Text>
              <Text style={styles.noRepliesText}>
                No responses yet. Our support team will get back to you soon.
              </Text>
            </View>
          ) : (
            <View style={styles.repliesList}>
              {replies.map((reply) => (
                <View 
                  key={reply.id} 
                  style={[
                    styles.replyCard,
                    reply.isAdmin && styles.replyCardAdmin
                  ]}
                >
                  <View style={styles.replyHeader}>
                    <View style={[
                      styles.replyBadge,
                      reply.isAdmin && styles.replyBadgeAdmin
                    ]}>
                      <Text style={[
                        styles.replyBadgeText,
                        reply.isAdmin && styles.replyBadgeTextAdmin
                      ]}>
                        {reply.isAdmin ? 'Support Team' : 'You'}
                      </Text>
                    </View>
                    <Text style={styles.replyDate}>{formatDate(reply.createdAt)}</Text>
                  </View>
                  <Text style={styles.replyText}>{reply.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Reply Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✉️ Add Reply</Text>
          <View style={styles.replyForm}>
            <TextInput
              style={styles.replyInput}
              value={replyMessage}
              onChangeText={setReplyMessage}
              placeholder="Type your reply here (min 10 characters)..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!replying}
            />
            <View style={styles.replyFormFooter}>
              <Text style={styles.charCount}>{replyMessage.length}/1000</Text>
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (replying || replyMessage.trim().length < 10) && styles.sendButtonDisabled
                ]}
                onPress={handleReply}
                disabled={replying || replyMessage.trim().length < 10}
                activeOpacity={0.85}
              >
                {replying ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.sendButtonText}>Send Reply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  
  // Loading & Error
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
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
  headerTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  headerDate: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  
  // Sections
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  
  // Original Message
  messageCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  youBadge: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  youBadgeText: {
    ...theme.typography.small,
    color: theme.colors.text,
    fontWeight: '600',
  },
  messageDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  messageFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 4,
  },
  messageMeta: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  messageMetaValue: {
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  
  // No Replies
  noRepliesCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  noRepliesIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  noRepliesText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Replies
  repliesList: {
    gap: theme.spacing.sm,
  },
  replyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  replyCardAdmin: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  replyBadge: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  replyBadgeAdmin: {
    backgroundColor: theme.colors.primary,
  },
  replyBadgeText: {
    ...theme.typography.small,
    color: theme.colors.text,
    fontWeight: '600',
  },
  replyBadgeTextAdmin: {
    color: theme.colors.white,
  },
  replyDate: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  replyText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: 22,
  },
  
  // Reply Form
  replyForm: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  replyInput: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    color: theme.colors.text,
    ...theme.typography.body,
    minHeight: 120,
  },
  replyFormFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  charCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '500' as const,
  },
});




