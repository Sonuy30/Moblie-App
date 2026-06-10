import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Badge from '@/components/ui/Badge';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { type EcomOrder } from '@/api/orders';
import { Ionicons } from '@expo/vector-icons';

const statusVariant: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
  confirmed: 'primary',
  packed: 'warning',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

interface OrderCardProps {
  order: EcomOrder;
}

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/order/${order._id}`)}
    >
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Badge
          text={order.status.toUpperCase()}
          variant={statusVariant[order.status] || 'neutral'}
        />
      </View>

      <View style={styles.itemsPreview}>
        {order.items.slice(0, 3).map((item, i) => (
          <Image
            key={i}
            source={{ uri: item.image || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80' }}
            style={styles.itemImage}
            contentFit="cover"
          />
        ))}
        {order.items.length > 3 && (
          <View style={styles.moreItems}>
            <Text style={styles.moreText}>+{order.items.length - 3}</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.info}>
          {order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatINR(order.totalAmount)}
        </Text>
        <Text style={styles.date}>Ordered: {formatDate(order.placedAt)}</Text>
        {order.estimatedDelivery && (
          <Text style={styles.date}>Expected: {formatDate(order.estimatedDelivery)}</Text>
        )}
      </View>

      <View style={styles.trackRow}>
        <Ionicons name="navigate-outline" size={16} color={colors.primary} />
        <Text style={styles.trackText}>Track order</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 3,
    marginBottom: spacing.md,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  details: {
    gap: 2,
    marginTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  itemImage: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    height: 48,
    width: 48,
  },
  itemsPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  moreItems: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  moreText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  orderNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  trackRow: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  trackText: {
    color: colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});
