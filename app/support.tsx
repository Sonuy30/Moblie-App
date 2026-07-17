import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SUPPORT_PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE || '9876543210';
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@aitsshop.in';
const COMPANY_NAME = process.env.EXPO_PUBLIC_COMPANY_NAME || 'AITS Shop';

// ── FAQ Data ──────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'How do I track my shipment?',
    a: `Once your order is shipped, you'll receive an SMS and in-app notification with a tracking link. Go to My Orders → tap your order → "Live Track" to see real-time delivery status. Tracking updates every 30 minutes.`,
  },
  {
    q: 'How long does a payment refund take?',
    a: `Refunds are processed within 5–7 business days after your return is inspected and approved. UPI and online payments are refunded to the original method. COD orders receive a bank transfer within 7 business days. You'll get an in-app notification when the refund is initiated.`,
  },
  {
    q: 'Can I change my delivery address after placing an order?',
    a: `Address changes are only possible while your order is in "Confirmed" or "Packed" status. Once shipped, the address cannot be modified. Contact our support team immediately via WhatsApp for address corrections — we'll do our best to help!`,
  },
  {
    q: 'What is the return window and how do I initiate one?',
    a: `You have 7 days from delivery to request a return. Go to My Orders → select the delivered order → tap "Return / Exchange Items". Choose the items, select a reason, and we'll schedule a doorstep pickup within 24 hours.`,
  },
  {
    q: "Why was my payment deducted but I didn\u2019t receive an order confirmation?",
    a: "This can happen due to network issues during payment processing. Wait 10 minutes and check My Orders \u2014 the order may still appear. If it doesn\u2019t, contact us on WhatsApp with your payment screenshot. We\u2019ll verify and either confirm the order or issue a full refund within 24 hours.",
  },
];

// ── FAQ Accordion Item ────────────────────────────────────────────────────────

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <View style={styles.faqCard}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityLabel={q}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.faqQuestion}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.faqBody}>
          <Text style={styles.faqAnswer}>{a}</Text>
        </View>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFAQ((prev) => (prev === idx ? null : idx));
  };

  const openWhatsApp = async () => {
    const phone = `91${SUPPORT_PHONE}`;
    const msg = encodeURIComponent(
      `Hi ${COMPANY_NAME} Support! I need help with my order.`
    );
    const url = `whatsapp://send?phone=${phone}&text=${msg}`;
    const webUrl = `https://wa.me/${phone}?text=${msg}`;
    try {
      const supported = await Linking.canOpenURL(url);
      await Linking.openURL(supported ? url : webUrl);
    } catch {
      Alert.alert('WhatsApp Not Found', `Please contact us at +91 ${SUPPORT_PHONE}`);
    }
  };

  const openEmail = async () => {
    const subject = encodeURIComponent(`${COMPANY_NAME} Support Request`);
    const body = encodeURIComponent('Hi Support Team,\n\nI need help with:\n\n');
    const url = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email', `Send your query to ${SUPPORT_EMAIL}`);
    }
  };

  const callSupport = async () => {
    const url = `tel:+91${SUPPORT_PHONE}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Call Us', `+91 ${SUPPORT_PHONE}`);
    }
  };

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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── SECTION 1: Quick Contact Actions ── */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.sectionSub}>
          Our support team is available Mon–Sat, 9 AM – 7 PM IST.
        </Text>

        <View style={styles.actionGrid}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={[styles.actionCard, styles.whatsappCard]}
            onPress={() => { void openWhatsApp(); }}
            activeOpacity={0.85}
            accessibilityLabel="Chat on WhatsApp"
            accessibilityRole="button"
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            </View>
            <Text style={styles.actionCardTitle}>WhatsApp</Text>
            <Text style={styles.actionCardSub}>Chat with us instantly</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.actionCard, styles.emailCard]}
            onPress={() => { void openEmail(); }}
            activeOpacity={0.85}
            accessibilityLabel="Email support"
            accessibilityRole="button"
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="mail-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.actionCardTitle}>Email</Text>
            <Text style={styles.actionCardSub}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>

          {/* Call */}
          <TouchableOpacity
            style={[styles.actionCard, styles.callCard]}
            onPress={() => { void callSupport(); }}
            activeOpacity={0.85}
            accessibilityLabel="Call support"
            accessibilityRole="button"
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="call-outline" size={28} color={colors.success} />
            </View>
            <Text style={styles.actionCardTitle}>Call Us</Text>
            <Text style={styles.actionCardSub}>+91 {SUPPORT_PHONE}</Text>
          </TouchableOpacity>

          {/* Track Order shortcut */}
          <TouchableOpacity
            style={[styles.actionCard, styles.ordersCard]}
            onPress={() => router.push('/(tabs)/account')}
            activeOpacity={0.85}
            accessibilityLabel="My orders"
            accessibilityRole="button"
          >
            <View style={styles.actionIconBg}>
              <Ionicons name="cube-outline" size={28} color={colors.warning} />
            </View>
            <Text style={styles.actionCardTitle}>My Orders</Text>
            <Text style={styles.actionCardSub}>Track & manage orders</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION 2: FAQ Accordions ── */}
        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
          Frequently Asked Questions
        </Text>

        {FAQS.map((faq, idx) => (
          <FAQItem
            key={idx}
            q={faq.q}
            a={faq.a}
            open={openFAQ === idx}
            onToggle={() => toggleFAQ(idx)}
          />
        ))}

        {/* Still need help? */}
        <View style={styles.stillNeedHelp}>
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.stillTitle}>Still need help?</Text>
            <Text style={styles.stillSub}>
              Our team typically responds within 2 hours on WhatsApp.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => { void openWhatsApp(); }}
            activeOpacity={0.8}
            accessibilityLabel="Chat now on WhatsApp"
            accessibilityRole="button"
          >
            <Text style={styles.contactBtnText}>Chat Now</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  actionCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 2,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    width: '48%',
  },
  actionCardSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  actionCardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionIconBg: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  callCard: { borderLeftColor: colors.success, borderLeftWidth: 3 },
  contactBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  contactBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emailCard: { borderLeftColor: colors.primary, borderLeftWidth: 3 },
  faqAnswer: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  faqBody: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  faqHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  faqQuestion: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
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
  ordersCard: { borderLeftColor: colors.warning, borderLeftWidth: 3 },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
  },
  sectionSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  stillNeedHelp: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  stillSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  stillTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  whatsappCard: { borderLeftColor: '#25D366', borderLeftWidth: 3 },
});
