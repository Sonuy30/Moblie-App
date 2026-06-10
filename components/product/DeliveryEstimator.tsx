import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { getDeliveryEstimate, type DeliveryEstimate } from '@/api/delivery';
import { formatINR } from '@/utils/currency';

interface DeliveryEstimatorProps {
  productId: string;
}

export default function DeliveryEstimator({ productId }: DeliveryEstimatorProps) {
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (pincode.length !== 6) {
      setError('Please enter a 6-digit pincode');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getDeliveryEstimate(productId, pincode);
      setEstimate(res);
      if (!res.isDeliverable) {
        setError(res.message || 'Product not deliverable to this pincode');
      }
    } catch {
      setError('Unable to fetch delivery estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text style={styles.title}>Delivery & Service Estimate</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit pincode"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          value={pincode}
          onChangeText={(val) => {
            setPincode(val.replace(/[^0-9]/g, ''));
            if (estimate) setEstimate(null);
            if (error) setError(null);
          }}
        />
        <TouchableOpacity
          style={[styles.btn, pincode.length !== 6 && styles.btnDisabled]}
          onPress={() => {
            handleCheck().catch(() => {});
          }}
          disabled={loading || pincode.length !== 6}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.btnText}>Check</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {estimate && estimate.isDeliverable && (
        <View style={styles.resultContainer}>
          <View style={styles.resultRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <View style={styles.resultTextCol}>
              <Text style={styles.deliveryDateText}>
                Delivery by <Text style={styles.bold}>{estimate.deliveryDate}</Text>
              </Text>
              <Text style={styles.shippingText}>
                Shipping Charge: {estimate.shippingFee === 0 ? (
                  <Text style={styles.freeText}>FREE</Text>
                ) : (
                  <Text style={styles.bold}>{formatINR(estimate.shippingFee)}</Text>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.infoBullets}>
            <View style={styles.bulletRow}>
              <Ionicons name="swap-horizontal" size={14} color={colors.textSecondary} />
              <Text style={styles.bulletText}>7 Days Easy Return policy available</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="wallet-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.bulletText}>Cash on Delivery (COD) eligible</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bold: {
    color: colors.text,
    fontWeight: '700',
  },
  btn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 44,
    justifyContent: 'center',
    width: 80,
  },
  btnDisabled: {
    backgroundColor: colors.primaryLight,
    opacity: 0.8,
  },
  btnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  bulletRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  deliveryDateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  freeText: {
    color: colors.success,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  infoBullets: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    height: 44,
    paddingHorizontal: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultContainer: {
    borderTopColor: 'rgba(0,0,0,0.04)',
    borderTopWidth: 1,
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  resultRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  resultTextCol: {
    flex: 1,
    gap: 2,
  },
  shippingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
});
