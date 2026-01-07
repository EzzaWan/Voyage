import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useAuth } from '@clerk/clerk-expo';
import BottomNav from '../src/components/BottomNav';
import { theme } from '../src/theme';

export default function Profile() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut, isSignedIn, isLoaded: authLoaded } = useAuth();
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {isLoaded && isSignedIn && user && (
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.firstName?.[0] || user.primaryEmailAddress?.emailAddress?.[0] || 'U'}
              </Text>
            </View>
            <Text style={styles.name}>
              {user.firstName || user.primaryEmailAddress?.emailAddress || 'User'}
            </Text>
            {user.primaryEmailAddress?.emailAddress && (
              <Text style={styles.email}>{user.primaryEmailAddress.emailAddress}</Text>
            )}
          </View>
        )}

        {isLoaded && !isSignedIn && (
          <View style={styles.signInSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.signInTitle}>Sign In Required</Text>
            <Text style={styles.signInSubtitle}>Sign in to view your profile</Text>
          </View>
        )}

        <View style={styles.menuSection}>
          {isLoaded && isSignedIn && (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/my-esims')}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>📱</Text>
              <Text style={styles.menuText}>My eSIMs</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          )}

          {isLoaded && isSignedIn ? (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuText, styles.signOutText]}>Sign Out</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSignIn}
              activeOpacity={0.7}
            >
              <Text style={styles.menuIcon}>🔐</Text>
              <Text style={[styles.menuText, styles.signInButtonText]}>Sign In</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <BottomNav activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 80,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  menuSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  signOutText: {
    color: theme.colors.error,
  },
  signInSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  signInTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: 4,
  },
  signInSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  signInButtonText: {
    color: theme.colors.primary,
  },
  menuArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
});

