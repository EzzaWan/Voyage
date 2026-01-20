import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme';
import BottomNav from '../src/components/BottomNav';

type TabKey = 'install' | 'troubleshoot' | 'faq';

export default function Support() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('install');

  const tabs: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'install', label: 'Install', icon: 'phone-portrait-outline' },
    { key: 'troubleshoot', label: 'Fix', icon: 'construct-outline' },
    { key: 'faq', label: 'FAQ', icon: 'help-circle-outline' },
  ];

  const handleContactSupport = () => {
    router.push('/contact');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Saily-style Header */}
        <View style={styles.header}>
          <View style={styles.headerIconContainer}>
            <Text style={styles.headerIcon}>?</Text>
          </View>
          <Text style={styles.title}>Any issues?</Text>
          <Text style={styles.subtitle}>
            We'll try to help you.
          </Text>
        </View>

        {/* Action Menu (Saily style) */}
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/contact')}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="chatbubble-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Chat with us</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} onPress={() => Linking.openURL('mailto:support@voyage.com')}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Email us</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Tabs for Self-Help */}
        <Text style={styles.sectionTitle}>Self-help guides</Text>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.key ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'install' && <InstallGuideContent />}
        {activeTab === 'troubleshoot' && <TroubleshootContent />}
        {activeTab === 'faq' && <FAQContent />}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="support" />
    </View>
  );
}

function InstallGuideContent() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  const iosSteps = [
    { title: 'Open Camera App', content: 'Open Camera and scan the QR code.' },
    { title: 'Tap Notification', content: 'Tap "Cellular Plan detected".' },
    { title: 'Add Cellular Plan', content: 'Tap "Continue" -> "Add Cellular Plan".' },
    { title: 'Enable Roaming', content: 'Settings -> Cellular -> [eSIM] -> Enable Data Roaming.' },
  ];

  return (
    <View style={styles.contentSection}>
      <View style={styles.guideCard}>
        <View style={styles.guideHeader}>
          <Text style={styles.guideTitle}>iPhone Installation</Text>
        </View>
        {iosSteps.map((step, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.stepItem, index === iosSteps.length - 1 && styles.lastStepItem]}
            onPress={() => setExpandedStep(expandedStep === index ? null : index)}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            {expandedStep === index && <Text style={styles.stepContent}>{step.content}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TroubleshootContent() {
  return (
    <View style={styles.contentSection}>
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Common Fixes</Text>
        <View style={styles.stepItem}>
          <Text style={styles.stepTitle}>• Enable Data Roaming</Text>
        </View>
        <View style={styles.stepItem}>
          <Text style={styles.stepTitle}>• Restart Device</Text>
        </View>
        <View style={[styles.stepItem, styles.lastStepItem]}>
          <Text style={styles.stepTitle}>• Check Coverage</Text>
        </View>
      </View>
    </View>
  );
}

function FAQContent() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What is an eSIM?',
      answer: 'An eSIM (embedded SIM) is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It\'s built into your device and can be programmed remotely.',
    },
    {
      question: 'How quickly will I receive my eSIM?',
      answer: 'Your eSIM is delivered instantly via email after payment. You\'ll receive a QR code and activation instructions within minutes.',
    },
    {
      question: 'Can I use my regular SIM and eSIM together?',
      answer: 'Yes! Most eSIM-compatible devices support dual SIM, allowing you to use both your regular SIM and eSIM at the same time.',
    },
    {
      question: 'What happens if I don\'t use all my data?',
      answer: 'Unused data expires at the end of your plan\'s validity period. Some plans support top-ups if you need more data.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If your eSIM doesn\'t work as expected, contact support for a refund.',
    },
    {
      question: 'Can I use the eSIM for calls and texts?',
      answer: 'Most of our eSIMs are data-only plans. You can use apps like WhatsApp, Telegram, or iMessage for calls and texts over data.',
    },
    {
      question: 'How do I top up my eSIM?',
      answer: 'Go to My eSIMs, select your eSIM, and tap "Top Up Data" to purchase additional data for your existing eSIM.',
    },
    {
      question: 'Do I need to be in the destination country to activate?',
      answer: 'No, you can install and activate your eSIM before traveling. However, data will only work once you arrive in the destination country.',
    },
  ];

  return (
    <View style={styles.contentSection}>
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.stepItem, index === faqs.length - 1 && styles.lastStepItem]}
            onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
          >
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{faq.question}</Text>
              <Ionicons 
                name={expandedFaq === index ? "remove" : "add"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </View>
            {expandedFaq === index && (
              <Text style={styles.stepContent}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
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
    paddingBottom: theme.spacing.xl * 2,
  },
  // Saily Header Style
  header: {
    alignItems: 'center',
    paddingTop: 4,
    marginBottom: theme.spacing.lg,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.blueBorder,
  },
  headerIcon: {
    fontSize: 40,
    color: theme.colors.primary,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  // Menu Group
  menuGroup: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
    color: theme.colors.text,
  },
  chevron: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  // Tabs
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500' as const,
  },
  tabLabelActive: {
    color: theme.colors.white,
    fontWeight: '600' as const,
  },
  // Guide Card
  contentSection: {
    marginBottom: theme.spacing.lg,
  },
  guideCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
  },
  guideHeader: {
    marginBottom: theme.spacing.md,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text,
  },
  stepItem: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastStepItem: {
    borderBottomWidth: 0,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepExpand: {
    fontSize: 20,
    color: theme.colors.textMuted,
    fontWeight: '300' as const,
    marginLeft: theme.spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stepNumberText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700' as const,
  },
  stepTitle: {
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  stepContent: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    marginLeft: 36,
    lineHeight: 20,
  },
});
