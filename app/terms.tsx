import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const COMPANY_NAME = process.env.EXPO_PUBLIC_COMPANY_NAME || 'AITS Shop';
const EFFECTIVE_DATE = '1 June 2025';

// ── Content Data ──────────────────────────────────────────────────────────────

type Section = { heading: string; body: string };

const TERMS_SECTIONS: Section[] = [
  {
    heading: '1. Acceptance of Terms',
    body: `By accessing or using ${COMPANY_NAME} (the "Platform"), you agree to be bound by these Terms of Use. These terms constitute a legally binding agreement between you ("User") and ${COMPANY_NAME}. If you do not agree to these terms, you must discontinue use of the Platform immediately.`,
  },
  {
    heading: '2. B2B Identity & Account Binding',
    body: `${COMPANY_NAME} is a business-to-business (B2B) platform. Account registration is restricted to verified business entities. Each account is uniquely bound to a GST-registered business identity. You are solely responsible for all activity conducted under your account credentials. Sharing, transferring, or selling account access to third parties is strictly prohibited and will result in immediate account suspension.`,
  },
  {
    heading: '3. Pricing & GST',
    body: `All prices displayed on the Platform are exclusive of GST unless explicitly stated. GST at applicable rates (currently 18% comprising 9% CGST + 9% SGST for intra-state, or 18% IGST for inter-state) will be added at checkout. Price discrepancies due to ERP synchronisation delays are resolved in favour of the confirmed order price at time of placement.`,
  },
  {
    heading: '4. Security Tokens & Session Management',
    body: `User sessions are secured using JWT (JSON Web Tokens) with a 15-minute access token lifetime and a 7-day refresh token window. Refresh tokens are stored in device-level SecureStore (iOS Keychain / Android Keystore) and are never transmitted in URLs. Multi-device login is permitted; however, logging out on one device invalidates only that device's session token. You must report any suspected unauthorised access immediately.`,
  },
  {
    heading: '5. Return & Liability Window',
    body: `Returns and exchanges are accepted within 7 days of confirmed delivery. ${COMPANY_NAME}'s liability for any defective, damaged, or incorrectly shipped product is limited to the value of that specific product. We are not liable for consequential, incidental, or indirect losses arising from delayed delivery, product defects, or payment failures beyond the refund of the order amount.`,
  },
  {
    heading: '6. Prohibited Use',
    body: `Users may not: (a) use the Platform for any unlawful purpose; (b) attempt to gain unauthorised access to our systems; (c) submit fraudulent orders or payment details; (d) scrape, crawl, or harvest Platform data; (e) use the Platform to transmit spam, malware, or harmful code. Violation of these rules may result in immediate account termination and potential legal action.`,
  },
  {
    heading: '7. Modification of Terms',
    body: `${COMPANY_NAME} reserves the right to modify these Terms at any time. Material changes will be communicated via in-app notification at least 7 days prior to taking effect. Continued use of the Platform after changes constitute acceptance of the revised Terms.`,
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    heading: '1. Information We Collect',
    body: `We collect: (a) Identity data — name, phone number, email, GSTIN, and business address provided during registration; (b) Transaction data — order history, payment methods, and delivery addresses; (c) Device data — device ID, OS version, push notification tokens; (d) Usage data — browsing patterns, search queries, and feature interactions within the Platform.`,
  },
  {
    heading: '2. How We Use Your Data',
    body: `Your data is used to: (a) Process and fulfil your orders; (b) Send order status notifications and delivery updates; (c) Prevent fraud and ensure platform security; (d) Improve product recommendations and Platform features; (e) Comply with legal and GST audit obligations. We do not sell your personal data to third parties.`,
  },
  {
    heading: '3. Data Sharing',
    body: `We share your data only with: (a) Delivery partners — name, phone, and delivery address for fulfilment; (b) Payment processors (Razorpay) — order amount and reference ID; (c) Legal authorities — when required by law or court order; (d) Our ERP system — order and account data for B2B billing and credit management. All third parties are contractually bound to protect your data.`,
  },
  {
    heading: '4. Security Measures',
    body: `We implement industry-standard security: AES-256 encryption for data at rest, TLS 1.3 for data in transit, JWT-based session tokens with short expiry, device-level SecureStore for credential persistence, and regular penetration testing. Despite these measures, no system is completely immune from breach. You acknowledge this inherent risk.`,
  },
  {
    heading: '5. Data Retention',
    body: `Account data is retained for 5 years post account closure to meet GST audit requirements. Transaction records are retained for 7 years as mandated by Indian tax law. Anonymised usage analytics are retained indefinitely for product improvement. You may request deletion of non-statutory personal data by contacting our support team.`,
  },
  {
    heading: '6. Your Rights',
    body: `Under applicable Indian data protection laws, you have the right to: access data we hold about you; correct inaccurate data; request deletion of non-statutory data; withdraw consent for marketing communications; lodge a complaint with the relevant data protection authority. Submit requests via WhatsApp or email to our support team.`,
  },
  {
    heading: '7. Cookies & Analytics',
    body: `The mobile application does not use browser cookies. We use privacy-respecting analytics to understand feature usage patterns. Crash reports are collected via Sentry and contain anonymised device and stack trace data only. You may opt out of crash reporting by disabling it in Account Settings.`,
  },
];

// ── Section Component ─────────────────────────────────────────────────────────

function PolicySection({ heading, body }: Section) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      <Text style={styles.sectionBody}>{body}</Text>
    </View>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────

type Tab = 'terms' | 'privacy';

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TermsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('terms');

  const sections = activeTab === 'terms' ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const tabLabel = activeTab === 'terms' ? 'Terms of Use' : 'Privacy Policy';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['terms', 'privacy'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
          >
            <Ionicons
              name={tab === 'terms' ? 'document-text-outline' : 'shield-checkmark-outline'}
              size={16}
              color={activeTab === tab ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'terms' ? 'Terms of Use' : 'Privacy Policy'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Doc header */}
        <View style={styles.docHeader}>
          <View style={styles.docIconBg}>
            <Ionicons
              name={activeTab === 'terms' ? 'document-text-outline' : 'shield-checkmark-outline'}
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.docTitle}>{tabLabel}</Text>
          <Text style={styles.docMeta}>
            {COMPANY_NAME} · Effective {EFFECTIVE_DATE}
          </Text>
        </View>

        {/* Notice box */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
          <Text style={styles.noticeText}>
            Please read this document carefully. By using {COMPANY_NAME}, you agree to these terms.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((s, i) => (
          <PolicySection key={i} heading={s.heading} body={s.body} />
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {EFFECTIVE_DATE}. For questions, contact our support team.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/support')}
            activeOpacity={0.8}
            accessibilityLabel="Contact support"
            accessibilityRole="button"
          >
            <Text style={styles.footerLink}>Contact Support →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  docHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  docIconBg: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 64,
  },
  docMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  docTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: { width: 40 },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  noticeBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.warning,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 1,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  sectionHeading: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabBar: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primary,
  },
});
