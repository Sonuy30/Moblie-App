import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { CartItem as CartItemType } from '@/stores/cartStore';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80' }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.productId)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.unitPrice}>{formatINR(item.price)}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.qtySelector}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQty(item.productId, item.quantity - 1)}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qty}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, item.quantity >= item.maxQty && styles.qtyBtnDisabled]}
              onPress={() => updateQty(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.maxQty}
            >
              <Ionicons name="add" size={16} color={item.quantity >= item.maxQty ? colors.textMuted : colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.totalPrice}>{formatINR(item.price * item.quantity)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  unitPrice: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qty: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
