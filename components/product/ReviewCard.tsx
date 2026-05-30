import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Avatar from '@/components/ui/Avatar';
import StarRating from './StarRating';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { timeAgo } from '@/utils/date';

interface ReviewCardProps {
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  title?: string;
  isHighlighted?: boolean;
}

export default function ReviewCard({
  userName,
  rating,
  comment,
  createdAt,
  title,
  isHighlighted,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = comment.length > 120;

  const ratingColor =
    rating >= 4 ? '#10b981' : rating >= 3 ? colors.star : colors.error;

  return (
    <View style={[styles.card, isHighlighted && styles.cardHighlighted]}>
      {/* Header row */}
      <View style={styles.header}>
        <Avatar name={userName} size={40} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.date}>{timeAgo(createdAt)}</Text>
        </View>
        {/* Rating pill */}
        <View style={[styles.ratingPill, { backgroundColor: ratingColor + '1A', borderColor: ratingColor + '40' }]}>
          <Text style={[styles.ratingPillNum, { color: ratingColor }]}>{rating.toFixed(1)}</Text>
          <Text style={[styles.ratingPillStar, { color: ratingColor }]}>★</Text>
        </View>
      </View>

      {/* Stars */}
      <StarRating rating={rating} showCount={false} size={13} />

      {/* Title */}
      {title ? <Text style={styles.title}>{title}</Text> : null}

      {/* Comment */}
      <Text style={styles.comment} numberOfLines={expanded || !isLong ? undefined : 3}>
        {comment}
      </Text>
      {isLong && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
        </TouchableOpacity>
      )}

      {/* Verified badge */}
      <View style={styles.verifiedRow}>
        <Text style={styles.verifiedText}>✓ Verified Purchase</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHighlighted: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight + '80',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  ratingPillNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  ratingPillStar: {
    fontSize: 11,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  comment: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  readMore: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  verifiedRow: {
    marginTop: 2,
  },
  verifiedText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
});
