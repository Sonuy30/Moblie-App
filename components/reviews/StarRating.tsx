import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';

interface StarRatingProps {
  rating: number; // Current rating score (0 to 5)
  onChange?: (rating: number) => void; // Callback if interactive
  size?: number; // Size of the icons
  readonly?: boolean; // If true, disables tap interactions
}

export default function StarRating({
  rating,
  onChange,
  size = 20,
  readonly = false,
}: StarRatingProps) {
  const handleStarPress = (val: number) => {
    if (readonly || !onChange) return;
    onChange(val);
  };

  const renderStar = (index: number) => {
    // Determine icon details based on fractional rating values
    const starValue = index + 1;
    let name: keyof typeof Ionicons.glyphMap = 'star-outline';
    let color = colors.textSecondary;

    if (rating >= starValue) {
      name = 'star';
      color = '#FFD700'; // Brand Gold color for filled stars
    } else if (rating >= starValue - 0.5) {
      name = 'star-half';
      color = '#FFD700';
    }

    if (readonly) {
      return (
        <View key={index} style={styles.starContainer}>
          <Ionicons name={name} size={size} color={color} />
        </View>
      );
    }

    return (
      <View key={index} style={[styles.starContainer, { width: size, height: size }]}>
        <Ionicons name={name} size={size} color={color} style={styles.underlyingStar} />
        {/* Left half-star touch zone */}
        <TouchableOpacity
          style={[styles.halfTouchZone, { width: size / 2, height: size }]}
          activeOpacity={0.7}
          onPress={() => handleStarPress(starValue - 0.5)}
        />
        {/* Right half-star touch zone */}
        <TouchableOpacity
          style={[
            styles.halfTouchZone,
            { left: size / 2, width: size / 2, height: size },
          ]}
          activeOpacity={0.7}
          onPress={() => handleStarPress(starValue)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((i) => renderStar(i))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  halfTouchZone: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  starContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  underlyingStar: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
});
