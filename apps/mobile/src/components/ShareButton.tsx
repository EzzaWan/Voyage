import { TouchableOpacity, Text, Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useToast } from '../context/ToastContext';

interface ShareButtonProps {
  title: string;
  message: string;
  url?: string;
  buttonText?: string;
  style?: 'primary' | 'secondary' | 'icon';
}

export function ShareButton({ 
  title, 
  message, 
  url, 
  buttonText = 'Share',
  style = 'secondary',
}: ShareButtonProps) {
  const toast = useToast();
  
  const handleShare = async () => {
    try {
      const shareContent: { message: string; title: string; url?: string } = {
        message: url ? `${message}\n\n${url}` : message,
        title,
      };

      // On iOS, we can also include URL separately
      if (url) {
        shareContent.url = url;
      }

      const result = await Share.share(shareContent);

      if (result.action === Share.sharedAction) {
        // Shared successfully
        if (result.activityType) {
          // Shared with a specific activity type (iOS)
          console.log(`Shared with ${result.activityType}`);
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed (iOS)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share';
      toast.error('Error', errorMessage);
    }
  };

  if (style === 'icon') {
    return (
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Ionicons name="share-outline" size={18} color={theme.colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        style === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
      ]}
      onPress={handleShare}
      activeOpacity={0.85}
    >
      <Ionicons 
        name="share-outline" 
        size={18} 
        color={style === 'primary' ? theme.colors.white : theme.colors.primary} 
      />
      <Text style={[
        styles.buttonText,
        style === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary,
      ]}>
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
}

// Specialized share button for plans
interface SharePlanButtonProps {
  countryName: string;
  planName: string;
  planPrice: string;
  style?: 'primary' | 'secondary' | 'icon';
}

export function SharePlanButton({ 
  countryName, 
  planName, 
  planPrice,
  style = 'icon',
}: SharePlanButtonProps) {
  const title = `${countryName} eSIM Plan`;
  const message = `Check out this eSIM plan for ${countryName}: ${planName} for ${planPrice}. Get connected instantly with Voyage eSIM!`;
  const url = 'https://voyagedata.io';

  return (
    <ShareButton
      title={title}
      message={message}
      url={url}
      buttonText="Share Plan"
      style={style}
    />
  );
}

// Share referral link
interface ShareReferralButtonProps {
  referralCode: string;
  referralLink: string;
  style?: 'primary' | 'secondary';
}

export function ShareReferralButton({ 
  referralCode,
  referralLink,
  style = 'primary',
}: ShareReferralButtonProps) {
  const title = 'Get eSIM with Voyage';
  const message = `Use my referral code "${referralCode}" to get great deals on eSIM data for your travels!`;

  return (
    <ShareButton
      title={title}
      message={message}
      url={referralLink}
      buttonText="Share Referral"
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  buttonText: {
    ...theme.typography.bodyMedium,
  },
  buttonTextPrimary: {
    color: theme.colors.white,
  },
  buttonTextSecondary: {
    color: theme.colors.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
});





