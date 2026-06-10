import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { type CartItem as CartItemType } from '@/stores/cartStore';

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
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            {item.variantLabel && (
              <View style={styles.variantBadge}>
                <Text style={styles.variantBadgeText}>{item.variantLabel}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => removeItem(item.productId, item.variantId)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <Text style={styles.unitPrice}>{formatINR(item.price)} / {item.unit}</Text>
        <View style={styles.bottomRow}>
          <View style={styles.qtySelector}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQty(item.productId, item.quantity - 1, item.variantId)}
            >
              <Ionicons name="remove" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.qty}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, item.quantity >= item.maxQty && styles.qtyBtnDisabled]}
              onPress={() => updateQty(item.productId, item.quantity + 1, item.variantId)}
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
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  image: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    height: 80,
    width: 80,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  qty: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: 32,
  },
  qtyBtn: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtySelector: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  totalPrice: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  unitPrice: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  variantBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  variantBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
