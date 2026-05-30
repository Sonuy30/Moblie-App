import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface RatingBreakdownProps {
  avgRating: number;
  reviewCount: number;
  reviews: { rating: number }[];
}

export default function RatingBreakdown({ avgRating, reviewCount, reviews }: RatingBreakdownProps) {
  if (reviewCount === 0) return null;

  // Count per star
  const starCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  const maxCount = Math.max(...starCounts.map((s) => s.count), 1);

  const ratingColor = avgRating >= 4 ? '#10b981' : avgRating >= 3 ? colors.star : colors.error;

  return (
    <View style={styles.container}>
      {/* Big Score */}
      <View style={styles.scoreBox}>
        <Text style={[styles.scoreNum, { color: ratingColor }]}>{avgRating.toFixed(1)}</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name={s <= Math.round(avgRating) ? 'star' : 'star-outline'}
              size={14}
              color={colors.star}
            />
          ))}
        </View>
        <Text style={styles.reviewCountText}>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</Text>
      </View>

      {/* Bar breakdown */}
      <View style={styles.barsContainer}>
        {starCounts.map(({ star, count }) => {
          const pct = (count / maxCount) * 100;
          return (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}</Text>
              <Ionicons name="star" size={10} color={colors.star} />
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 72,
  },
  scoreNum: {
    fontSize: 42,
    fontWeight: '900',
    lineHeight: 44,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  reviewCountText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  barsContainer: {
    flex: 1,
    gap: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 12,
    textAlign: 'right',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.star,
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    color: colors.textMuted,
    width: 16,
    textAlign: 'right',
    fontWeight: '600',
  },
});
