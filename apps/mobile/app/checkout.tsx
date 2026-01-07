import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

export default function Checkout() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string }>();
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.orderId) {
      fetchCheckoutUrl();
    } else {
      setError('Order ID is required');
      setLoading(false);
    }
  }, [params.orderId]);

  async function fetchCheckoutUrl() {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch<{ url: string }>(
        `/orders/${params.orderId}/checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      
      if (data.url) {
        setCheckoutUrl(data.url);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load checkout';
      setError(errorMessage);
      console.error('Error fetching checkout URL:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleNavigationStateChange = (navState: any) => {
    const url = navState.url;
    
    const successMatch = url.match(/\/checkout\/success(?:\?|&)(?:[^&]*&)*session_id=([^&]+)/);
    
    if (successMatch && successMatch[1]) {
      const sessionId = successMatch[1];
      router.replace({
        pathname: '/order-success',
        params: {
          sessionId: sessionId,
        },
      });
    } else if (url.includes('/checkout/cancel') || url.includes(`/checkout/${params.orderId}`)) {
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading checkout...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchCheckoutUrl}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!checkoutUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.closeButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No checkout URL available</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.closeButton} />
      </View>
      <WebView
        source={{ uri: checkoutUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
