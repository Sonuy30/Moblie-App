import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

interface SubscribableProduct {
  _id: string;
  minSubscriptionQty?: number;
  maxSubscriptionQty?: number;
  subscriptionIncrement?: number;
  unit?: string;
  storePrice?: number;
  gstRate?: number;
}

interface Props {
  product: SubscribableProduct;
}

/**
 * SubscribeQtyStepper — quantity stepper that snaps to subscriptionIncrement,
 * constrained between minSubscriptionQty and maxSubscriptionQty.
 * Tapping "Subscribe" navigates to the full subscribe flow.
 */
export default function SubscribeQtyStepper({ product }: Props) {
  const min = product.minSubscriptionQty ?? 0.5;
  const max = product.maxSubscriptionQty ?? 5;
  const step = product.subscriptionIncrement ?? 0.5;
  const unit = product.unit || 'unit';
  const unitPrice = product.storePrice || 0;
  const gstMult = 1 + (product.gstRate || 0) / 100;

  const [qty, setQty] = useState(min);

  const decrement = () => setQty((prev) => Math.max(min, Math.round((prev - step) * 100) / 100));
  const increment = () => setQty((prev) => Math.min(max, Math.round((prev + step) * 100) / 100));

  const estPerDelivery = unitPrice * qty * gstMult;

  const handleSubscribe = () => {
    router.push({
      pathname: '/subscribe/[itemId]',
      params: { itemId: product._id, defaultQty: String(qty) },
    });
  };

  return (
    <View>
      {/* Quantity stepper */}
      <View style={styles.stepperRow}>
        <Text style={styles.label}>Quantity per delivery</Text>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={[styles.stepBtn, qty <= min && styles.stepBtnDisabled]}
            onPress={decrement}
            disabled={qty <= min}
            accessibilityLabel="Decrease quantity"
          >
            <Ionicons name="remove" size={18} color={qty <= min ? '#ccc' : colors.primary} />
          </TouchableOpacity>

          <View style={styles.qtyDisplay}>
            <Text style={styles.qtyText}>{qty}</Text>
            <Text style={styles.qtyUnit}>{unit}</Text>
          </View>

          <TouchableOpacity
            style={[styles.stepBtn, qty >= max && styles.stepBtnDisabled]}
            onPress={increment}
            disabled={qty >= max}
            accessibilityLabel="Increase quantity"
          >
            <Ionicons name="add" size={18} color={qty >= max ? '#ccc' : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Price per delivery estimate */}
      {unitPrice > 0 && (
        <View style={styles.priceEstimateRow}>
          <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
          <Text style={styles.priceEstimateText}>
            ≈ ₹{estPerDelivery.toFixed(2)}/delivery (incl. GST)
          </Text>
        </View>
      )}

      {/* Plan info chips */}
      <View style={styles.planChips}>
        {[
          { label: 'Day trial', deliveries: 1 },
          { label: 'Weekly', deliveries: 7 },
          { label: 'Monthly', deliveries: 30 },
        ].map((p) => {
          const estTotal = estPerDelivery * p.deliveries;
          return (
            <View key={p.label} style={styles.planChip}>
              <Text style={styles.planChipLabel}>{p.label}</Text>
              <Text style={styles.planChipSub}>{p.deliveries} {p.deliveries === 1 ? 'delivery' : 'deliveries'}</Text>
              {unitPrice > 0 && (
                <Text style={styles.planChipPrice}>~₹{estTotal.toFixed(0)}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.subscribeBtn}
        onPress={handleSubscribe}
        accessibilityLabel="Subscribe to this product"
        accessibilityRole="button"
      >
        <Ionicons name="repeat-outline" size={18} color="#fff" />
        <Text style={styles.subscribeBtnText}>Subscribe — {qty} {unit}/day</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  planChip: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    flex: 1,
    paddingVertical: 8,
  },
  planChipLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  planChipPrice: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  planChipSub: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  planChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  priceEstimateRow: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    padding: 10,
  },
  priceEstimateText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  qtyDisplay: {
    alignItems: 'center',
    minWidth: 64,
  },
  qtyText: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '800',
  },
  qtyUnit: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  stepBtn: {
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepBtnDisabled: {
    backgroundColor: '#f8fafc',
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  stepperRow: {
    marginBottom: 14,
  },
  subscribeBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
