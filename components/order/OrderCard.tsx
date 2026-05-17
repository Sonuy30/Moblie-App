import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Badge from '@/components/ui/Badge';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { EcomOrder } from '@/api/orders';
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
      onPress={() => router.push(`/order/${order._id}` as any)}
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
            source={{ uri: item.image || 'https://via.placeholder.com/60' }}
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
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemsPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  moreItems: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  details: {
    marginTop: spacing.md,
    gap: 2,
  },
  info: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  trackText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
