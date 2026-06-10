import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonRect } from './SkeletonBase';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

export function SearchResultSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonRect width={120} height={140} radius={0} />
      <View style={styles.info}>
        <View style={styles.gap4}>
          <SkeletonRect width="90%" height={14} radius={3} style={styles.mb4} />
          <SkeletonRect width="60%" height={14} radius={3} />
        </View>

        <View style={styles.priceRow}>
          <SkeletonRect width="40%" height={16} radius={3} />
          <SkeletonRect width="25%" height={12} radius={3} />
        </View>

        <SkeletonRect width="50%" height={10} radius={2} />

        <View style={styles.actions}>
          <SkeletonRect width="75%" height={32} radius={borderRadius.sm} />
          <SkeletonRect width={36} height={36} radius={18} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 3,
    flexDirection: 'row',
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  gap4: {
    gap: 4,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  mb4: {
    marginBottom: 4,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
});
