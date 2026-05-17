import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface CartSummaryProps {
  subtotal: number;
  gst: number;
  deliveryCharge: number;
  grandTotal: number;
}

export default function CartSummary({ subtotal, gst, deliveryCharge, grandTotal }: CartSummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Order Summary</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Subtotal</Text>
        <Text style={styles.value}>{formatINR(subtotal)}</Text>
      </View>

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
          Add {formatINR(999 - subtotal)} more for free delivery
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
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  free: {
    color: colors.success,
    fontWeight: '600',
  },
  freeHint: {
    fontSize: 11,
    color: colors.success,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
});
