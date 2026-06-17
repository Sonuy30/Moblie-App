/**
 * DiscountCarousel — "Today's Offers" horizontal cards
 *
 * Shows flat-discount offer cards (e.g. "Flat 10% Off", "Flat 20% Off").
 * Each card:
 *  - Shows a flat % offer label and the price range of products in that bracket
 *  - Tapping navigates to the search/catalog screen filtered to show that discount range
 *
 * No demo names. All data is real products from the API.
 * Date validity is computed dynamically (today + 7 days).
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { useProducts } from '@/hooks/useProducts';
import { formatINR } from '@/utils/currency';

const CARD_WIDTH = 210;

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama Enterprises';

/** Format a date as "12 Jun" */
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Returns "Valid: 12 Jun – 19 Jun" covering today + 7 days */
function getOfferValidity(): string {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return `Valid: ${fmtDate(start)} – ${fmtDate(end)}`;
}

// Offer tiers — each maps to a discount % bracket
const OFFER_TIERS = [
  {
    minDiscount: 5,
    maxDiscount: 14,
    label: 'Flat 5% Off',
    subLabel: 'On selected items',
    gradient: ['#185FA5', '#2A80D2'] as [string, string],
    icon: 'pricetag-outline' as const,
    sortParam: 'price_asc',
  },
  {
    minDiscount: 15,
    maxDiscount: 24,
    label: 'Flat 15% Off',
    subLabel: 'Limited stock offer',
    gradient: ['#1b4332', '#2d6a4f'] as [string, string],
    icon: 'flash-outline' as const,
    sortParam: 'popular',
  },
  {
    minDiscount: 25,
    maxDiscount: 49,
    label: 'Flat 25% Off',
    subLabel: 'Best seller deals',
    gradient: ['#7b2d00', '#c1440e'] as [string, string],
    icon: 'flame-outline' as const,
    sortParam: 'popular',
  },
  {
    minDiscount: 50,
    maxDiscount: 100,
    label: 'Flat 50% Off',
    subLabel: 'Clearance special',
    gradient: ['#4a0072', '#7b1fa2'] as [string, string],
    icon: 'gift-outline' as const,
    sortParam: 'price_desc',
  },
];

