import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { theme } from '../theme';
import { useToast } from '../context/ToastContext';

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

interface ChatMessage {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChatModal({ visible, onClose }: ChatModalProps) {
  const { user } = useUser();
  const toast = useToast();
  const flatListRef = useRef<FlatList>(null);
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Find or create ticket when modal opens
  useEffect(() => {
    if (visible && user?.primaryEmailAddress?.emailAddress) {
      findOrCreateTicket();
    }
  }, [visible, user]);

  // Start polling for new messages when ticket is loaded
  useEffect(() => {
    if (!ticket || !visible || !user?.primaryEmailAddress?.emailAddress) return;

    // Start polling every 3 seconds
    const interval = setInterval(async () => {
      try {
        const userEmail = user.primaryEmailAddress.emailAddress;
        const updatedTicket = await apiFetch<SupportTicket>(
          `/support/tickets/${ticket.id}`,
          { headers: { 'x-user-email': userEmail } }
        );
        setTicket(updatedTicket);
        buildMessages(updatedTicket);
      } catch (err) {
        console.error('Error polling ticket updates:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [ticket?.id, visible, user?.primaryEmailAddress?.emailAddress]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const findOrCreateTicket = async () => {
    if (!user?.primaryEmailAddress?.emailAddress) return;

    setLoading(true);
    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      
      // Try to find existing tickets
      const tickets = await apiFetch<SupportTicket[]>('/support/tickets', {
        headers: { 'x-user-email': userEmail },
      });

      // Find the most recent ticket (if any)
      const sortedTickets = (tickets || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      if (sortedTickets.length > 0) {
        // Use the most recent ticket
        const recentTicket = await apiFetch<SupportTicket>(
          `/support/tickets/${sortedTickets[0].id}`,
          { headers: { 'x-user-email': userEmail } }
        );
        setTicket(recentTicket);
        buildMessages(recentTicket);
      } else {
        // No ticket exists yet, will create on first message
        setTicket(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error finding ticket:', err);
      // Continue anyway - will create ticket on first message
      setTicket(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicket = async () => {
    if (!ticket || !user?.primaryEmailAddress?.emailAddress) return;

    try {
      const userEmail = user.primaryEmailAddress.emailAddress;
      const updatedTicket = await apiFetch<SupportTicket>(
        `/support/tickets/${ticket.id}`,
        { headers: { 'x-user-email': userEmail } }
      );
      setTicket(updatedTicket);
      buildMessages(updatedTicket);
    } catch (err) {
      console.error('Error fetching ticket updates:', err);
    }
  };

  const buildMessages = (ticketData: SupportTicket) => {
    const allMessages: ChatMessage[] = [];

    // Add original message as user message
    allMessages.push({
      id: ticketData.id,
      message: ticketData.message,
      isAdmin: false,
      createdAt: ticketData.createdAt,
    });

    // Add all replies
    if (ticketData.SupportTicketReply) {
      ticketData.SupportTicketReply.forEach((reply) => {
        allMessages.push({
          id: reply.id,
          message: reply.message,
          isAdmin: reply.isAdmin,
          createdAt: reply.createdAt,
        });
      });
    }

    // Sort by creation time
    allMessages.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    setMessages(allMessages);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    if (inputMessage.trim().length > 1000) {
      toast.warning('Message too long', 'Message must be no more than 1000 characters');
      return;
    }

    setSending(true);
    const messageText = inputMessage.trim();
    setInputMessage('');

    try {
      const userEmail = user?.primaryEmailAddress?.emailAddress;
      if (!userEmail) {
        toast.error('Error', 'Please sign in to send messages');
        setInputMessage(messageText);
        setSending(false);
        return;
      }

      // If no ticket exists, create one
      if (!ticket) {
        const newTicket = await apiFetch<SupportTicket>('/support/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: user.fullName || userEmail.split('@')[0],
            email: userEmail,
            message: messageText,
          }),
        });
        setTicket(newTicket);
        buildMessages(newTicket);
        toast.success('Message sent', 'Your message has been sent');
      } else {
        // Optimistically add message to UI immediately
        const tempMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          message: messageText,
          isAdmin: false,
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMessage]);

        // Add reply to existing ticket
        const replyResponse = await apiFetch(`/support/tickets/${ticket.id}/reply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail,
          },
          body: JSON.stringify({ message: messageText }),
        });
        
        // Small delay to ensure backend has processed
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Refresh ticket to get new reply (this will replace temp message with real one)
        const updatedTicket = await apiFetch<SupportTicket>(
          `/support/tickets/${ticket.id}`,
          { headers: { 'x-user-email': userEmail } }
        );
        setTicket(updatedTicket);
        buildMessages(updatedTicket);
        toast.success('Message sent', 'Your reply has been sent');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      toast.error('Error', errorMessage);
      setInputMessage(messageText); // Restore message on error
      // Remove temp message if it was added
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = !item.isAdmin;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.adminMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.adminBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isUser && styles.userMessageTime]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="chatbubbles" size={24} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Chat Support</Text>
              <Text style={styles.headerSubtitle}>
                {ticket ? `Ticket #${ticket.id.substring(0, 8)}` : 'We\'ll help you'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {loading && !ticket ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading chat...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyTitle}>Start a conversation</Text>
                <Text style={styles.emptyText}>
                  Send us a message and we'll get back to you soon!
                </Text>
              </View>
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={1000}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputMessage.trim() || sending) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Ionicons name="send" size={20} color={theme.colors.white} />
              )}
            </TouchableOpacity>
          </View>
          {inputMessage.length > 0 && (
            <Text style={styles.charCount}>
              {inputMessage.length}/1000
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  messagesList: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  adminMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: 4,
  },
  userMessageText: {
    color: theme.colors.white,
  },
  messageTime: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    maxHeight: 100,
    ...theme.typography.body,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
    opacity: 0.5,
  },
  charCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
});

