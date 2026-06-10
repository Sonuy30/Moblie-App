import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonRect, SkeletonCircle } from './SkeletonBase';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

export function ProductDetailSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <SkeletonRect width="100%" height={320} radius={0} />

      <View style={styles.content}>
        <SkeletonRect width="30%" height={14} style={styles.mb8} />
        <SkeletonRect width="90%" height={26} style={styles.mb8} />
        <SkeletonRect width="50%" height={16} style={styles.mb16} />

        <View style={styles.row}>
          <SkeletonRect width="40%" height={28} />
          <SkeletonRect width="20%" height={18} />
        </View>

        <SkeletonRect width="35%" height={20} radius={4} style={styles.mb16} />

        <View style={styles.variantSection}>
          <SkeletonRect width="25%" height={14} style={styles.mb8} />
          <View style={styles.row}>
            <SkeletonRect width={60} height={36} radius={8} />
            <SkeletonRect width={60} height={36} radius={8} />
            <SkeletonRect width={60} height={36} radius={8} />
          </View>
        </View>

        <View style={styles.card}>
          <SkeletonRect width="40%" height={14} style={styles.mb8} />
          <View style={styles.row}>
            <SkeletonRect width="70%" height={40} radius={8} />
            <SkeletonRect width="25%" height={40} radius={8} />
          </View>
        </View>

        <View style={[styles.card, styles.rowAlignCenter]}>
          <SkeletonCircle size={44} />
          <View style={styles.flex1Gap6}>
            <SkeletonRect width="60%" height={16} />
            <SkeletonRect width="40%" height={12} />
          </View>
        </View>

        <View style={styles.gap8}>
          <SkeletonRect width="40%" height={16} />
          <SkeletonRect width="100%" height={12} />
          <SkeletonRect width="100%" height={12} />
          <SkeletonRect width="80%" height={12} />
        </View>

        <View style={styles.gap8}>
          <SkeletonRect width="50%" height={16} />
          <View style={styles.rowAlignCenter}>
            <SkeletonRect width="30%" height={48} />
            <View style={styles.flex1Gap4}>
              <SkeletonRect width="100%" height={8} radius={4} />
              <SkeletonRect width="90%" height={8} radius={4} />
              <SkeletonRect width="80%" height={8} radius={4} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  container: {
    paddingBottom: 100,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  flex1Gap4: {
    flex: 1,
    gap: 4,
  },
  flex1Gap6: {
    flex: 1,
    gap: 6,
  },
  gap8: {
    gap: 8,
  },
  mb16: {
    marginBottom: 16,
  },
  mb8: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowAlignCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  variantSection: {
    gap: 8,
    marginTop: 8,
  },
});
