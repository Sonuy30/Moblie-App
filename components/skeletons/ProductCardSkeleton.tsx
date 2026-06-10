import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonRect } from './SkeletonBase';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

export function ProductCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonRect width="100%" height={CARD_WIDTH * 0.95} radius={0} />
      <View style={styles.info}>
        <SkeletonRect width="90%" height={12} radius={3} style={styles.mb4} />
        <SkeletonRect width="60%" height={12} radius={3} style={styles.mb8} />
        
        <View style={styles.priceRow}>
          <SkeletonRect width="40%" height={16} radius={3} />
          <SkeletonRect width="25%" height={12} radius={3} />
        </View>

        <SkeletonRect width="50%" height={10} radius={2} style={styles.mb8} />
        <SkeletonRect width="35%" height={10} radius={2} style={styles.mb8} />
        <SkeletonRect width="100%" height={32} radius={borderRadius.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    width: CARD_WIDTH,
  },
  info: {
    gap: 4,
    padding: spacing.md,
  },
  mb4: {
    marginBottom: 4,
  },
  mb8: {
    marginBottom: 8,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
    marginTop: 2,
  },
});
