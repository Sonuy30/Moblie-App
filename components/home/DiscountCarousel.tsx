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

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

const getPromos = (): PromoCard[] => [
  {
    id: 'promo-001',
    title: 'TMT Bar Mega Saver',
    subtitle: 'Flat ₹7,500 OFF on full truckload orders. Upgrade your concrete reinforcement today.',
    badge: '⚡ HOT DEAL',
    icon: 'flame-outline',
    gradient: ['#fc4a1a', '#f7b733'],
    actionText: 'Shop TMT Bars',
  },
  {
    id: 'promo-002',
    title: 'Binding Wire Combo',
    subtitle: `Buy 15 Bundles of Premium 18G Annealed Binding Wire, get 1 Bundle completely FREE!`,
    badge: '🎁 COMBO OFFER',
    icon: 'gift-outline',
    gradient: ['#1e3c72', '#2a5298'],
    actionText: 'Grab Combo Offer',
  },
  {
    id: 'promo-003',
    title: 'GI Pipe Price Drop',
    subtitle: 'Get up to 20% OFF on all 20mm & 25mm Light Grade Galvanized Iron Pipes.',
    badge: '📉 PRICE DROP',
    icon: 'trending-down-outline',
    gradient: ['#11998e', '#38ef7d'],
    actionText: 'View GI Pipes',
  },
  {
    id: 'promo-004',
    title: 'MS Structural Angle Deals',
    subtitle: 'Save ₹250 per piece on premium IS 2062 MS Angle Bars 40x40mm.',
    badge: '💥 SPECIAL DEAL',
    icon: 'pricetags-outline',
    gradient: ['#833ab4', '#fd1d1d'],
    actionText: 'Shop Structural Angle',
  },
];

export default function DiscountCarousel() {
  const promos = getPromos();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Today's Top Deals</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LIMITED TIME</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Direct from {companyName} Official Store</Text>
      </View>


      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContainer}
      >
        {promos.map((promo) => (
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
  actionBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bgDecoration: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 70,
    bottom: -40,
    height: 140,
    position: 'absolute',
    right: -20,
    width: 140,
  },
  card: {
    borderRadius: borderRadius.xl,
    elevation: 6,
    height: 180,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    width: CARD_WIDTH,
  },
  cardBody: {
    gap: 6,
    marginTop: -8,
    zIndex: 1,
  },
  cardFooter: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderBottomColor: 'rgba(255,255,255,0.6)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingBottom: 2,
    zIndex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
    position: 'relative',
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  promoBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: borderRadius.full,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  promoSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  promoTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  scrollContainer: {
    gap: 16,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
