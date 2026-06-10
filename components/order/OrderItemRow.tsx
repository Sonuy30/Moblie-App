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
        source={{ uri: image || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80' }}
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
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  image: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    height: 56,
    width: 56,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  qty: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  total: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
