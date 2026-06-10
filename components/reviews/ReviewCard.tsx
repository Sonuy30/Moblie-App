import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import type { Review } from '@/types/review';
import StarRating from './StarRating';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { markHelpful } from '@/api/reviews';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [hasVotedHelpful, setHasVotedHelpful] = useState(false);

  const handleHelpfulPress = async () => {
    if (hasVotedHelpful) return;

    setHasVotedHelpful(true);
    setHelpfulCount((prev) => prev + 1);

    try {
      await markHelpful(review._id);
    } catch (err) {
      console.warn('Failed to register helpful vote:', err);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      {/* User info row */}
      <View style={styles.userRow}>
        {review.userAvatar ? (
          <Image source={{ uri: review.userAvatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{getInitials(review.userName)}</Text>
          </View>
        )}
        <View style={styles.userMeta}>
          <Text style={styles.userName}>{review.userName}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        {review.isVerifiedPurchase && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={styles.verifiedText}>Verified Purchase</Text>
          </View>
        )}
      </View>

      {/* Stars and Title */}
      <View style={styles.ratingRow}>
        <StarRating rating={review.rating} readonly size={14} />
        {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
      </View>

      {/* Review Body */}
      <Text style={styles.reviewBody}>{review.comment}</Text>

      {/* Review Photos */}
      {review.images && review.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photosScroll}
        >
          {review.images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={styles.reviewPhoto}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>
      )}

      {/* Card Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.helpfulBtn, hasVotedHelpful && styles.helpfulBtnActive]}
          activeOpacity={0.7}
          onPress={() => {
            void handleHelpfulPress();
          }}
        >
          <Ionicons
            name={hasVotedHelpful ? 'thumbs-up' : 'thumbs-up-outline'}
            size={14}
            color={hasVotedHelpful ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[styles.helpfulText, hasVotedHelpful && styles.helpfulTextActive]}
          >
            Helpful {helpfulCount > 0 ? `(${helpfulCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarFallbackText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.md,
  },
  helpfulBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  helpfulBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  helpfulText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  helpfulTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  photosScroll: {
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  reviewBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  reviewPhoto: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    height: 80,
    width: 80,
  },
  reviewTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  userMeta: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  userRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  verifiedBadge: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
});
