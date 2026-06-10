import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import type { Seller } from '@/types/product';

interface SellerCardProps {
  seller: Seller;
}

export default function SellerCard({ seller }: SellerCardProps) {
  if (!seller) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {/* Avatar Placeholder */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {seller.name.substring(0, 2).toUpperCase()}
          </Text>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {seller.name}
            </Text>
            {seller.isVerified && (
              <View style={styles.badge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.badgeText}>Verified Seller</Text>
              </View>
            )}
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              <Ionicons name="star" size={14} color={colors.star} />
              <Text style={styles.ratingText}>{seller.rating.toFixed(1)}</Text>
            </View>
            <Text style={styles.bullet}>·</Text>
            <Text style={styles.reviews}>
              {seller.reviewCount.toLocaleString()} Ratings
            </Text>
            {seller.joinDate && (
              <>
                <Text style={styles.bullet}>·</Text>
                <Text style={styles.joinDate}>
                  Joined {seller.joinDate}
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {seller.description && (
        <View style={styles.descContainer}>
          <Text style={styles.description} numberOfLines={3}>
            {seller.description}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  avatarText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  badge: {
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  bullet: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  descContainer: {
    borderTopColor: 'rgba(0,0,0,0.04)',
    borderTopWidth: 1,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  joinDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ratingText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  reviews: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  stars: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
});
