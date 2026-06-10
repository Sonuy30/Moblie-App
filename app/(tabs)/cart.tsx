import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import CartItemComponent from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyState from '@/components/ui/EmptyState';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CartScreen() {
  const { items, subtotal, bulkDiscount, gst, deliveryCharge, grandTotal, totalItems, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showAuthModal = useAuthModalStore((s) => s.show);
  const isEmpty = items.length === 0;

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [items.length]);

  const { isOnline } = useNetworkStatus();

  const handleCheckout = () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Checkout is not available while you are offline. Please check your internet connection.'
      );
      return;
    }
    if (!isAuthenticated) {
      showAuthModal('checkout');
      return;
    }
    router.push('/checkout');
  };

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Cart</Text>
        </View>
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          subtitle="Explore our catalog of top-quality structural steel products"
          actionLabel="Browse Products"
          onAction={() => router.push('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header Row */}
      <View style={styles.header}>
        <View>
          <Text style={styles.screenTitle}>My Cart</Text>
          <Text style={styles.countText}>{totalItems()} items selected</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearCart} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Item Cards */}
        {items.map((item) => (
          <CartItemComponent
            key={item.variantId ? `${item.productId}::${item.variantId}` : item.productId}
            item={item}
          />
        ))}

        {/* GST / Charges Summary Card */}
        <CartSummary
          subtotal={subtotal()}
          bulkDiscount={bulkDiscount()}
          gst={gst()}
          deliveryCharge={deliveryCharge()}
          grandTotal={grandTotal()}
        />
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Checkout Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.9}>
          <View style={styles.checkoutBtnLeft}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Text style={styles.subtext}>Secure Razorpay payment</Text>
          </View>
          <View style={styles.checkoutBtnRight}>
            <Text style={styles.checkoutPrice}>{formatINR(grandTotal())}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkoutBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    elevation: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  checkoutBtnLeft: {
    alignItems: 'flex-start',
  },
  checkoutBtnRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  checkoutPrice: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  checkoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  clearBtn: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    position: 'absolute',
    right: 0,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  subtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
