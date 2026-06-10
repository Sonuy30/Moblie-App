import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCheckoutStore } from '@/stores/checkoutStore';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function CheckoutSuccessScreen() {
  const ecomOrderId = useCheckoutStore((s) => s.ecomOrderId);
  const orderNumber = useCheckoutStore((s) => s.orderNumber);
  const deliveryOption = useCheckoutStore((s) => s.deliveryOption);
  const resetCheckout = useCheckoutStore((s) => s.resetCheckout);

  React.useEffect(() => {
    const onBackPress = () => true;
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => {
      sub.remove();
    };
  }, []);

  const handleFinish = () => {
    resetCheckout();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Animated Checkmark Icon container */}
        <View style={styles.successIconBadge}>
          <Ionicons name="checkmark-circle" size={84} color={colors.success} />
        </View>

        <Text style={styles.successHeading}>Order Placed Successfully!</Text>
        <Text style={styles.successSubheading}>
          Thank you for shopping with AITS Shop. We are preparing your order for dispatch.
        </Text>

        <View style={styles.divider} />

        {/* Order details panel */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Reference</Text>
            <Text style={styles.detailValue}>#{orderNumber || 'AITS-MOCK-001'}</Text>
          </View>
          {ecomOrderId ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>ERP Order ID</Text>
              <Text style={styles.detailValueSub} numberOfLines={1}>
                {ecomOrderId}
              </Text>
            </View>
          ) : null}
          {deliveryOption ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Delivery</Text>
              <Text style={styles.detailValueSuccess}>
                {deliveryOption.estimatedDeliveryDate}
              </Text>
            </View>
          ) : null}
          {deliveryOption ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shipping Method</Text>
              <Text style={styles.detailValue}>{deliveryOption.name}</Text>
            </View>
          ) : null}
        </View>

        {/* Home navigation button */}
        <Button
          title="Continue Shopping"
          onPress={handleFinish}
          fullWidth
          style={{ marginTop: spacing.xl }}
        />

        <TouchableOpacity
          style={styles.viewOrderBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (ecomOrderId) {
              resetCheckout();
              router.replace(`/order/${ecomOrderId}`);
            } else {
              handleFinish();
            }
          }}
        >
          <Text style={styles.viewOrderText}>View Order Details</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  detailValueSub: {
    color: colors.textMuted,
    fontSize: 12,
    maxWidth: '60%',
  },
  detailValueSuccess: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xl,
    width: '100%',
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  successHeading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  successIconBadge: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  successSubheading: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  viewOrderBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewOrderText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
