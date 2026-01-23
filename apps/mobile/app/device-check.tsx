import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Keyboard, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';
import { useToast } from '../src/context/ToastContext';

interface DeviceCompatibility {
  model: string;
  brand: string;
  supported: boolean;
  notes: string[];
  regionalNotes?: Record<string, string>;
}

export default function DeviceCheck() {
  const router = useRouter();
  const toast = useToast();
  const [deviceQuery, setDeviceQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeviceCompatibility | null>(null);

  // Fetch device suggestions as user types
  useEffect(() => {
    if (deviceQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const data = await apiFetch<{ models: string[] }>(
          `/device/models?q=${encodeURIComponent(deviceQuery)}`
        );
        setSuggestions(data.models || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [deviceQuery]);

  const handleSuggestionSelect = (model: string) => {
    setSelectedDevice(model);
    setDeviceQuery(model);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleCheckCompatibility = async () => {
    if (!selectedDevice && !deviceQuery) {
      toast.warning('Device Required', 'Please enter or select a device model');
      return;
    }

    const modelToCheck = selectedDevice || deviceQuery;
    
    setLoading(true);
    setResult(null);
    Keyboard.dismiss();

    try {
      const data = await apiFetch<DeviceCompatibility>(
        `/device/check?model=${encodeURIComponent(modelToCheck)}`
      );
      setResult(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check compatibility';
      toast.error('Error', errorMessage);
      console.error('Compatibility check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="phone-portrait" size={80} color={'rgba(30, 144, 255, 0.15)'} />
        </View>
        <Text style={styles.title}>Device Compatibility</Text>
        <Text style={styles.subtitle}>
          Check if your phone supports eSIM before purchasing
        </Text>
      </View>

      {/* Search Section */}
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Search Your Device</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="e.g., iPhone 15, Samsung Galaxy S24..."
            placeholderTextColor={theme.colors.textMuted}
            value={deviceQuery}
            onChangeText={(text) => {
              setDeviceQuery(text);
              setSelectedDevice('');
              setResult(null);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView 
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
            >
              {suggestions.map((model, index) => (
                <TouchableOpacity
                  key={`${model}-${index}`}
                  style={[
                    styles.suggestionItem,
                    index === suggestions.length - 1 && styles.suggestionItemLast,
                  ]}
                  onPress={() => handleSuggestionSelect(model)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{model}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.checkButton,
            (!deviceQuery || loading) && styles.checkButtonDisabled,
          ]}
          onPress={handleCheckCompatibility}
          disabled={!deviceQuery || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.white} />
          ) : (
            <Text style={styles.checkButtonText}>Check Compatibility</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Result Section */}
      {result && (
        <View style={styles.resultCard}>
          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            result.supported ? styles.statusBadgeSupported : styles.statusBadgeUnsupported,
          ]}>
            <Ionicons 
              name={result.supported ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={result.supported ? theme.colors.success : theme.colors.error} 
            />
            <Text style={[
              styles.statusBadgeText,
              result.supported ? styles.statusTextSupported : styles.statusTextUnsupported,
            ]}>
              {result.supported ? 'SUPPORTED' : 'NOT SUPPORTED'}
            </Text>
          </View>

          {/* Device Info */}
          <View style={styles.deviceInfo}>
            <Text style={styles.deviceInfoLabel}>Device</Text>
            <Text style={styles.deviceInfoValue}>
              {result.brand} {result.model}
            </Text>
          </View>

          {/* Notes */}
          {result.notes && result.notes.length > 0 && (
            <View style={styles.notesSection}>
              <Text style={styles.notesTitle}>Important Notes</Text>
              {result.notes.map((note, index) => (
                <View key={index} style={styles.noteItem}>
                  <Ionicons name="warning" size={20} color={theme.colors.warning} />
                  <Text style={styles.noteText}>{note}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.resultActions}>
            {result.supported ? (
              <TouchableOpacity
                style={styles.browsePlansButton}
                onPress={() => router.push('/countries')}
                activeOpacity={0.85}
              >
                <Text style={styles.browsePlansButtonText}>Browse eSIM Plans</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.supportButton}
                onPress={() => {
                  toast.info(
                    'Contact Support',
                    'If you believe your device should support eSIM, please contact our support team.'
                  );
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.supportButtonText}>Contact Support</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Info Section */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What is eSIM?</Text>
        <Text style={styles.infoText}>
          An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without a physical SIM card. Most modern smartphones support eSIM.
        </Text>
        
        <View style={styles.infoList}>
          <View style={styles.infoListItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.infoListText}>iPhone XS and newer</Text>
          </View>
          <View style={styles.infoListItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.infoListText}>Samsung Galaxy S20 and newer</Text>
          </View>
          <View style={styles.infoListItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.infoListText}>Google Pixel 3 and newer</Text>
          </View>
          <View style={styles.infoListItem}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            <Text style={styles.infoListText}>And many more devices</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  
  // Header
  safeAreaSpacer: {
    height: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Search Card
  searchCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchLabel: {
    ...theme.typography.body, fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: theme.colors.text,
    fontSize: 16,
  },
  
  // Suggestions
  suggestionsContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  
  // Check Button
  checkButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
  },
  checkButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    fontSize: 16,
    color: theme.colors.white,
  },
  
  // Result Card
  resultCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    marginBottom: theme.spacing.md,
    gap: 6,
  },
  statusBadgeSupported: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusBadgeUnsupported: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusBadgeIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusTextSupported: {
    color: '#22c55e',
  },
  statusTextUnsupported: {
    color: '#ef4444',
  },
  deviceInfo: {
    marginBottom: theme.spacing.md,
  },
  deviceInfoLabel: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  deviceInfoValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  
  // Notes
  notesSection: {
    marginBottom: theme.spacing.md,
  },
  notesTitle: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noteIcon: {
    fontSize: 14,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  noteText: {
    flex: 1,
    ...theme.typography.small,
    color: theme.colors.text,
    lineHeight: 20,
  },
  
  // Result Actions
  resultActions: {
    marginTop: theme.spacing.sm,
  },
  browsePlansButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  browsePlansButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
  browsePlansButtonIcon: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  supportButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundLight,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  supportButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  
  // Info Card
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  infoList: {
    gap: theme.spacing.sm,
  },
  infoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  infoListIcon: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  infoListText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
});




