import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import type { WishlistItem } from '@/types/wishlist';
import type { CartItem } from '@/stores/cartStore';

export default function WishlistScreen() {
  const items = useWishlistStore((s) => s.items);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (item: WishlistItem) => {
    const payload: Omit<CartItem, 'quantity'> = {
      productId: item.productId,
      slug: item.product.slug,
      name: item.product.name,
      image: item.product.images?.[0] || '',
      price: item.savedPrice,
      maxQty: item.product.stockQty ?? 99,
      unit: item.product.unit || 'pcs',
    };
    addItem(payload);
  };

  const handleAddAllToCart = () => {
    items.forEach((item) => handleAddToCart(item));
    Alert.alert('Added to Cart', `${items.length} item${items.length > 1 ? 's' : ''} added to your cart.`);
  };

  const handleRemove = (productId: string, name: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove "${name}" from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => { void removeFromWishlist(productId); },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>My Wishlist</Text>
          {items.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{items.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {items.length === 0 ? (
        /* ── Empty State ── */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={56} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>
            Save items you love and come back to them anytime.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
            accessibilityLabel="Browse products"
            accessibilityRole="button"
          >
            <Ionicons name="storefront-outline" size={18} color={colors.white} />
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Filled State ── */
        <>
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120, paddingTop: spacing.md }}
          >
            {items.map((item) => (
              <View key={item.productId} style={styles.card}>
                {/* Product Image */}
                <Image
                  source={{
                    uri: item.product.images?.[0] ||
                      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80',
                  }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />

                {/* Product Info */}
                <View style={styles.info}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.price}>
                    {formatINR(item.savedPrice)}
                    <Text style={styles.unit}> / {item.product.unit || 'pcs'}</Text>
                  </Text>

                  <View style={styles.cardActions}>
                    {/* Add to Cart */}
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => handleAddToCart(item)}
                      activeOpacity={0.8}
                      accessibilityLabel={`Add ${item.product.name} to cart`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="cart-outline" size={16} color={colors.primary} />
                      <Text style={styles.addBtnText}>Add to Cart</Text>
                    </TouchableOpacity>

                    {/* Remove from Wishlist */}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemove(item.productId, item.product.name)}
                      activeOpacity={0.7}
                      accessibilityLabel={`Remove ${item.product.name} from wishlist`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="heart" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Add All to Cart Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addAllBtn}
              onPress={handleAddAllToCart}
              activeOpacity={0.9}
              accessibilityLabel="Add all wishlist items to cart"
              accessibilityRole="button"
            >
              <Ionicons name="cart" size={20} color={colors.white} />
              <Text style={styles.addAllBtnText}>
                Add All to Cart ({items.length} items)
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addAllBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    elevation: 5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  addAllBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  addBtnText: {
    color: colors.primary,
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
  browseBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    elevation: 4,
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.xl,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  browseBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 2,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 22,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 22,
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 56,
    height: 112,
    justifyContent: 'center',
    marginBottom: 24,
    width: 112,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
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
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  image: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    height: 80,
    width: 80,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  list: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  removeBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: borderRadius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
  },
});
