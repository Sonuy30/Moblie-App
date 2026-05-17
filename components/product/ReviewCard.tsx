import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
}

export default function ReviewCard({
  userName,
  rating,
  comment,
  createdAt,
  title,
}: ReviewCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar name={userName} size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.date}>{timeAgo(createdAt)}</Text>
        </View>
      </View>
      <StarRating rating={rating} showCount={false} size={14} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.comment}>{comment}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: 8,
    marginBottom: spacing.md,
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
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  comment: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
