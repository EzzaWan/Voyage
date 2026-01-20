import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { getStatusLabel, getStatusColor } from '../src/utils/statusUtils';
import { formatDataSize, calculateRemainingData, calculateUsagePercentage, formatExpiryDate } from '../src/utils/dataUtils';

// Clipboard copy function
const copyToClipboard = async (text: string, label: string = 'Text'): Promise<boolean> => {
  try {
    const ReactNative = require('react-native');
    if (ReactNative.Clipboard && ReactNative.Clipboard.setString) {
      await ReactNative.Clipboard.setString(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
      return true;
    }
  } catch (err) {
    // Clipboard not available
  }
  
  Alert.alert(
    label,
    `${label}: ${text}\n\nPlease copy this text manually.`,
    [{ text: 'OK' }]
  );
  return false;
};

// Format date for display
const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Open device settings (platform-specific)
const openDeviceSettings = async () => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('App-Prefs:root=MOBILE_DATA_SETTINGS_ID');
    } else if (Platform.OS === 'android') {
      await Linking.openURL('android.settings.WIRELESS_SETTINGS');
    } else {
      Alert.alert(
        'Open Settings',
        'Please go to your device Settings → Cellular/Mobile Data to manage your eSIM.',
        [{ text: 'OK' }]
      );
    }
  } catch (error) {
    // Fallback to instructions if deep linking fails
    Alert.alert(
      'Open Settings',
      'Please go to your device Settings → Cellular/Mobile Data to manage your eSIM.',
      [{ text: 'OK' }]
    );
  }
};

type EsimProfile = {
  id: string;
  iccid?: string;
  qrCodeUrl?: string | null;
  ac?: string | null;
  esimStatus?: string | null;
  expiredTime?: string | null;
  totalVolume?: string | null;
  orderUsage?: string | null;
};

type OrderData = {
  id: string;
  planId?: string;
  status: string;
  userEmail?: string;
  createdAt?: string;
  EsimProfile?: EsimProfile[];
  planDetails?: {
    locationCode?: string;
    name?: string;
  };
};

