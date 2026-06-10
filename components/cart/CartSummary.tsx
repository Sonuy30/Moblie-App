import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface CartSummaryProps {
  subtotal: number;
  bulkDiscount?: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
}

export default function CartSummary({ subtotal, bulkDiscount = 0, gst, deliveryCharge, grandTotal }: CartSummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Order Summary</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatINR(subtotal)}</Text>
      </View>

      {bulkDiscount > 0 && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.success, fontWeight: '600' }]}>Wholesale Discount</Text>
          <Text style={[styles.value, { color: colors.success, fontWeight: '700' }]}>
            -{formatINR(bulkDiscount)}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        <Text style={styles.label}>GST (18%)</Text>
        <Text style={styles.value}>{formatINR(gst)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Delivery</Text>
        <Text style={[styles.value, deliveryCharge === 0 && styles.free]}>
          {deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}
        </Text>
      </View>

      {deliveryCharge > 0 && (
        <Text style={styles.freeHint}>
          Add {formatINR(999 - (subtotal - bulkDiscount))} more for free delivery
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatINR(grandTotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 2,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 8,
  },
  free: {
    color: colors.success,
    fontWeight: '600',
  },
  freeHint: {
    color: colors.success,
    fontSize: 11,
    marginBottom: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
