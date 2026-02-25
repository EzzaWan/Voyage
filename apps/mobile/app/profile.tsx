import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, Dimensions, Switch, Platform, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../src/components/BottomNav';
import { theme } from '../src/theme';
import { useCurrency, SUPPORTED_CURRENCIES } from '../src/context/CurrencyContext';
import { apiFetch } from '../src/api/client';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type MenuItem = {
  id: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showArrow?: boolean;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
};

export default function Profile() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { selectedCurrency, setCurrency } = useCurrency();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isLoaded = userLoaded && authLoaded;

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleDeleteAccountPress = () => setShowDeleteConfirm(true);

  const handleDeleteAccountConfirm = async () => {
    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) return;
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      await apiFetch<{ success: boolean }>('/user/delete-account', {
        method: 'POST',
        headers: { 'x-user-email': user.primaryEmailAddress.emailAddress },
        body: JSON.stringify({ clerkUserId: user.id }),
      });
      setShowDeleteConfirm(false);
      await signOut();
      router.replace('/');
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitial = () => {
    if (user?.firstName) return user.firstName[0].toUpperCase();
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress[0].toUpperCase();
    }
    return 'U';
  };

  const getName = () => {
    if (user?.firstName) {
      return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
    }
    return user?.primaryEmailAddress?.emailAddress || 'Guest';
  };

  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  // Group 1: Account / Business (Using Affiliate for Business equivalent)
  const group1: MenuItem[] = isLoaded && isSignedIn ? [
    {
      id: 'my-esims',
      label: 'My eSIMs',
      onPress: () => router.push('/my-esims'),
      showArrow: true,
    },
    {
      id: 'affiliate',
      label: 'Voyo Affiliate',
      onPress: () => router.push('/affiliate'),
      showArrow: true,
    },
  ] : [];

  // Group 2: Settings
  const group2: MenuItem[] = [
    {
      id: 'currency',
      label: `Currency (${selectedCurrency})`,
      onPress: () => setShowCurrencyModal(true),
      showArrow: true,
    },
  ];

  // Group 3: Legal
  const group3: MenuItem[] = [
    {
      id: 'terms',
      label: 'Terms of service',
      onPress: () => router.push('/policies'),
      showArrow: true,
    },
    {
      id: 'privacy',
      label: 'Privacy policy',
      onPress: () => router.push('/privacy'),
      showArrow: true,
    },
    {
      id: 'help',
      label: 'Help center',
      onPress: () => router.push('/support'),
      showArrow: true,
    },
  ];

  // Group 4: Auth Actions
  const group4: MenuItem[] = isLoaded && isSignedIn ? [
    {
      id: 'logout',
      label: 'Log out',
      onPress: handleSignOut,
      showArrow: true,
    },
    {
      id: 'delete-account',
      label: 'Delete account',
      onPress: handleDeleteAccountPress,
      showArrow: true,
      destructive: true,
    },
  ] : [
    {
      id: 'login',
      label: 'Log in / Sign up',
      onPress: handleSignIn,
      showArrow: true,
    },
  ];

  const renderGroup = (items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <View style={styles.menuGroup}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              index === items.length - 1 && styles.lastMenuItem
            ]}
            onPress={item.onPress}
            activeOpacity={item.hasToggle ? 1 : 0.7}
          >
            <View style={styles.menuContent}>
              <Text style={[
                styles.menuLabel,
                item.destructive && styles.menuLabelDestructive
              ]}>
                {item.label}
              </Text>
            </View>
            
            {item.hasToggle && (
              <Switch
                value={item.toggleValue}
                onValueChange={item.onToggle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            )}
            
            {item.showArrow && (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        {isLoaded && isSignedIn && user && (
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user.imageUrl ? (
                <Image 
                  source={{ uri: user.imageUrl }} 
                  style={styles.avatarImage}
                  defaultSource={require('../assets/icon.png')}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitial()}</Text>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{getName()}</Text>
              <Text style={styles.profileEmail}>{user.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </View>
        )}

        {/* Guest State */}
        {isLoaded && !isSignedIn && (
          <TouchableOpacity 
            style={styles.profileCard}
            onPress={handleSignIn}
            activeOpacity={0.7}
          >
            <View style={[styles.avatarContainer, { backgroundColor: theme.colors.border }]}>
              <Text style={styles.avatarText}>G</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Guest User</Text>
              <Text style={styles.profileEmail}>Sign in to sync your data</Text>
            </View>
          </TouchableOpacity>
        )}

        {renderGroup(group1)}
        {renderGroup(group2)}
        {renderGroup(group3)}
        {renderGroup(group4)}

        <View style={styles.footer}>
          <Text style={styles.appVersion}>App version: 1.0.0</Text>
        </View>
      </ScrollView>
      
      <BottomNav activeTab="profile" />

      {/* Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            onPress={() => setShowCurrencyModal(false)} 
            activeOpacity={1}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyItem}
                  onPress={() => {
                    setCurrency(item.code);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[
                    styles.currencyCode, 
                    selectedCurrency === item.code && styles.currencyCodeSelected
                  ]}>
                    {item.code} - {item.name}
                  </Text>
                  {selectedCurrency === item.code && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !deleteLoading && setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => !deleteLoading && setShowDeleteConfirm(false)}
            activeOpacity={1}
          />
          <View style={[styles.modalContent, styles.deleteModalContent]}>
            <Text style={styles.deleteModalTitle}>Delete account?</Text>
            <Text style={styles.deleteModalText}>
              Your account and all associated data will be permanently deleted. This cannot be undone.
            </Text>
            <Text style={styles.deleteModalSubtext}>
              If you signed in with Apple, you can revoke this app's access in your Apple ID settings.
            </Text>
            {deleteError && (
              <Text style={styles.deleteModalError}>{deleteError}</Text>
            )}
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancel}
                onPress={() => !deleteLoading && setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalConfirm, deleteLoading && styles.deleteModalConfirmDisabled]}
                onPress={handleDeleteAccountConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Delete my account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
    paddingTop: theme.spacing.sm, // Add top padding for breathing room
  },
  // Profile Card (Grouped style)
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl, // Match Saily's rounded groups
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  // Menu Groups
  menuGroup: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl, // Saily style rounded groups
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuContent: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  menuLabelDestructive: {
    color: theme.colors.error,
  },
  menuSubLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  appVersion: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.7,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  currencyCode: {
    fontSize: 16,
    color: theme.colors.text,
  },
  currencyCodeSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  // Delete account modal
  deleteModalContent: {
    marginHorizontal: 24,
    padding: theme.spacing.lg,
    maxHeight: undefined,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  deleteModalText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.sm,
  },
  deleteModalSubtext: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: theme.spacing.lg,
  },
  deleteModalError: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
  },
  deleteModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  deleteModalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  deleteModalConfirmDisabled: {
    opacity: 0.7,
  },
  deleteModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