export default function EsimSetup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [cachedOrder, setCachedOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [troubleshootingExpanded, setTroubleshootingExpanded] = useState(false);

  useEffect(() => {
    if (params.orderId) {
      fetchOrder();
    } else {
      setError('Order ID is required');
      setLoading(false);
    }
  }, [params.orderId]);

  async function fetchOrder() {
    try {
      setLoading(true);
      setError(null);
      const orderData = await apiFetch<OrderData>(`/orders/${params.orderId}`);
      setOrder(orderData);
      setCachedOrder(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order';
      const isNetworkError = errorMessage.includes('Network request failed') || 
                             errorMessage.includes('network') ||
                             errorMessage.includes('fetch');
      
      setError(isNetworkError 
        ? 'Unable to connect. Please check your internet connection.'
        : errorMessage);
      console.error('Error fetching order:', err);
      
      if (cachedOrder) {
        setOrder(cachedOrder);
      }
    } finally {
      setLoading(false);
    }
  }

  const esimProfile = order?.EsimProfile?.[0];
  const hasQrCode = !!esimProfile?.qrCodeUrl;
  const esimStatus = esimProfile?.esimStatus?.toUpperCase() || '';
  
  // Data usage calculations
  const totalData = formatDataSize(esimProfile?.totalVolume);
  const usedData = formatDataSize(esimProfile?.orderUsage);
  const remainingData = calculateRemainingData(esimProfile?.totalVolume, esimProfile?.orderUsage);
  const usagePercentage = calculateUsagePercentage(esimProfile?.totalVolume, esimProfile?.orderUsage);
  
  // Dates
  const activationDate = order?.createdAt ? formatDate(order.createdAt) : '—';
  const expiryDateFull = esimProfile?.expiredTime ? formatDate(esimProfile.expiredTime) : '—';
  const expiryText = formatExpiryDate(esimProfile?.expiredTime);
  
  // Activation code (AC) for copying
  const activationCode = esimProfile?.ac || null;

  const handleBuyAgain = () => {
    router.push('/countries');
  };

  const handleCopyOrderId = async () => {
    if (!order?.id) return;
    await copyToClipboard(order.id, 'Order ID');
  };

  const handleCopyActivationCode = async () => {
    if (!activationCode) return;
    await copyToClipboard(activationCode, 'Activation Code');
  };

  const handleResendEmail = async () => {
    if (!order?.id) return;

    try {
      setResendingEmail(true);
      const result = await apiFetch<{ success: boolean; message: string }>(
        `/orders/${order.id}/resend-receipt`,
        { method: 'POST' }
      );

      if (result.success) {
        Alert.alert('Email Sent', result.message || 'eSIM email has been resent to your email address.');
      } else {
        Alert.alert('Error', 'Failed to resend email. Please try again later.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend email';
      console.error('Error resending email:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      `For support, please email us with your Order ID: ${order?.id || 'N/A'}\n\nYou can also visit our support page for more help.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading setup instructions...</Text>
        </View>
      </View>
    );
  }

  if ((error || !order) && !cachedOrder && !loading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={48} color={theme.colors.warning} />
            <Text style={styles.errorTitle}>Unable to Load Order</Text>
            <Text style={styles.errorText}>{error || 'Order not found'}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchOrder}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderStatusContent = () => {
    if (esimStatus === 'GOT_RESOURCE' || esimStatus === 'DOWNLOAD') {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>eSIM Setup Instructions</Text>
            <Text style={styles.subtitle}>Follow these steps to install your eSIM</Text>
          </View>

          {hasQrCode && (
            <View style={styles.qrCard}>
              <Text style={styles.qrCardTitle}>Install your eSIM</Text>
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: esimProfile.qrCodeUrl! }}
                  style={styles.qrCode}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.qrHint}>
                Scan this QR code with your phone's camera or Settings app
              </Text>
              <View style={styles.qrTip}>
                <Text style={styles.qrTipIcon}>💡</Text>
                <Text style={styles.qrTipText}>After installing, make sure Data Roaming is enabled for this eSIM</Text>
              </View>
              {activationCode && (
                <TouchableOpacity
                  style={styles.copyQRCodeButton}
                  onPress={handleCopyActivationCode}
                  activeOpacity={0.7}
                >
                  <Text style={styles.copyQRCodeButtonText}>Copy Activation Code</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {hasQrCode && <View style={styles.divider} />}
          {renderInstallInstructions()}
        </>
      );
    }

    if (esimStatus === 'INSTALLED' || esimStatus === 'INSTALLATION') {
      const statusColor = getStatusColor('INSTALLED');
      return (
        <>
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '10', borderColor: statusColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel('INSTALLED')}</Text>
            </View>
            <Text style={styles.title}>eSIM Installed</Text>
            <Text style={styles.subtitle}>Your eSIM is ready to activate</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Activation Tips</Text>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>1.</Text>
              <Text style={styles.noteText}>Go to Settings → Cellular (or Mobile Data)</Text>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>2.</Text>
              <Text style={styles.noteText}>Select your new eSIM from the list</Text>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>3.</Text>
              <Text style={styles.noteText}>Enable "Turn On This Line" or toggle active</Text>
            </View>
            <View style={styles.note}>
              <Text style={styles.noteBullet}>4.</Text>
              <Text style={styles.noteText}>Your eSIM will activate upon connection</Text>
            </View>
          </View>
        </>
      );
    }

    if (esimStatus === 'ACTIVE' || esimStatus === 'IN_USE' || esimStatus === 'ENABLED') {
      const statusColor = getStatusColor('ACTIVE');
      return (
        <>
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '10', borderColor: statusColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel('ACTIVE')}</Text>
            </View>
            <Text style={styles.title}>eSIM Active</Text>
            <Text style={styles.subtitle}>Your eSIM is connected and working</Text>
          </View>

          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
            <Text style={styles.successMessage}>Your eSIM is currently active and providing connectivity.</Text>
          </View>

          {esimProfile?.expiredTime && (
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Expiry Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Expires:</Text>
                <Text style={styles.infoValue}>{formatExpiryDate(esimProfile.expiredTime)}</Text>
              </View>
              <Text style={styles.expiryNote}>
                Your eSIM will automatically expire on this date.
              </Text>
            </View>
          )}
        </>
      );
    }

    if (esimStatus === 'EXPIRED' || esimStatus === 'UNUSED_EXPIRED' || esimStatus === 'USED_EXPIRED' || esimStatus === 'DISABLED') {
      const statusColor = getStatusColor('EXPIRED');
      return (
        <>
          <View style={styles.header}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '10', borderColor: statusColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel('EXPIRED')}</Text>
            </View>
            <Text style={styles.title}>eSIM Expired</Text>
            <Text style={styles.subtitle}>This eSIM is no longer active</Text>
          </View>

          <View style={styles.errorCard}>
            <Ionicons name="close-circle" size={48} color={theme.colors.error} />
            <Text style={styles.errorMessage}>
              This eSIM has expired and is no longer providing connectivity.
            </Text>
            {esimProfile?.expiredTime && (
              <Text style={styles.expiryDate}>
                Expired on {formatExpiryDate(esimProfile.expiredTime)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.buyAgainButton}
            onPress={handleBuyAgain}
            activeOpacity={0.7}
          >
            <Text style={styles.buyAgainButtonText}>Buy New eSIM</Text>
          </TouchableOpacity>
        </>
      );
    }

    const statusColor = getStatusColor(esimProfile?.esimStatus);
    return (
      <>
        <View style={styles.header}>
          {esimProfile?.esimStatus && (
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '10', borderColor: statusColor + '40' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(esimProfile.esimStatus)}</Text>
            </View>
          )}
          <Text style={styles.title}>eSIM Setup</Text>
          <Text style={styles.subtitle}>Follow these steps to install your eSIM</Text>
        </View>
        {hasQrCode && (
          <View style={styles.qrCard}>
            <Text style={styles.qrCardTitle}>Install your eSIM</Text>
            <View style={styles.qrContainer}>
              <Image
                source={{ uri: esimProfile.qrCodeUrl! }}
                style={styles.qrCode}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.qrHint}>
              Scan this QR code with your phone's camera or Settings app
            </Text>
            <View style={styles.qrTip}>
              <Text style={styles.qrTipIcon}>💡</Text>
              <Text style={styles.qrTipText}>After installing, make sure Data Roaming is enabled for this eSIM</Text>
            </View>
          </View>
        )}
        {hasQrCode && <View style={styles.divider} />}
        {renderInstallInstructions()}
      </>
    );
  };

  const renderInstallInstructions = () => (
    <>
      <View style={styles.instructionsSection}>
        <Text style={styles.sectionTitle}>Installation Steps</Text>
        <View style={styles.platformSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="logo-apple" size={20} color={theme.colors.text} />
            <Text style={styles.platformTitle}>iOS (iPhone)</Text>
          </View>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Open Settings app on your iPhone</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Tap on "Cellular" or "Mobile Data"</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Tap "Add Cellular Plan" or "Add eSIM"</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>
                {hasQrCode ? 'Scan the QR code above' : 'Use the QR code provided in your email'}
              </Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>5</Text>
              <Text style={styles.stepText}>Follow on-screen instructions</Text>
            </View>
          </View>
        </View>

        <View style={styles.platformSection}>
          <Text style={styles.platformTitle}>🤖 Android</Text>
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Open Settings on your Android device</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Tap "Network & internet" or "Connections"</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Tap "SIMs" or "SIM card manager"</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>4</Text>
              <Text style={styles.stepText}>Tap "Add mobile plan" or "Download a SIM instead"</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNumber}>5</Text>
              <Text style={styles.stepText}>
                {hasQrCode ? 'Scan the QR code above' : 'Use QR code from email'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>Important Notes</Text>
        <View style={styles.note}>
          <Text style={styles.noteBullet}>•</Text>
          <Text style={styles.noteText}>Ensure stable internet connection</Text>
        </View>
        <View style={styles.note}>
          <Text style={styles.noteBullet}>•</Text>
          <Text style={styles.noteText}>Device must be eSIM compatible</Text>
        </View>
        <View style={styles.note}>
          <Text style={styles.noteBullet}>•</Text>
          <Text style={styles.noteText}>You can keep your primary SIM active</Text>
        </View>
      </View>
    </>
  );

  const showStaleDataWarning = error && cachedOrder && order === cachedOrder;

  return (
    <View style={styles.container}>
      {showStaleDataWarning && (
        <View style={styles.staleDataBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning" size={16} color={theme.colors.warning} />
            <Text style={styles.staleDataText}>Showing saved data. Information may be outdated.</Text>
          </View>
          <TouchableOpacity
            style={styles.staleDataButton}
            onPress={fetchOrder}
            activeOpacity={0.7}
          >
            <Text style={styles.staleDataButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStatusContent()}
        
        {/* Data Usage Information */}
        {(esimProfile?.totalVolume || esimProfile?.expiredTime) && (
          <View style={styles.dataUsageSection}>
            <Text style={styles.dataUsageSectionTitle}>Data Usage</Text>
            
            {esimProfile?.totalVolume && (
              <>
                <View style={styles.dataUsageRow}>
                  <Text style={styles.dataUsageLabel}>Total Data:</Text>
                  <Text style={styles.dataUsageValue}>{totalData}</Text>
                </View>
                
                <View style={styles.dataUsageRow}>
                  <Text style={styles.dataUsageLabel}>Used:</Text>
                  <Text style={styles.dataUsageValue}>{usedData}</Text>
                </View>
                
                <View style={styles.dataUsageRow}>
                  <Text style={styles.dataUsageLabel}>Remaining:</Text>
                  <Text style={styles.dataUsageValue}>{remainingData}</Text>
                </View>
                
                {esimProfile.totalVolume && (
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: `${usagePercentage}%`, 
                          backgroundColor: usagePercentage > 80 ? theme.colors.warning : theme.colors.primary 
                        }
                      ]} 
                    />
                  </View>
                )}
              </>
            )}
            
            <View style={styles.dataUsageRow}>
              <Text style={styles.dataUsageLabel}>Activation Date:</Text>
              <Text style={styles.dataUsageValue}>{activationDate}</Text>
            </View>
            
            <View style={styles.dataUsageRow}>
              <Text style={styles.dataUsageLabel}>Expiry Date:</Text>
              <Text style={styles.dataUsageValue}>{expiryDateFull}</Text>
            </View>
          </View>
        )}
        
        {/* Copy Activation Code */}
        {activationCode && (
          <View style={styles.activationCodeSection}>
            <View style={styles.activationCodeRow}>
              <View style={styles.activationCodeLeft}>
                <Text style={styles.activationCodeLabel}>Activation Code</Text>
                <Text style={styles.activationCodeValue} numberOfLines={1}>{activationCode}</Text>
              </View>
              <TouchableOpacity
                style={styles.copyActivationButton}
                onPress={handleCopyActivationCode}
                activeOpacity={0.7}
              >
                <Text style={styles.copyActivationButtonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Troubleshooting Section */}
        <View style={styles.troubleshootingSection}>
          <TouchableOpacity
            style={styles.troubleshootingHeader}
            onPress={() => setTroubleshootingExpanded(!troubleshootingExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.troubleshootingTitle}>Troubleshooting</Text>
            <Ionicons 
              name={troubleshootingExpanded ? "chevron-down" : "chevron-forward"} 
              size={18} 
              color={theme.colors.textMuted} 
            />
          </TouchableOpacity>
          
          {troubleshootingExpanded && (
            <View style={styles.troubleshootingContent}>
              <View style={styles.troubleshootingItem}>
                <Text style={styles.troubleshootingItemTitle}>QR code won't scan?</Text>
                <Text style={styles.troubleshootingItemText}>
                  • Make sure your camera has permission to scan QR codes{'\n'}
                  • Try increasing screen brightness{'\n'}
                  • Use the QR code from your email if scanning fails{'\n'}
                  • Manually enter the activation code if available
                </Text>
              </View>
              
              <View style={styles.troubleshootingItem}>
                <Text style={styles.troubleshootingItemTitle}>eSIM won't activate?</Text>
                <Text style={styles.troubleshootingItemText}>
                  • Enable Data Roaming for this eSIM in Settings{'\n'}
                  • Make sure you're in the correct country/region{'\n'}
                  • Restart your device{'\n'}
                  • Check if your device supports eSIM
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.troubleshootingSupportButton}
                onPress={handleContactSupport}
                activeOpacity={0.7}
              >
                <Text style={styles.troubleshootingSupportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Open Device Settings */}
        <TouchableOpacity
          style={styles.openSettingsButton}
          onPress={openDeviceSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.openSettingsIcon}>⚙️</Text>
          <Text style={styles.openSettingsText}>Open Device Settings</Text>
        </TouchableOpacity>
        
        <View style={styles.supportSection}>
          <Text style={styles.supportSectionTitle}>Order Information</Text>
          
          {order?.userEmail && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Email:</Text>
              <Text style={styles.infoValue}>{order.userEmail}</Text>
            </View>
          )}

          <View style={styles.orderIdRow}>
            <View style={styles.orderIdLeft}>
              <Text style={styles.infoLabel}>Order ID:</Text>
              <Text style={styles.orderIdValue}>{order?.id || 'N/A'}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyOrderId}
              activeOpacity={0.7}
            >
              <Text style={styles.copyButtonText}>Copy</Text>
            </TouchableOpacity>
          </View>

          {/* Top Up Button */}
          <TouchableOpacity
            style={styles.topUpButton}
            onPress={() => {
              const iccid = esimProfile?.iccid;
              if (iccid) {
                router.push({
                  pathname: '/topup',
                  params: { iccid },
                });
              } else {
                Alert.alert('Error', 'eSIM ICCID not found');
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.topUpButtonIcon}>⚡</Text>
            <Text style={styles.topUpButtonText}>Top Up Data</Text>
          </TouchableOpacity>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.resendButton]}
              onPress={handleResendEmail}
              disabled={resendingEmail}
              activeOpacity={0.7}
            >
              {resendingEmail ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
                  <Text style={styles.actionButtonText}>Resend eSIM Email</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.supportButton]}
              onPress={handleContactSupport}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.actionButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  qrSection: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  qrCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    width: '100%',
    textAlign: 'left',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  qrContainer: {
    width: 240,
    height: 240,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: '100%',
    height: '100%',
  },
  qrHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'left',
    paddingHorizontal: 0,
    marginBottom: theme.spacing.md,
    lineHeight: 19,
    opacity: 0.8,
  },
  qrTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  qrTipIcon: {
    display: 'none', // Remove icon
  },
  qrTipText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  copyQRCodeButton: {
    marginTop: theme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    width: '100%',
  },
  copyQRCodeButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xl,
  },
  instructionsSection: {
    marginBottom: theme.spacing.xl,
  },
  platformSection: {
    marginBottom: theme.spacing.lg,
  },
  platformTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  stepsList: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: theme.spacing.md,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 21,
  },
  notesSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteBullet: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginRight: 8,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    opacity: 0.85,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  successCard: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  successIcon: {
    fontSize: 48,
    color: theme.colors.success,
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: theme.colors.success,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  errorIcon: {
    fontSize: 48,
    color: theme.colors.error,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  expiryDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  expiryNote: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginTop: 8,
  },
  buyAgainButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    minHeight: 44,
  },
  buyAgainButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  supportSection: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.base,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  supportSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderIdLeft: {
    flex: 1,
    marginRight: 12,
  },
  orderIdValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  copyButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  copyButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  topUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    gap: 10,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  topUpButtonIcon: {
    fontSize: 20,
  },
  topUpButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  resendButton: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  supportButton: {
    backgroundColor: theme.colors.cardHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButtonIcon: {
    fontSize: 18,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  },
  staleDataBanner: {
    backgroundColor: theme.colors.warningBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.warning,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  staleDataText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    marginRight: 12,
  },
  staleDataButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: theme.colors.warning,
    borderRadius: 6,
  },
  staleDataButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  dataUsageSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dataUsageSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dataUsageLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  dataUsageValue: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  activationCodeSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activationCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activationCodeLeft: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  activationCodeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  activationCodeValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  copyActivationButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  copyActivationButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  troubleshootingSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  troubleshootingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  troubleshootingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  troubleshootingChevron: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  troubleshootingContent: {
    padding: theme.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  troubleshootingItem: {
    marginBottom: theme.spacing.md,
  },
  troubleshootingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  troubleshootingItemText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  troubleshootingSupportButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  troubleshootingSupportButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  openSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  openSettingsIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  openSettingsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
});
