import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import type { RatingSummaryData } from '@/types/review';
import StarRating from './StarRating';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface RatingSummaryProps {
  summary: RatingSummaryData;
}

export default function RatingSummary({ summary }: RatingSummaryProps) {
  const { average, totalCount, breakdown } = summary;

  return (
    <View style={styles.container}>
      {/* Average Score Area */}
      <View style={styles.averageSection}>
        <Text style={styles.averageScore}>{average.toFixed(1)}</Text>
        <StarRating rating={average} readonly size={18} />
        <Text style={styles.totalCountText}>
          {totalCount} rating{totalCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Breakdown Bars Area */}
      <View style={styles.breakdownSection}>
        {breakdown.map((row) => (
          <View key={row.stars} style={styles.breakdownRow}>
            {/* Star label */}
            <Text style={styles.starLabelText}>{row.stars} ★</Text>

            {/* Bar Track */}
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(Math.max(row.percentage, 0), 100)}%` },
                ]}
              />
            </View>

            {/* Count text */}
            <Text style={styles.countText}>{row.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  averageScore: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
  },
  averageSection: {
    alignItems: 'center',
    flex: 1.2,
    justifyContent: 'center',
  },
  barFill: {
    backgroundColor: '#FFD700', // Gold color for filled progress bar
    borderRadius: borderRadius.full,
    height: '100%',
  },
  barTrack: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    flex: 1,
    height: 6,
    marginHorizontal: spacing.sm,
  },
  breakdownRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 20,
    marginVertical: 2,
  },
  breakdownSection: {
    flex: 2,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  countText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    width: 24,
  },
  divider: {
    backgroundColor: colors.border,
    height: '80%',
    width: 1,
  },
  starLabelText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    width: 24,
  },
  totalCountText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
