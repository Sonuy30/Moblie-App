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
        <EmptyState icon="cart-outline" title="Your cart is empty" subtitle="Start browsing our products" actionLabel="Start Shopping" onAction={() => router.push('/(tabs)/explore')} />
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
              value={promoCode} onChangeText={setPromoCode} autoCapitalize="characters" />
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
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout' as any)}>
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          <Text style={styles.checkoutPrice}>{formatINR(grandTotal)}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screenTitle: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  count: { fontSize: 16, fontWeight: '400', color: colors.textSecondary },
  scroll: { flex: 1, paddingHorizontal: spacing.lg },
  promoCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  promoLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  promoRow: { flexDirection: 'row', gap: 8 },
  promoInput: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.sm, paddingHorizontal: 12, height: 44, fontSize: 14, color: colors.text },
  promoBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, borderRadius: borderRadius.sm, justifyContent: 'center' },
  promoBtnText: { color: colors.white, fontSize: 14, fontWeight: '600' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, padding: spacing.lg, paddingBottom: spacing['3xl'], borderTopWidth: 1, borderTopColor: colors.border },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  checkoutText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  checkoutPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500' },
});