export default function DiscountCarousel() {
  const { data, isLoading } = useProducts({ limit: 100 });
  const rawProducts = data?.products || [];
  const offerValidity = getOfferValidity();

  // Build tiers: for each tier, find matching products
  const tiersWithProducts = OFFER_TIERS.map((tier) => {
    const matching = rawProducts.filter(
      (p) =>
        typeof p.discount === 'number' &&
        p.discount >= tier.minDiscount &&
        p.discount <= tier.maxDiscount
    );
    return { ...tier, products: matching, count: matching.length };
  });

  // If no products have any discount at all, show a "Shop All" card for all products
  const hasAnyDiscount = tiersWithProducts.some((t) => t.count > 0);

  // Build fallback cards from price ranges when no discounts exist
  const fallbackTiers = [
    {
      label: 'Under ₹500',
      subLabel: 'Budget picks',
      gradient: ['#185FA5', '#2A80D2'] as [string, string],
      icon: 'wallet-outline' as const,
      navParams: { maxPrice: '500' },
      priceRange: `Up to ${formatINR(500)}`,
    },
    {
      label: '₹500 – ₹2,000',
      subLabel: 'Popular range',
      gradient: ['#1b4332', '#2d6a4f'] as [string, string],
      icon: 'trending-up-outline' as const,
      navParams: { minPrice: '500', maxPrice: '2000' },
      priceRange: `${formatINR(500)} – ${formatINR(2000)}`,
    },
    {
      label: '₹2,000 – ₹10,000',
      subLabel: 'Premium selection',
      gradient: ['#7b2d00', '#c1440e'] as [string, string],
      icon: 'star-outline' as const,
      navParams: { minPrice: '2000', maxPrice: '10000' },
      priceRange: `${formatINR(2000)} – ${formatINR(10000)}`,
    },
    {
      label: 'Above ₹10,000',
      subLabel: 'Industrial grade',
      gradient: ['#4a0072', '#7b1fa2'] as [string, string],
      icon: 'cube-outline' as const,
      navParams: { minPrice: '10000' },
      priceRange: `${formatINR(10000)}+`,
    },
  ];

  if (isLoading || rawProducts.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{"Today's Offers"}</Text>
          <View style={styles.validBadge}>
            <Ionicons name="time-outline" size={10} color={colors.primary} />
            <Text style={styles.validText}>{offerValidity}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Direct from {companyName} Official Store</Text>
      </View>

      {/* Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {hasAnyDiscount
          ? // ── Discount-based cards ─────────────────────────────────────
            tiersWithProducts
              .filter((t) => t.count > 0)
              .map((tier) => {
                // Compute price range of matching products
                const prices = tier.products.map((p) => p.storePrice);
                const minP = Math.min(...prices);
                const maxP = Math.max(...prices);
                const priceRangeText =
                  minP === maxP
                    ? formatINR(minP)
                    : `${formatINR(minP)} – ${formatINR(maxP)}`;

                return (
                  <OfferCard
                    key={tier.label}
                    label={tier.label}
                    subLabel={tier.subLabel}
                    gradient={tier.gradient}
                    icon={tier.icon}
                    priceRange={priceRangeText}
                    productCount={tier.count}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/search',
                        params: {
                          query: '',
                          minDiscount: String(tier.minDiscount),
                          sort: tier.sortParam,
                        },
                      })
                    }
                  />
                );
              })
          : // ── Price-range fallback cards when no discounts ──────────────
            fallbackTiers.map((tier) => (
              <OfferCard
                key={tier.label}
                label={tier.label}
                subLabel={tier.subLabel}
                gradient={tier.gradient}
                icon={tier.icon}
                priceRange={tier.priceRange}
                productCount={
                  rawProducts.filter((p) => {
                    const min = tier.navParams.minPrice
                      ? parseInt(tier.navParams.minPrice)
                      : 0;
                    const max = tier.navParams.maxPrice
                      ? parseInt(tier.navParams.maxPrice)
                      : Infinity;
                    return p.storePrice >= min && p.storePrice <= max;
                  }).length
                }
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/search',
                    params: tier.navParams,
                  })
                }
              />
            ))}
      </ScrollView>
    </View>
  );
}

// ── OfferCard ─────────────────────────────────────────────────────────────────

interface OfferCardProps {
  label: string;
  subLabel: string;
  gradient: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  priceRange: string;
  productCount: number;
  onPress: () => void;
}

function OfferCard({
  label,
  subLabel,
  gradient,
  icon,
  priceRange,
  productCount,
  onPress,
}: OfferCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.card}
      onPress={onPress}
    >
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circle */}
        <View style={styles.bgCircle} />
        <View style={styles.bgCircle2} />

        {/* Icon row */}
        <View style={styles.iconRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          {productCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{productCount} items</Text>
            </View>
          )}
        </View>

        {/* Offer label */}
        <Text style={styles.offerLabel}>{label}</Text>
        <Text style={styles.offerSub}>{subLabel}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Price range */}
        <View style={styles.priceRangeRow}>
          <Ionicons name="pricetag-outline" size={11} color="rgba(255,255,255,0.7)" />
          <Text style={styles.priceRangeText}>{priceRange}</Text>
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Shop Now</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bgCircle: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 80,
    bottom: -35,
    height: 130,
    position: 'absolute',
    right: -30,
    width: 130,
  },
  bgCircle2: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 60,
    height: 90,
    left: -20,
    position: 'absolute',
    top: -20,
    width: 90,
  },
  card: {
    borderRadius: borderRadius.xl,
    elevation: 6,
    height: 210,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    width: CARD_WIDTH,
  },
  container: {
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cta: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderBottomColor: 'rgba(255,255,255,0.5)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    paddingBottom: 2,
  },
  ctaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  divider: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: 1,
    marginVertical: 8,
  },
  gradient: {
    flex: 1,
    gap: 4,
    justifyContent: 'space-between',
    overflow: 'hidden',
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  offerLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  offerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  priceRangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  priceRangeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    gap: 12,
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
  validBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  validText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
});
