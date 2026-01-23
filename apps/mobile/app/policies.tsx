import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme';

type PolicyTab = 'refund' | 'terms' | 'affiliate' | 'privacy';

export default function Policies() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<PolicyTab>('refund');

  const tabs: { id: PolicyTab; label: string }[] = [
    { id: 'refund', label: 'Refund' },
    { id: 'terms', label: 'Terms' },
    { id: 'affiliate', label: 'Affiliate' },
    { id: 'privacy', label: 'Privacy' },
  ];

  return (
    <View style={styles.container}>
      {/* Safe area spacer - prevents content from scrolling behind status bar */}
      <View style={styles.safeAreaSpacer} />
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'refund' && <RefundPolicyContent />}
        {activeTab === 'terms' && <TermsOfServiceContent />}
        {activeTab === 'affiliate' && <AffiliateTermsContent />}
        {activeTab === 'privacy' && <PrivacyPolicyContent />}

        {/* Contact Support */}
        <View style={styles.contactSection}>
          <Text style={styles.contactText}>
            Have questions about our policies?
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/contact')}
            activeOpacity={0.85}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Refund Policy Content
function RefundPolicyContent() {
  return (
    <View style={styles.policyContent}>
      <Text style={styles.policyTitle}>Refund Policy</Text>
      <Text style={styles.policyIntro}>
        We want you to be completely satisfied with your eSIM purchase. Please read our refund policy carefully.
      </Text>

      {/* Refund Conditions */}
      <View style={[styles.policyCard, styles.cardGreen]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={styles.cardTitle}>Refund Conditions</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Refunds are allowed ONLY if ALL of the following conditions are met:
        </Text>
        <View style={styles.bulletList}>
          <BulletPoint title="eSIM NOT installed" text="The eSIM profile has not been installed or activated on any device" />
          <BulletPoint title="No data used" text="Zero data consumption has occurred on the eSIM" />
          <BulletPoint title="eSIM ready but not activated" text="The eSIM must be ready for installation but not yet installed" />
          <BulletPoint title="Within validity period" text="Request must be made before the eSIM's validity period expires" />
        </View>
      </View>

      {/* Non-Refundable */}
      <View style={[styles.policyCard, styles.cardRed]}>
        <Text style={styles.cardTitle}>✕ Non-Refundable Situations</Text>
        <Text style={styles.cardSubtitle}>
          Refunds will NOT be provided in the following situations:
        </Text>
        <View style={styles.bulletList}>
          <BulletPoint title="eSIM already activated" text="Once the eSIM is installed and activated on a device" />
          <BulletPoint title="Data has been used" text="Any data consumption has occurred, even if minimal" />
          <BulletPoint title="Wrong device" text="You purchased for a device that doesn't support eSIM" />
          <BulletPoint title="Wrong country/region" text="You purchased an eSIM for a different country than needed" />
          <BulletPoint title="Poor local coverage" text="Network coverage issues at your location" />
          <BulletPoint title="Validity expired" text="The eSIM's validity period has expired" />
          <BulletPoint title="Change of mind" text="Simply deciding you don't need the eSIM anymore" />
        </View>
      </View>

      {/* Process */}
      <View style={styles.policyCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="warning" size={20} color={theme.colors.warning} />
          <Text style={styles.cardTitle}>Refund Process</Text>
        </View>
        <View style={styles.numberedList}>
          <NumberedPoint num="1" title="Submit request" text="Contact support with your order ID and reason" />
          <NumberedPoint num="2" title="Email verification" text="We'll verify your email matches the order" />
          <NumberedPoint num="3" title="Review period" text="Our team will review within 24-48 hours" />
          <NumberedPoint num="4" title="Processing" text="If approved, refund within 3-5 business days" />
          <NumberedPoint num="5" title="Refund method" text="Refunds are issued to the original payment method" />
        </View>
      </View>

      {/* Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Important Notes</Text>
        <Text style={styles.noteText}>• All refund requests are reviewed on a case-by-case basis.</Text>
        <Text style={styles.noteText}>• Refunds may take 3-5 business days to appear in your account.</Text>
        <Text style={styles.noteText}>• If unsure about compatibility, use our device checker before purchasing.</Text>
        <Text style={styles.noteText}>• Once an eSIM is activated and data is used, we cannot process a refund.</Text>
      </View>
    </View>
  );
}

// Terms of Service Content
function TermsOfServiceContent() {
  return (
    <View style={styles.policyContent}>
      <Text style={styles.policyTitle}>Terms of Service</Text>
      <Text style={styles.policyIntro}>
        Please read these Terms of Service carefully before using Voyo eSIM services.
      </Text>

      <Section title="1. Definitions">
        <Text style={styles.sectionText}>
          <Text style={styles.bold}>"Voyo"</Text> refers to our eSIM marketplace platform and services.
        </Text>
        <Text style={styles.sectionText}>
          <Text style={styles.bold}>"eSIM"</Text> refers to the electronic SIM profile provided through our platform.
        </Text>
        <Text style={styles.sectionText}>
          <Text style={styles.bold}>"Service"</Text> refers to the eSIM data packages and related services we provide.
        </Text>
        <Text style={styles.sectionText}>
          <Text style={styles.bold}>"User"</Text> refers to any person or entity using our services.
        </Text>
      </Section>

      <Section title="2. Account Requirements">
        <Text style={styles.sectionText}>• You must be at least 18 years old to create an account and purchase eSIMs.</Text>
        <Text style={styles.sectionText}>• You are responsible for maintaining the confidentiality of your account credentials.</Text>
        <Text style={styles.sectionText}>• You must provide accurate and complete information when creating an account.</Text>
        <Text style={styles.sectionText}>• You are responsible for all activities that occur under your account.</Text>
      </Section>

      <Section title="3. Usage Rules">
        <Text style={styles.sectionText}>• eSIMs are for personal use only and may not be resold or transferred.</Text>
        <Text style={styles.sectionText}>• You must use the eSIM in accordance with applicable local laws and regulations.</Text>
        <Text style={styles.sectionText}>• You are responsible for ensuring your device is compatible with eSIM technology.</Text>
        <Text style={styles.sectionText}>• Data usage is subject to fair use policies and may be throttled if excessive.</Text>
      </Section>

      <Section title="4. Payment Terms">
        <Text style={styles.sectionText}>• All prices are displayed in USD (or your selected currency) and include applicable taxes.</Text>
        <Text style={styles.sectionText}>• Payment is required at the time of purchase.</Text>
        <Text style={styles.sectionText}>• We accept major credit/debit cards and other payment methods as displayed.</Text>
        <Text style={styles.sectionText}>• All purchases are final unless covered by our refund policy.</Text>
      </Section>

      <Section title="5. Service Limitations">
        <Text style={styles.sectionText}>• eSIM coverage and speeds depend on local network conditions.</Text>
        <Text style={styles.sectionText}>• We do not guarantee uninterrupted service or specific speeds.</Text>
        <Text style={styles.sectionText}>• Data validity periods begin upon eSIM activation, not purchase.</Text>
        <Text style={styles.sectionText}>• Unused data does not roll over after the validity period expires.</Text>
      </Section>

      <Section title="6. Liability">
        <Text style={styles.sectionText}>• We are not liable for any indirect, incidental, or consequential damages.</Text>
        <Text style={styles.sectionText}>• Our total liability is limited to the amount paid for the specific eSIM service.</Text>
        <Text style={styles.sectionText}>• We are not responsible for network outages or third-party service failures.</Text>
      </Section>

      <Section title="7. Privacy">
        <Text style={styles.sectionText}>• We collect and process personal data in accordance with our Privacy Policy.</Text>
        <Text style={styles.sectionText}>• By using our services, you consent to our data practices.</Text>
      </Section>

      <Section title="8. Termination">
        <Text style={styles.sectionText}>• We reserve the right to suspend or terminate accounts that violate these terms.</Text>
        <Text style={styles.sectionText}>• You may close your account at any time by contacting support.</Text>
      </Section>
    </View>
  );
}

// Affiliate Terms Content
function AffiliateTermsContent() {
  return (
    <View style={styles.policyContent}>
      <Text style={styles.policyTitle}>Affiliate Program Terms</Text>
      <Text style={styles.policyIntro}>
        These terms govern participation in the Voyo eSIM Affiliate Program.
      </Text>

      <Section title="1. Program Overview">
        <Text style={styles.sectionText}>• Earn 10% commission on all purchases made by users you refer.</Text>
        <Text style={styles.sectionText}>• Commissions apply to both initial purchases and top-ups.</Text>
        <Text style={styles.sectionText}>• Referrals are tracked via unique affiliate links and codes.</Text>
        <Text style={styles.sectionText}>• Commission rates may change with 30 days notice.</Text>
      </Section>

      <Section title="2. Eligibility">
        <Text style={styles.sectionText}>• You must be 18 years or older to participate.</Text>
        <Text style={styles.sectionText}>• You must have an active Voyo account in good standing.</Text>
        <Text style={styles.sectionText}>• Self-referrals are not allowed and will result in account termination.</Text>
        <Text style={styles.sectionText}>• Multiple accounts per person are prohibited.</Text>
      </Section>

      <Section title="3. Commission Terms">
        <Text style={styles.sectionText}>• Commissions are calculated on the final purchase amount after discounts.</Text>
        <Text style={styles.sectionText}>• Commissions are credited after the order is confirmed paid.</Text>
        <Text style={styles.sectionText}>• Refunded orders will result in commission clawback.</Text>
        <Text style={styles.sectionText}>• Commissions can be converted to V-Cash or requested as cash payout.</Text>
      </Section>

      <Section title="4. Payout Requirements">
        <Text style={styles.sectionText}>• Minimum payout threshold is $50 USD.</Text>
        <Text style={styles.sectionText}>• Payouts are processed within 7-14 business days of request.</Text>
        <Text style={styles.sectionText}>• You are responsible for any applicable taxes on earnings.</Text>
        <Text style={styles.sectionText}>• Payout methods include PayPal and bank transfer.</Text>
      </Section>

      <Section title="5. Prohibited Activities">
        <Text style={styles.sectionText}>• Using spam or misleading marketing tactics.</Text>
        <Text style={styles.sectionText}>• Creating fake accounts or fraudulent referrals.</Text>
        <Text style={styles.sectionText}>• Bidding on branded keywords in paid advertising.</Text>
        <Text style={styles.sectionText}>• Misrepresenting Voyo services or pricing.</Text>
        <Text style={styles.sectionText}>• Cookie stuffing or forced clicks.</Text>
      </Section>

      <Section title="6. Account Suspension">
        <Text style={styles.sectionText}>• We may freeze accounts suspected of fraud pending investigation.</Text>
        <Text style={styles.sectionText}>• Confirmed violations result in permanent termination and forfeiture of unpaid commissions.</Text>
        <Text style={styles.sectionText}>• You may appeal frozen accounts by contacting support.</Text>
      </Section>

      <Section title="7. Program Changes">
        <Text style={styles.sectionText}>• We reserve the right to modify or discontinue the program at any time.</Text>
        <Text style={styles.sectionText}>• Major changes will be communicated with 30 days notice.</Text>
        <Text style={styles.sectionText}>• Continued participation constitutes acceptance of updated terms.</Text>
      </Section>
    </View>
  );
}

// Privacy Policy Content
function PrivacyPolicyContent() {
  return (
    <View style={styles.policyContent}>
      <Text style={styles.policyTitle}>Privacy Policy</Text>
      <Text style={styles.policyIntro}>
        Voyo eSIM is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
      </Text>

      <Section title="1. Information We Collect">
        <Text style={styles.sectionText}>• <Text style={styles.bold}>Personal Information:</Text> Email, name, and payment details for order processing.</Text>
        <Text style={styles.sectionText}>• <Text style={styles.bold}>Usage Data:</Text> How you interact with our app, pages viewed, features used.</Text>
        <Text style={styles.sectionText}>• <Text style={styles.bold}>Device Information:</Text> Device type, OS, identifiers for compatibility.</Text>
        <Text style={styles.sectionText}>• <Text style={styles.bold}>Location Data:</Text> With permission, to suggest relevant eSIM plans.</Text>
      </Section>

      <Section title="2. How We Use Information">
        <Text style={styles.sectionText}>• Process and fulfill your eSIM purchases</Text>
        <Text style={styles.sectionText}>• Send order confirmations and installation instructions</Text>
        <Text style={styles.sectionText}>• Provide customer support</Text>
        <Text style={styles.sectionText}>• Improve our app and services</Text>
        <Text style={styles.sectionText}>• Detect and prevent fraud</Text>
      </Section>

      <Section title="3. Information Sharing">
        <Text style={styles.sectionText}>We do not sell your personal information. We share data with:</Text>
        <Text style={styles.sectionText}>• <Text style={styles.bold}>Service Providers:</Text> Payment processors, eSIM providers, hosting.</Text>
        <Text style={styles.sectionText}>• <Text style={styles.bold}>eSIM Carriers:</Text> Network operators for eSIM provisioning.</Text>
        <Text style={styles.sectionText}>• <Text style={styles.bold}>Legal Requirements:</Text> When required by law.</Text>
      </Section>

      <Section title="4. Data Security">
        <Text style={styles.sectionText}>• SSL/TLS encryption for all data transmission</Text>
        <Text style={styles.sectionText}>• Secure payment processing through Stripe</Text>
        <Text style={styles.sectionText}>• Regular security audits</Text>
        <Text style={styles.sectionText}>• Limited access on a need-to-know basis</Text>
      </Section>

      <Section title="5. Your Rights">
        <Text style={styles.sectionText}>You have the right to:</Text>
        <Text style={styles.sectionText}>• Access your personal data</Text>
        <Text style={styles.sectionText}>• Correct inaccurate information</Text>
        <Text style={styles.sectionText}>• Request deletion of your data</Text>
        <Text style={styles.sectionText}>• Export your data</Text>
        <Text style={styles.sectionText}>• Withdraw consent for marketing</Text>
      </Section>

      <Section title="6. Contact">
        <Text style={styles.sectionText}>
          For privacy questions, contact us at privacy@voyagedata.io
        </Text>
      </Section>
    </View>
  );
}

// Helper Components
function BulletPoint({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.bulletItem}>
      <Text style={styles.bulletTitle}>{title}:</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

function NumberedPoint({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <View style={styles.numberedItem}>
      <View style={styles.numberCircle}>
        <Text style={styles.numberText}>{num}</Text>
      </View>
      <View style={styles.numberedContent}>
        <Text style={styles.numberedTitle}>{title}</Text>
        <Text style={styles.numberedText}>{text}</Text>
      </View>
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
  
  // Tab Bar
  tabBar: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBarContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.round,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  
  // Policy Content
  policyContent: {
    gap: theme.spacing.lg,
  },
  policyTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: theme.colors.text,
  },
  policyIntro: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  
  // Cards
  policyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  cardRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  cardSubtitle: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  
  // Bullets
  bulletList: {
    gap: theme.spacing.sm,
  },
  bulletItem: {
    marginBottom: 8,
  },
  bulletTitle: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
  },
  bulletText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  
  // Numbered List
  numberedList: {
    gap: theme.spacing.md,
  },
  numberedItem: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    ...theme.typography.small,
    color: theme.colors.white,
    fontWeight: '700',
  },
  numberedContent: {
    flex: 1,
  },
  numberedTitle: {
    ...theme.typography.body, fontWeight: '500' as const,
    color: theme.colors.text,
  },
  numberedText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  
  // Notes
  notesSection: {
    gap: theme.spacing.sm,
  },
  notesTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  noteText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  
  // Sections (Terms)
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
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
  
  // Contact Section
  contactSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.lg,
  },
  contactText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  contactButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    ...theme.typography.body,
    fontWeight: '600' as const,
    color: theme.colors.white,
  },
});

