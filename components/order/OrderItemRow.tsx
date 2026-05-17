import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface OrderItemRowProps {
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export default function OrderItemRow({ name, image, quantity, price }: OrderItemRowProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: image || 'https://via.placeholder.com/60' }}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.qty}>Qty: {quantity} × {formatINR(price)}</Text>
      </View>
      <Text style={styles.total}>{formatINR(price * quantity)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  qty: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  total: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
