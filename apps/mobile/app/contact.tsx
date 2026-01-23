import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../src/api/client';
import { theme } from '../src/theme';

const DEVICE_MODELS = [
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24',
  'Samsung Galaxy S23 Ultra',
  'Samsung Galaxy S23',
  'Google Pixel 8 Pro',
  'Google Pixel 8',
  'Google Pixel 7 Pro',
  'Google Pixel 7',
  'Other',
];

export default function ContactSupport() {
  const router = useRouter();
  const { user } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderId: '',
    device: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.fullName || prev.name,
        email: user.primaryEmailAddress?.emailAddress || prev.email,
      }));
    }
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    // Validate
    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!formData.message.trim()) {
      setError('Message is required');
      setLoading(false);
      return;
    }
    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters');
      setLoading(false);
      return;
    }
    if (formData.message.trim().length > 1000) {
      setError('Message must be no more than 1000 characters');
      setLoading(false);
      return;
    }

    try {
      const payload: Record<string, string> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      };

      if (formData.orderId.trim()) {
        payload.orderId = formData.orderId.trim();
      }
      if (formData.device.trim()) {
        payload.device = formData.device.trim();
      }

      await apiFetch('/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <View style={styles.container}>
        {/* Safe area spacer - prevents content from scrolling behind status bar */}
        <View style={styles.safeAreaSpacer} />
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successText}>
            We've received your message and will get back to you within 24-48 hours.
          </Text>
          <View style={styles.successButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/support')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Back to Support</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <Text style={styles.headerSubtitle}>
            Send us a message and we'll get back to you soon
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="warning" size={48} color={theme.colors.warning} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Your full name"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="your.email@example.com"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Order ID Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Order ID <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.orderId}
              onChangeText={(text) => setFormData({ ...formData, orderId: text })}
              placeholder="If related to a purchase"
              placeholderTextColor={theme.colors.textMuted}
              autoCapitalize="none"
            />
          </View>

          {/* Device Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Device Model <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDevicePicker(!showDevicePicker)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.selectButtonText,
                !formData.device && styles.selectButtonPlaceholder
              ]}>
                {formData.device || 'Select device model'}
              </Text>
              <Ionicons 
                name={showDevicePicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.textMuted} 
              />
            </TouchableOpacity>
            
            {showDevicePicker && (
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.pickerScroll} nestedScrollEnabled>
                  {DEVICE_MODELS.map((model) => (
                    <TouchableOpacity
                      key={model}
                      style={[
                        styles.pickerItem,
                        formData.device === model && styles.pickerItemSelected
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, device: model });
                        setShowDevicePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerItemText,
                        formData.device === model && styles.pickerItemTextSelected
                      ]}>
                        {model}
                      </Text>
                      {formData.device === model && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Message Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              placeholder="Please describe your issue or question in detail..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {formData.message.length}/1000
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="send-outline" size={18} color={theme.colors.white} />
                <Text style={styles.submitButtonText}>Send Message</Text>
              </View>
            )}
          </TouchableOpacity>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  
  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    fontSize: 40,
    color: '#22c55e',
  },
  successTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  successText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  successButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  
  // Form Card
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    ...theme.typography.small,
    color: '#ef4444',
  },
  
  // Fields
  fieldContainer: {
    marginBottom: theme.spacing.md,
  },
  label: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  optional: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    fontWeight: '400',
  },
  input: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  textArea: {
    minHeight: 150,
    paddingTop: 14,
  },
  charCount: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  
  // Select/Picker
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
  },
  selectButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  selectButtonPlaceholder: {
    color: theme.colors.textMuted,
  },
  selectChevron: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  pickerContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    marginTop: 4,
    maxHeight: 200,
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(30, 144, 255, 0.15)',
  },
  pickerItemText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  pickerItemTextSelected: {
    color: theme.colors.primary,
  },
  pickerCheck: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
  },
  primaryButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '600' as const,
  },
  secondaryButton: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    color: theme.colors.text,
    ...theme.typography.body, fontWeight: '500' as const,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  submitButtonText: {
    color: theme.colors.white,
    ...theme.typography.body, fontWeight: '600' as const,
  },
});




