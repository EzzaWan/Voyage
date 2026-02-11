import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import ChatModal from './ChatModal';

// Replace with your actual WhatsApp business number (format: country code + number, no + or spaces)
const WHATSAPP_NUMBER = '1234567890'; // Example: '1234567890' for US number

export default function FloatingChatButton() {
  const [showOptions, setShowOptions] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  const handleChatInApp = () => {
    setShowOptions(false);
    setShowChatModal(true);
  };

  const handleWhatsApp = async () => {
    setShowOptions(false);
    try {
      // Format: whatsapp://send?phone=1234567890 or https://wa.me/1234567890
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback: try the app scheme
        const appUrl = `whatsapp://send?phone=${WHATSAPP_NUMBER}`;
        await Linking.openURL(appUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      // Fallback to web version
      await Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}`);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowOptions(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.white} />
      </TouchableOpacity>

      {/* Options Bottom Sheet Modal */}
      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.modalContent}>
            {/* Handle */}
            <View style={styles.modalHandle} />
            
            {/* Title */}
            <Text style={styles.modalTitle}>Chat to support</Text>
            
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowOptions(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleChatInApp}
                activeOpacity={0.8}
              >
                <View style={styles.optionIconContainer}>
                  <Ionicons name="chatbubbles" size={24} color={theme.colors.primary} />
                </View>
                <Text style={styles.optionText}>Chat in the Voyo app</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, styles.disabledButton]}
                onPress={() => {}} // Disabled - no action
                activeOpacity={1} // No press effect
                disabled={true}
              >
                <View style={[styles.optionIconContainer, styles.whatsappIconContainer, styles.disabledIconContainer]}>
                  <Ionicons name="logo-whatsapp" size={24} color="#999999" />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionText, styles.disabledText]}>Chat on WhatsApp</Text>
                  <Text style={styles.comingSoonText}>Coming soon</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Chat Modal */}
      <ChatModal visible={showChatModal} onClose={() => setShowChatModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 100, // Above bottom nav (adjust based on your bottom nav height)
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: theme.spacing.lg,
    maxHeight: '50%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: theme.spacing.lg,
    padding: 4,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 144, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  whatsappIconContainer: {
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  optionTextContainer: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: theme.colors.background,
  },
  disabledIconContainer: {
    backgroundColor: 'rgba(153, 153, 153, 0.1)',
  },
  disabledText: {
    color: '#999999',
  },
  comingSoonText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 2,
  },
});






