import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

interface StockBadgeProps {
  inStock: boolean;
  stockQty: number;
}

export default function StockBadge({ inStock, stockQty }: StockBadgeProps) {
  if (!inStock || stockQty <= 0) {
    return (
      <View style={[styles.badge, styles.outOfStock]}>
        <View style={[styles.dot, { backgroundColor: colors.error }]} />
        <Text style={[styles.text, { color: colors.error }]}>Out of Stock</Text>
      </View>
    );
  }

  if (stockQty < 5) {
    return (
      <View style={[styles.badge, styles.lowStock]}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text style={[styles.text, { color: colors.warning }]}>
          Only {stockQty} left!
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles.inStockBadge]}>
      <View style={[styles.dot, { backgroundColor: colors.success }]} />
      <Text style={[styles.text, { color: colors.success }]}>
        In Stock ({stockQty} available)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  inStockBadge: {
    backgroundColor: colors.successLight,
  },
  lowStock: {
    backgroundColor: colors.warningLight,
  },
  outOfStock: {
    backgroundColor: colors.errorLight,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
