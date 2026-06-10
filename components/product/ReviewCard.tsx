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
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 2,
    gap: 8,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardHighlighted: {
    backgroundColor: colors.primaryLight + '80',
    borderColor: colors.primary + '40',
  },
  comment: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  date: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  ratingPill: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingPillNum: {
    fontSize: 12,
    fontWeight: '800',
  },
  ratingPillStar: {
    fontSize: 11,
  },
  readMore: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedRow: {
    marginTop: 2,
  },
  verifiedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
});
