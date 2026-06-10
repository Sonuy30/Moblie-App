import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { formatINR } from '@/utils/currency';

interface ShareCardProps {
  name: string;
  image: string;
  storePrice: number;
  mrp?: number;
  discount?: number;
}

export const ShareCard = forwardRef<View, ShareCardProps>(
  ({ name, image, storePrice, mrp, discount }, ref) => {
    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="construct" size={20} color={colors.white} />
          <View style={styles.headerText}>
            <Text style={styles.brandTitle}>AITS SHOP</Text>
            <Text style={styles.brandSubtitle}>PREMIUM STEEL & PIPES</Text>
          </View>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image }}
            style={styles.productImage}
            contentFit="cover"
            transition={100}
          />
          {discount !== undefined && discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.productName} numberOfLines={2}>
            {name}
          </Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.salePriceLabel}>SPECIAL PRICE</Text>
              <Text style={styles.salePrice}>{formatINR(storePrice)}</Text>
            </View>
            {mrp !== undefined && mrp > storePrice && (
              <View style={styles.mrpContainer}>
                <Text style={styles.mrpLabel}>MRP</Text>
                <Text style={styles.mrp}>{formatINR(mrp)}</Text>
              </View>
            )}
          </View>

          {/* CTA Footer */}
          <View style={styles.ctaContainer}>
            <Text style={styles.ctaText}>SHOP NOW</Text>
            <Ionicons name="arrow-forward-circle" size={18} color={colors.primary} />
          </View>
        </View>
      </View>
    );
  }
);

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  brandSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  brandTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  container: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 300, // Fixed width for clean share aspect ratio
  },
  ctaContainer: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingVertical: 10,
  },
  ctaText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: '#E64A19',
    borderRadius: borderRadius.sm,
    left: spacing.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: spacing.md,
  },
  discountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerText: {
    flexDirection: 'column',
  },
  imageContainer: {
    backgroundColor: colors.surface,
    height: 200,
    position: 'relative',
    width: '100%',
  },
  info: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  mrp: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  mrpContainer: {
    alignItems: 'flex-end',
  },
  mrpLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    height: 40,
    lineHeight: 20,
  },
  salePrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  salePriceLabel: {
    color: colors.textSecondary,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
