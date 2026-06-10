import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '@/hooks/useCart';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { getDeliveryEstimate } from '@/api/delivery';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { formatINR } from '@/utils/currency';
import type { DeliveryOption } from '@/types/checkout';

export default function CheckoutDeliveryScreen() {
  const { items } = useCart();
  const selectedAddress = useCheckoutStore((s) => s.selectedAddress);
  const deliveryOption = useCheckoutStore((s) => s.deliveryOption);
  const setDeliveryOption = useCheckoutStore((s) => s.setDeliveryOption);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [options, setOptions] = useState<DeliveryOption[]>([]);

  const getFormattedDate = (daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  useEffect(() => {
    if (!selectedAddress) {
      router.replace('/checkout/address');
      return;
    }

    const fetchEstimate = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        
        const productId = items[0]?.productId || 'mock-product-id';
        const res = await getDeliveryEstimate(productId, selectedAddress.pincode);

        if (!res.isDeliverable) {
          setErrorMsg(res.message || 'We do not deliver to this pincode.');
          setLoading(false);
          return;
        }

        const standardDays = res.estimatedDays;
        const expressDays = Math.max(1, standardDays - 2);

        const standardOpt: DeliveryOption = {
          id: 'standard',
          name: 'Standard Delivery',
          price: 0,
          estimatedDays: standardDays,
          estimatedDeliveryDate: res.deliveryDate || getFormattedDate(standardDays),
          isDeliverable: true,
          message: 'Safe and secure delivery via AITS surface logistics',
        };

        const expressOpt: DeliveryOption = {
          id: 'express',
          name: 'Express Delivery',
          price: 99,
          estimatedDays: expressDays,
          estimatedDeliveryDate: getFormattedDate(expressDays),
          isDeliverable: true,
          message: 'Priority shipping via express air partners',
        };

        // Same-day only available for near-metro locations (e.g. estimated standard days is 2)
        const isSameDayAvailable = standardDays <= 2;
        const sameDayOpt: DeliveryOption = {
          id: 'same_day',
          name: 'Same-day Delivery',
          price: 249,
          estimatedDays: 0,
          estimatedDeliveryDate: getFormattedDate(0),
          isDeliverable: isSameDayAvailable,
          message: isSameDayAvailable
            ? 'Hyperlocal immediate courier delivery within 12 hours'
            : 'Same-day delivery is not available for this location',
        };

        const calculatedOptions = [standardOpt, expressOpt, sameDayOpt];
        setOptions(calculatedOptions);

        // Pre-select Standard if none selected or if selected is same-day but not deliverable
        const currentSelected = deliveryOption
          ? calculatedOptions.find((o) => o.id === deliveryOption.id)
          : null;

        if (currentSelected && currentSelected.isDeliverable) {
          setDeliveryOption(currentSelected);
        } else {
          setDeliveryOption(standardOpt);
        }

        setLoading(false);
      } catch (err) {
        console.warn('Failed to calculate delivery speeds:', err);
        setErrorMsg('Unable to retrieve shipping configurations.');
        setLoading(false);
      }
    };

    void fetchEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress]);

  const handleContinue = () => {
    if (!deliveryOption) return;
    router.push('/checkout/payment');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <CheckoutProgress currentStep={2} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Choose Delivery Method</Text>

          {selectedAddress && (
            <View style={styles.addressSummaryCard}>
              <Text style={styles.addressSummaryTitle}>Delivering to Pincode</Text>
              <Text style={styles.addressSummaryPincode}>
                {selectedAddress.city} - {selectedAddress.pincode}
              </Text>
              <Text style={styles.addressSummaryDetail}>
                {selectedAddress.fullName}, {selectedAddress.addressLine1}
              </Text>
            </View>
          )}

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Calculating delivery options...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
              <Button
                title="Change Address"
                onPress={() => router.replace('/checkout/address')}
                variant="outline"
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={styles.optionsList}>
              {options.map((opt) => {
                const isSelected = deliveryOption?.id === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardActive,
                      !opt.isDeliverable && styles.optionCardDisabled,
                    ]}
                    activeOpacity={0.8}
                    disabled={!opt.isDeliverable}
                    onPress={() => setDeliveryOption(opt)}
                  >
                    <View
                      style={[
                        styles.radio,
                        isSelected && styles.radioActive,
                        !opt.isDeliverable && styles.radioDisabled,
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>

                    <View style={styles.optionInfo}>
                      <View style={styles.optionHeader}>
                        <Text style={styles.optionName}>{opt.name}</Text>
                        <Text style={styles.optionPrice}>
                          {opt.price === 0 ? 'FREE' : formatINR(opt.price)}
                        </Text>
                      </View>
                      <Text style={styles.deliveryDateText}>
                        Est. Delivery: {opt.estimatedDeliveryDate}
                      </Text>
                      <Text
                        style={[
                          styles.optionMsg,
                          !opt.isDeliverable && { color: colors.error },
                        ]}
                      >
                        {opt.message}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              <Button
                title="Continue to Payment"
                onPress={handleContinue}
                disabled={!deliveryOption}
                fullWidth
                style={{ marginTop: spacing.xl }}
              />
            </View>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addressSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    gap: 2,
    padding: spacing.md,
  },
  addressSummaryDetail: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  addressSummaryPincode: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  addressSummaryTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  body: {
    flex: 1,
  },
  bottomSpacer: {
    height: 60,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  deliveryDateText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  optionCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionCardDisabled: {
    backgroundColor: '#fdfdfd',
    borderColor: '#eee',
    opacity: 0.6,
  },
  optionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  optionInfo: {
    flex: 1,
    gap: 2,
  },
  optionMsg: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  optionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  optionPrice: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionsList: {
    gap: spacing.md,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDisabled: {
    borderColor: '#ddd',
  },
  radioDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
