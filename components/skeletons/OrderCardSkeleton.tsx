import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonRect } from './SkeletonBase';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

export function OrderCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonRect width="35%" height={16} radius={4} />
        <SkeletonRect width="20%" height={20} radius={4} />
      </View>

      <View style={styles.itemsPreview}>
        <SkeletonRect width={48} height={48} radius={borderRadius.sm} />
        <SkeletonRect width={48} height={48} radius={borderRadius.sm} />
        <SkeletonRect width={48} height={48} radius={borderRadius.sm} />
      </View>

      <View style={styles.details}>
        <SkeletonRect width="50%" height={14} radius={3} style={styles.mb4} />
        <SkeletonRect width="40%" height={12} radius={3} style={styles.mb4} />
        <SkeletonRect width="45%" height={12} radius={3} />
      </View>

      <View style={styles.trackRow}>
        <SkeletonRect width="30%" height={14} radius={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 3,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  details: {
    gap: 2,
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemsPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  mb4: {
    marginBottom: 4,
  },
  trackRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
});
