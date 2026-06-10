import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
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
  const { items, subtotal, gst, deliveryCharge, grandTotal, totalItems, isEmpty, promoCode, setPromoCode } = useCart();

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [items.length, isEmpty]);

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.screenTitle}>My Cart</Text>
        <EmptyState icon="cart-outline" title="Your cart is empty" subtitle="Start browsing our products" actionLabel="Start Shopping" onAction={() => router.push('/(customer)/explore')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.screenTitle}>My Cart <Text style={styles.count}>({totalItems} items)</Text></Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map((item) => <CartItemComponent key={item.productId} item={item} />)}

        {/* Promo Code */}
        <View style={styles.promoCard}>
          <Text style={styles.promoLabel}>Have a promo code?</Text>
          <View style={styles.promoRow}>
            <TextInput style={styles.promoInput} placeholder="Enter code" placeholderTextColor={colors.textMuted}
              value={promoCode || undefined} onChangeText={setPromoCode} autoCapitalize="characters" />
            <TouchableOpacity style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <CartSummary subtotal={subtotal} gst={gst} deliveryCharge={deliveryCharge} grandTotal={grandTotal} />
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutPrice}>{formatINR(grandTotal)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  checkoutBtn: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.lg, flexDirection: 'row', gap: 8, justifyContent: 'center', paddingVertical: 16 },
  checkoutPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
  checkoutText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  count: { color: colors.textSecondary, fontSize: 16, fontWeight: '400' },
  footer: { backgroundColor: colors.white, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, padding: spacing.lg, paddingBottom: spacing['3xl'], position: 'absolute', right: 0 },
  promoBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.sm, justifyContent: 'center', paddingHorizontal: 20 },
  promoBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  promoCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, elevation: 2, marginBottom: spacing.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  promoInput: { backgroundColor: colors.surface, borderRadius: borderRadius.sm, color: colors.text, flex: 1, fontSize: 14, height: 44, paddingHorizontal: 12 },
  promoLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  promoRow: { flexDirection: 'row', gap: 8 },
  safe: { backgroundColor: colors.background, flex: 1 },
  screenTitle: { color: colors.text, fontSize: 22, fontWeight: '700', paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
});
