import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

interface SaleBadgeProps {
  discount: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  isFlash?: boolean;
}

export default function SaleBadge({ discount, style, textStyle, isFlash = true }: SaleBadgeProps) {
  if (!discount || discount <= 0) return null;

  return (
    <View style={[
      styles.badge, 
      isFlash ? styles.flashBadge : styles.standardBadge, 
      style
    ]}>
      <Ionicons 
        name={isFlash ? "flame" : "pricetag"} 
        size={11} 
        color={colors.white} 
        style={styles.icon} 
      />
      <Text style={[styles.text, textStyle]}>
        {discount}% OFF
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  flashBadge: {
    backgroundColor: '#E64A19', // Hot Orange/Red for Flash Sales
  },
  icon: {
    marginRight: 1,
  },
  standardBadge: {
    backgroundColor: colors.discount, // Green for normal discounts
  },
  text: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
