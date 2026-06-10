import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '@/hooks/useCart';
import { useCheckoutStore } from '@/stores/checkoutStore';
import {
  initiateCheckout,
  demoPay,
  payWithCreditLimit,
  payOfflineInvoice,
} from '@/api/checkout';
import { useRazorpay } from '@/hooks/useRazorpay';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import OrderItemRow from '@/components/order/OrderItemRow';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { formatINR } from '@/utils/currency';
import { getErrorMessage } from '@/api/client';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function CheckoutSummaryScreen() {
  const { isOnline } = useNetworkStatus();
  const { items, subtotal, gst, clearCart } = useCart();
  const selectedAddress = useCheckoutStore((s) => s.selectedAddress);
  const deliveryOption = useCheckoutStore((s) => s.deliveryOption);
  const paymentMethod = useCheckoutStore((s) => s.paymentMethod);
  const couponCode = useCheckoutStore((s) => s.couponCode);
  const couponDiscount = useCheckoutStore((s) => s.couponDiscount);
  const setCouponCode = useCheckoutStore((s) => s.setCouponCode);
  const setCouponDiscount = useCheckoutStore((s) => s.setCouponDiscount);
  const setOrderDetails = useCheckoutStore((s) => s.setOrderDetails);

  const { payWithRazorpay, loading: paymentLoading } = useRazorpay();

  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (!selectedAddress) {
      router.replace('/checkout/address');
      return;
    }
    if (!deliveryOption) {
      router.replace('/checkout/delivery');
      return;
    }
    if (!paymentMethod) {
      router.replace('/checkout/payment');
    }
  }, [selectedAddress, deliveryOption, paymentMethod]);

  const deliveryCharge = deliveryOption?.price || 0;
  const grandTotal = subtotal + gst + deliveryCharge - couponDiscount;

  const handleApplyCoupon = () => {
    setCouponError('');
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME10') {
      const discount = subtotal * 0.1;
      setCouponDiscount(discount);
      setCouponCode(code);
      Toast.show({
        type: 'success',
        text1: 'Coupon Applied',
        text2: '10% discount applied successfully!',
        position: 'bottom',
      });
    } else if (code === 'AITS500') {
      if (subtotal < 2000) {
        setCouponError('Minimum purchase of ₹2,000 required for this coupon.');
        return;
      }
      setCouponDiscount(500);
      setCouponCode(code);
      Toast.show({
        type: 'success',
        text1: 'Coupon Applied',
        text2: '₹500 flat discount applied successfully!',
        position: 'bottom',
      });
    } else {
      setCouponError('Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponInput('');
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Placing orders and payments are not available while you are offline. Please check your internet connection.'
      );
      return;
    }
    if (!selectedAddress || !paymentMethod) return;

    setLoading(true);

    // Map internal UI payment methods to backend API payment methods
    let apiPaymentMethod = 'online';
    if (paymentMethod === 'cod') apiPaymentMethod = 'cod';
    else if (paymentMethod === 'credit') apiPaymentMethod = 'credit';
    else if (paymentMethod === 'offline_invoice') apiPaymentMethod = 'offline_invoice';

    try {
      // 1. Create order on backend (returns ecomOrderId, orderNumber, amount)
      const response = await initiateCheckout({
        cartItems: items.map((i) => ({
          productId: i.productId,
          name: i.name + (i.variantLabel ? ` (${i.variantLabel})` : ''),
          price: i.price,
          quantity: i.quantity,
          image: i.image || '',
        })),
        addressId: selectedAddress._id || '',
        shippingAddress: selectedAddress,
        paymentMethod: apiPaymentMethod,
        promoCode: couponCode || undefined,
      });

      // 2. Process payment based on method
      if (apiPaymentMethod === 'online') {
        const isSuccess = await payWithRazorpay(grandTotal, response.ecomOrderId);
        if (!isSuccess) {
          Alert.alert(
            'Payment Failed',
            'Your transaction could not be processed. You can retry or choose Cash on Delivery (COD).',
            [
              { text: 'Retry', onPress: () => { void handlePlaceOrder(); } },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
          setLoading(false);
          return;
        }
      } else if (apiPaymentMethod === 'credit') {
        await payWithCreditLimit(response.ecomOrderId);
      } else if (apiPaymentMethod === 'offline_invoice') {
        await payOfflineInvoice(response.ecomOrderId);
      } else {
        await demoPay(response.ecomOrderId);
      }

      // Clear the cart
      clearCart();

      // Store success order details
      setOrderDetails(response.ecomOrderId, response.orderNumber);

      // Route to success screen
      router.replace('/checkout/success');
    } catch (err) {
      Alert.alert('Checkout Failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyPaymentName = (method: string | null) => {
    if (!method) return '';
    const names: Record<string, string> = {
      upi: 'UPI Payment',
      card: 'Credit/Debit Card',
      netbanking: 'Net Banking',
      wallet: 'Online Wallet',
      cod: 'Cash on Delivery',
      credit: 'Company Credit Limit',
      offline_invoice: 'Offline Invoice Terms',
    };
    return names[method] || method;
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
      <CheckoutProgress currentStep={4} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Review Your Order</Text>

          {/* Delivery Address Summary */}
          {selectedAddress && (
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Shipping Address</Text>
                <TouchableOpacity onPress={() => router.navigate('/checkout/address')}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDetailText}>{selectedAddress.fullName}</Text>
              <Text style={styles.cardDetailSubtext}>
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}
              </Text>
              <Text style={styles.cardDetailSubtext}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
            </View>
          )}

          {/* Delivery Method Summary */}
          {deliveryOption && (
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Shipping Speed</Text>
                <TouchableOpacity onPress={() => router.navigate('/checkout/delivery')}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDetailText}>{deliveryOption.name}</Text>
              <Text style={styles.cardDetailSubtext}>
                Est. Delivery: {deliveryOption.estimatedDeliveryDate} (
                {deliveryOption.price === 0 ? 'FREE' : formatINR(deliveryCharge)})
              </Text>
            </View>
          )}

          {/* Payment Method Summary */}
          {paymentMethod && (
            <View style={styles.summaryCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Payment Option</Text>
                <TouchableOpacity onPress={() => router.navigate('/checkout/payment')}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardDetailText}>
                {getFriendlyPaymentName(paymentMethod)}
              </Text>
            </View>
          )}

          {/* Cart Items list */}
          <View style={styles.itemsCard}>
            <Text style={[styles.cardTitle, { marginBottom: spacing.md }]}>
              Items in Order
            </Text>
            {items.map((item) => (
              <OrderItemRow
                key={item.variantId ? `${item.productId}::${item.variantId}` : item.productId}
                name={item.name + (item.variantLabel ? ` · ${item.variantLabel}` : '')}
                image={item.image}
                quantity={item.quantity}
                price={item.price}
              />
            ))}
          </View>

          {/* Coupon Promo codes */}
          <View style={styles.couponCard}>
            <Text style={styles.couponTitle}>Apply Coupon Code</Text>
            {couponCode ? (
              <View style={styles.appliedRow}>
                <View style={styles.appliedBadge}>
                  <Ionicons name="pricetag" size={14} color={colors.success} />
                  <Text style={styles.appliedText}>{couponCode}</Text>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="e.g. WELCOME10, AITS500"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={couponInput}
                  onChangeText={(v) => {
                    setCouponInput(v);
                    setCouponError('');
                  }}
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
            {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
            {!couponCode && (
              <Text style={styles.couponHint}>
                {"Try \"WELCOME10\" for 10% off, or \"AITS500\" for ₹500 off (Min ₹2000)."}
              </Text>
            )}
          </View>

          {/* Pricing calculations details */}
          <View style={styles.pricingCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Items Subtotal</Text>
              <Text style={styles.priceValue}>{formatINR(subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>{formatINR(gst)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Shipping Charge</Text>
              <Text style={styles.priceValue}>
                {deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}
              </Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.success }]}>
                  Coupon Discount
                </Text>
                <Text style={[styles.priceValue, { color: colors.success }]}>
                  -{formatINR(couponDiscount)}
                </Text>
              </View>
            )}
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>{formatINR(grandTotal)}</Text>
            </View>
          </View>

          <Button
            title={`Place Order  ·  ${formatINR(grandTotal)}`}
            onPress={() => { void handlePlaceOrder(); }}
            loading={loading || paymentLoading}
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appliedBadge: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  appliedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  appliedText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  applyBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  applyBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
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
  cardDetailSubtext: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  cardDetailText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  changeBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  couponCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  couponErrorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 2,
  },
  couponHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  couponInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    color: colors.text,
    flex: 1,
    fontSize: 13,
    height: 44,
    paddingHorizontal: 12,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  couponTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
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
  itemsCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  pricingCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  removeCouponBtn: {
    paddingVertical: 6,
  },
  removeCouponText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
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
  summaryCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  totalRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
  totalValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
});
