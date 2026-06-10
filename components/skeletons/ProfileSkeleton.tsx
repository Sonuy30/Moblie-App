import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SkeletonRect, SkeletonCircle } from './SkeletonBase';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

export function ProfileSkeleton() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <SkeletonRect width="40%" height={22} radius={4} />
      </View>

      <View style={styles.profileCard}>
        <SkeletonCircle size={64} />
        <View style={styles.profileInfo}>
          <SkeletonRect width="60%" height={18} radius={3} style={styles.mb6} />
          <SkeletonRect width="40%" height={14} radius={3} style={styles.mb6} />
          <SkeletonRect width="50%" height={20} radius={6} />
        </View>
      </View>

      <View style={styles.menu}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[styles.menuItem, i === 6 && styles.borderBottom0]}>
            <View style={styles.rowAlignCenter}>
              <SkeletonRect width={22} height={22} radius={4} />
              <SkeletonRect width={100} height={14} radius={3} />
            </View>
            <SkeletonRect width={14} height={14} radius={3} />
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <SkeletonRect width="50%" height={16} radius={3} />
      </View>

      <View style={styles.menu}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.prefRow, i === 3 && styles.borderBottom0]}>
            <SkeletonRect width={38} height={38} radius={10} />
            <View style={styles.prefInfo}>
              <SkeletonRect width="40%" height={14} radius={3} style={styles.mb6} />
              <SkeletonRect width="85%" height={12} radius={3} style={styles.mb4} />
              <SkeletonRect width="60%" height={12} radius={3} />
            </View>
            <SkeletonRect width={40} height={24} radius={12} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  borderBottom0: {
    borderBottomWidth: 0,
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  mb4: {
    marginBottom: 4,
  },
  mb6: {
    marginBottom: 6,
  },
  menu: {
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 3,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  prefInfo: {
    flex: 1,
    gap: 2,
    marginLeft: 12,
  },
  prefRow: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  rowAlignCenter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl + 4,
  },
});
