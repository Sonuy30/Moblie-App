import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/authStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { formatINR } from '@/utils/currency';
import type { PaymentOptionType } from '@/types/checkout';

interface PaymentMethodItem {
  id: PaymentOptionType;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export default function CheckoutPaymentScreen() {
  const { grandTotal: cartGrandTotal } = useCart();
  const user = useAuthStore((s) => s.user);
  const selectedAddress = useCheckoutStore((s) => s.selectedAddress);
  const deliveryOption = useCheckoutStore((s) => s.deliveryOption);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const setPaymentMethod = useCheckoutStore((s) => s.setPaymentMethod);

  // Compute final amount to be paid including selected delivery surcharge
  const deliverySurcharge = deliveryOption?.price || 0;
  const finalGrandTotal = cartGrandTotal + deliverySurcharge;

  useEffect(() => {
    if (!selectedAddress) {
      router.replace('/checkout/address');
      return;
    }
    if (!deliveryOption) {
      router.replace('/checkout/delivery');
      return;
    }

    // Set default payment method to 'upi' if none selected
    if (!paymentMethod) {
      setPaymentMethod('upi');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddress, deliveryOption]);

  const handleContinue = () => {
    if (!paymentMethod) {
      Alert.alert('Validation', 'Please select a payment method');
      return;
    }
    router.push('/checkout/summary');
  };

  const isTierUser = user?.tier === 'premium' || user?.tier === 'regular';
  const creditVal = user?.creditAvailable !== undefined ? user.creditAvailable : (user?.creditLimit || 0);
  const isCreditDisabled = creditVal < finalGrandTotal;

  const standardMethods: PaymentMethodItem[] = [
    {
      id: 'upi',
      name: 'UPI Pay (GPay / PhonePe / Paytm)',
      icon: 'phone-portrait-outline',
      description: 'Instant payment using any UPI app',
    },
    {
      id: 'card',
      name: 'Credit / Debit Card',
      icon: 'card-outline',
      description: 'Visa, MasterCard, RuPay, Maestro cards',
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: 'business-outline',
      description: 'All major Indian corporate and retail banks',
    },
    {
      id: 'wallet',
      name: 'Online Wallets',
      icon: 'wallet-outline',
      description: 'Paytm Wallet, PhonePe Wallet, AmazonPay',
    },
    {
      id: 'cod',
      name: 'Cash on Delivery (COD)',
      icon: 'cash-outline',
      description: 'Pay with cash or digital UPI scan on delivery',
    },
  ];

  const erpMethods: PaymentMethodItem[] = [
    {
      id: 'credit',
      name: 'Pay with Credit Limit',
      icon: 'gift-outline',
      description: `Use approved credit account. Available: ${formatINR(creditVal)}`,
    },
    {
      id: 'offline_invoice',
      name: 'Offline Invoice Terms (ERP)',
      icon: 'document-text-outline',
      description: 'Bill to company account as per standard payment terms',
    },
  ];

  const renderPaymentCard = (method: PaymentMethodItem, isDisabled = false) => {
    const isSelected = paymentMethod === method.id;
    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.methodCard,
          isSelected && styles.methodCardActive,
          isDisabled && styles.methodCardDisabled,
        ]}
        activeOpacity={0.8}
        disabled={isDisabled}
        onPress={() => setPaymentMethod(method.id)}
      >
        <View
          style={[
            styles.radio,
            isSelected && styles.radioActive,
            isDisabled && styles.radioDisabled,
          ]}
        >
          {isSelected && <View style={styles.radioDot} />}
        </View>

        <View style={styles.methodIconContainer}>
          <Ionicons
            name={method.icon}
            size={22}
            color={isDisabled ? colors.textMuted : isSelected ? colors.primary : colors.text}
          />
        </View>

        <View style={styles.methodInfo}>
          <Text
            style={[
              styles.methodName,
              isDisabled && styles.methodNameDisabled,
            ]}
          >
            {method.name}
          </Text>
          <Text
            style={[
              styles.methodDesc,
              isDisabled && styles.methodDescDisabled,
            ]}
          >
            {method.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
      <CheckoutProgress currentStep={3} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.amountSummary}>
            <Text style={styles.amountTitle}>Total to Pay</Text>
            <Text style={styles.amountValue}>{formatINR(finalGrandTotal)}</Text>
          </View>

          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          <View style={styles.methodsList}>
            {standardMethods.map((m) => renderPaymentCard(m))}
          </View>

          {isTierUser && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={[styles.sectionTitle, { marginBottom: spacing.md }]}>
                Corporate ERP Payment Options
              </Text>
              <View style={styles.methodsList}>
                {erpMethods.map((m) =>
                  renderPaymentCard(m, m.id === 'credit' && isCreditDisabled)
                )}
              </View>
            </View>
          )}

          <Button
            title="Continue to Order Summary"
            onPress={handleContinue}
            disabled={!paymentMethod}
            fullWidth
            style={{ marginTop: spacing.xl }}
          />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  amountSummary: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
  },
  amountTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  amountValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
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
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
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
  methodCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  methodCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  methodCardDisabled: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e9e9e9',
    opacity: 0.5,
  },
  methodDesc: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  methodDescDisabled: {
    color: '#d9534f',
    fontWeight: '600',
  },
  methodIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  methodInfo: {
    flex: 1,
    gap: 2,
  },
  methodName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  methodNameDisabled: {
    color: colors.textMuted,
  },
  methodsList: {
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
