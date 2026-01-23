import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>Last updated: January 2026</Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionText}>
            Voyage eSIM ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
          </Text>
        </View>

        {/* Information We Collect */}
        <Section title="1. Information We Collect">
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Personal Information:</Text> When you create an account, we collect your email address, name, and payment information necessary to process your orders.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Usage Data:</Text> We automatically collect information about how you interact with our app, including pages viewed, features used, and time spent.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Device Information:</Text> We collect device type, operating system, unique device identifiers, and mobile network information to ensure compatibility and improve service.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Location Data:</Text> With your permission, we may collect location data to suggest relevant eSIM plans for your travel destination.
          </Text>
        </Section>

        {/* How We Use Information */}
        <Section title="2. How We Use Your Information">
          <Text style={styles.sectionText}>• Process and fulfill your eSIM purchases</Text>
          <Text style={styles.sectionText}>• Send order confirmations and eSIM installation instructions</Text>
          <Text style={styles.sectionText}>• Provide customer support and respond to inquiries</Text>
          <Text style={styles.sectionText}>• Improve our app and services</Text>
          <Text style={styles.sectionText}>• Send promotional communications (with your consent)</Text>
          <Text style={styles.sectionText}>• Detect and prevent fraud</Text>
          <Text style={styles.sectionText}>• Comply with legal obligations</Text>
        </Section>

        {/* Information Sharing */}
        <Section title="3. Information Sharing">
          <Text style={styles.sectionText}>
            We do not sell your personal information. We may share your data with:
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Service Providers:</Text> Third-party companies that help us operate our business (payment processors, eSIM providers, cloud hosting).
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>eSIM Carriers:</Text> Network operators who provision your eSIM profile require certain information to activate service.
          </Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Legal Requirements:</Text> When required by law or to protect our rights and safety.
          </Text>
        </Section>

        {/* Data Security */}
        <Section title="4. Data Security">
          <Text style={styles.sectionText}>
            We implement industry-standard security measures to protect your data, including:
          </Text>
          <Text style={styles.sectionText}>• SSL/TLS encryption for all data transmission</Text>
          <Text style={styles.sectionText}>• Secure payment processing through Stripe</Text>
          <Text style={styles.sectionText}>• Regular security audits and updates</Text>
          <Text style={styles.sectionText}>• Limited access to personal data on a need-to-know basis</Text>
        </Section>

        {/* Data Retention */}
        <Section title="5. Data Retention">
          <Text style={styles.sectionText}>
            We retain your personal information for as long as your account is active or as needed to provide services. We may retain certain information as required by law or for legitimate business purposes.
          </Text>
          <Text style={styles.sectionText}>
            Order history and transaction records are kept for 7 years for tax and legal compliance.
          </Text>
        </Section>

        {/* Your Rights */}
        <Section title="6. Your Rights">
          <Text style={styles.sectionText}>You have the right to:</Text>
          <Text style={styles.sectionText}>• Access your personal data</Text>
          <Text style={styles.sectionText}>• Correct inaccurate information</Text>
          <Text style={styles.sectionText}>• Request deletion of your data</Text>
          <Text style={styles.sectionText}>• Object to processing of your data</Text>
          <Text style={styles.sectionText}>• Export your data in a portable format</Text>
          <Text style={styles.sectionText}>• Withdraw consent for marketing communications</Text>
          <Text style={styles.sectionText}>
            To exercise these rights, contact us at privacy@voyagedata.io
          </Text>
        </Section>

        {/* Cookies and Tracking */}
        <Section title="7. Cookies and Tracking">
          <Text style={styles.sectionText}>
            Our mobile app may use local storage and analytics tools to improve your experience. You can control these through your device settings.
          </Text>
          <Text style={styles.sectionText}>
            We use analytics services to understand app usage and improve our services. This data is aggregated and does not personally identify you.
          </Text>
        </Section>

        {/* Children's Privacy */}
        <Section title="8. Children's Privacy">
          <Text style={styles.sectionText}>
            Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
          </Text>
        </Section>

        {/* International Transfers */}
        <Section title="9. International Data Transfers">
          <Text style={styles.sectionText}>
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.
          </Text>
        </Section>

        {/* Changes to Policy */}
        <Section title="10. Changes to This Policy">
          <Text style={styles.sectionText}>
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy in the app and updating the "Last updated" date.
          </Text>
        </Section>

        {/* Contact */}
        <Section title="11. Contact Us">
          <Text style={styles.sectionText}>
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </Text>
          <Text style={styles.sectionText}>
            Email: privacy@voyagedata.io
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/contact')}
            activeOpacity={0.85}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </Section>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
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
  scrollContent: {
    paddingLeft: 16, // Explicit 16px padding
    paddingRight: 16, // Explicit 16px padding
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  
  // Header
  header: {
    marginBottom: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  lastUpdated: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
  },
  
  // Sections
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  sectionText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  
  // Contact Button
  contactButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    color: theme.colors.white,
    ...theme.typography.bodyBold,
  },
});





