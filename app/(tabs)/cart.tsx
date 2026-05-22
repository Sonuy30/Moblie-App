import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
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
import { spacing, borderRadius } from '@/constants/config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CartScreen() {
  const { items, subtotal, bulkDiscount, gst, deliveryCharge, grandTotal, totalItems, clearCart } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showAuthModal = useAuthModalStore((s) => s.show);
  const isEmpty = items.length === 0;

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [items.length]);

  const handleCheckout = () => {
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
        <TouchableOpacity style={styles.clearBtn} onPress={clearCart} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Cart Item Cards */}
        {items.map((item) => (
          <CartItemComponent key={item.productId} item={item} />
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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  countText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.errorLight,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkoutBtnLeft: {
    alignItems: 'flex-start',
  },
  checkoutText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  subtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  checkoutBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkoutPrice: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
