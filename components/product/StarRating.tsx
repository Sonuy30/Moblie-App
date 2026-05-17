import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  small?: boolean;
  showCount?: boolean;
}

export default function StarRating({
  rating,
  count = 0,
  size = 16,
  small = false,
  showCount = true,
}: StarRatingProps) {
  const starSize = small ? 12 : size;

  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(
        <Ionicons key={i} name="star" size={starSize} color={colors.star} />
      );
    } else if (i - 0.5 <= rating) {
      stars.push(
        <Ionicons key={i} name="star-half" size={starSize} color={colors.star} />
      );
    } else {
      stars.push(
        <Ionicons key={i} name="star-outline" size={starSize} color={colors.star} />
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.stars}>{stars}</View>
      {showCount && (
        <Text style={[styles.count, small && styles.countSmall]}>
          {rating.toFixed(1)} {count > 0 ? `(${count})` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  count: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  countSmall: {
    fontSize: 11,
  },
});
