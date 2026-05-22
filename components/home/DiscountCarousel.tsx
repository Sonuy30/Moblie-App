import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Full width card minus padding

interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
  actionText: string;
}

const PROMOS: PromoCard[] = [
  {
    id: 'promo-001',
    title: 'Bulk Steel Bonanza',
    subtitle: 'Flat 15% OFF on orders above ₹1,00,000. Valid for registered B2B buyers.',
    badge: '🔥 HOT OFFER',
    icon: 'cube-outline',
    gradient: ['#0f2027', '#203a43'],
    actionText: 'Shop Bulk Steel',
  },
  {
    id: 'promo-002',
    title: 'Factory-Direct TMT Bars',
    subtitle: 'Certified Fe500D / Fe550D TMT rebars directly from mills at wholesale price.',
    badge: '🏗️ FACTORY PRICE',
    icon: 'construct-outline',
    gradient: ['#e65c00', '#f9a825'],
    actionText: 'View TMT Bars',
  },
  {
    id: 'promo-003',
    title: 'Free Site Delivery',
    subtitle: 'Zero freight charges on orders above 10 Metric Tons within city limits.',
    badge: '🚛 FREE FREIGHT',
    icon: 'bus-outline',
    gradient: ['#11998e', '#38ef7d'],
    actionText: 'Estimate Weight',
  },
  {
    id: 'promo-004',
    title: '30-Day B2B Credit Line',
    subtitle: 'Interest-free trade credit up to ₹5,00,000 for verified Pankaj Steel buyers.',
    badge: '💼 BUSINESS CREDIT',
    icon: 'business-outline',
    gradient: ['#4e54c8', '#8f94fb'],
    actionText: 'Apply for Credit',
  },
];

export default function DiscountCarousel() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Exclusive Deals</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Pankaj Steel Wholesale</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Direct from Pankaj Steel Private Limited</Text>
      </View>


      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContainer}
      >
        {PROMOS.map((promo) => (
          <TouchableOpacity key={promo.id} activeOpacity={0.9} style={styles.card}>
            <LinearGradient
              colors={promo.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.promoBadge}>{promo.badge}</Text>
                <View style={styles.iconCircle}>
                  <Ionicons name={promo.icon} size={20} color={colors.white} />
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoSub}>{promo.subtitle}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.actionBtnText}>{promo.actionText}</Text>
                <Ionicons name="arrow-forward-outline" size={14} color={colors.white} />
              </View>

              {/* Aesthetic light background highlights */}
              <View style={styles.bgDecoration} />
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    gap: 6,
    zIndex: 1,
    marginTop: -8,
  },
  promoTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.2,
  },
  promoSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)',
    paddingBottom: 2,
    zIndex: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  bgDecoration: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: -40,
    right: -20,
  },
});
