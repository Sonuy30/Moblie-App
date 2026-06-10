import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const FlashList = OriginalFlashList as any;
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Image } from 'expo-image';

import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { formatINR } from '@/utils/currency';
import EmptyState from '@/components/ui/EmptyState';
import type { WishlistItem } from '@/types/wishlist';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - spacing.lg * 3) / 2;

export default function WishlistScreen() {
  const items = useWishlistStore((s) => s.items);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const addItem = useCartStore((s) => s.addItem);

  const handleMoveToCart = async (item: WishlistItem) => {
    const payload = {
      productId: item.product._id,
      slug: item.product.slug,
      name: item.product.name,
      image: item.product.images?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80',
      price: item.product.storePrice,
      maxQty: item.product.stockQty,
      unit: item.product.unit || 'pcs',
    };

    addItem(payload);
    await removeFromWishlist(item.productId);

    Toast.show({
      type: 'success',
      text1: 'Moved to Cart',
      text2: item.product.name,
      position: 'bottom',
    });
  };

  const renderRightActions = (productId: string) => {
    return (
      <View style={styles.deleteActionContainer}>
        <TouchableOpacity
          style={styles.deleteActionButton}
          activeOpacity={0.8}
          onPress={() => {
            removeFromWishlist(productId).catch(() => {});
          }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.white} />
          <Text style={styles.deleteActionText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist</Text>
        </View>
        <EmptyState
          icon="heart-outline"
          title="Your wishlist is empty"
          subtitle="Explore products and save your favorite items here"
          actionLabel="Start Shopping"
          onAction={() => router.push('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => {
    const currentPrice = item.product.storePrice;
    const priceDrop = item.savedPrice - currentPrice;
    const hasPriceDropped = priceDrop > 0;

    return (
      <View style={styles.swipeContainer}>
        <Swipeable
          renderRightActions={() => renderRightActions(item.productId)}
          onSwipeableOpen={(direction) => {
            if (direction === 'right') {
              removeFromWishlist(item.productId).catch(() => {});
              Toast.show({
                type: 'info',
                text1: 'Removed from Wishlist',
                text2: item.product.name,
                position: 'bottom',
              });
            }
          }}
        >
          <View style={styles.card}>
            {/* Image Area */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: '/product/[id]',
                  params: { id: item.product._id },
                })
              }
            >
              <Image
                source={{
                  uri:
                    item.product.images?.[0] ||
                    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&auto=format&fit=crop&q=80',
                }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>

            {/* Price Drop Indicator */}
            {hasPriceDropped && (
              <View style={styles.priceDropBadge}>
                <Ionicons name="trending-down" size={10} color={colors.success} />
                <Text style={styles.priceDropText}>
                  Price dropped {formatINR(priceDrop)}
                </Text>
              </View>
            )}

            {/* Info Area */}
            <View style={styles.info}>
              {item.product.brand && (
                <Text style={styles.brand} numberOfLines={1}>
                  {item.product.brand}
                </Text>
              )}
              <Text style={styles.name} numberOfLines={2}>
                {item.product.name}
              </Text>

              {/* Pricing */}
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatINR(currentPrice)}</Text>
                {item.product.mrp && item.product.mrp > currentPrice && (
                  <Text style={styles.mrp}>{formatINR(item.product.mrp)}</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.cartButton}
                activeOpacity={0.7}
                onPress={() => {
                  void handleMoveToCart(item);
                }}
              >
                <Ionicons name="cart-outline" size={16} color={colors.primary} />
                <Text style={styles.cartButtonText}>Move to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Swipeable>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist ({items.length})</Text>
        </View>

        <FlashList
          data={items}
          keyExtractor={(item: WishlistItem) => item.productId}
          numColumns={2}
          estimatedItemSize={280}
          contentContainerStyle={styles.list}
          renderItem={renderWishlistItem}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  brand: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    width: '100%',
  },
  cartButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 6,
    height: 36,
    justifyContent: 'center',
    marginTop: spacing.sm,
    width: '100%',
  },
  cartButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteActionButton: {
    alignItems: 'center',
    gap: 6,
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  deleteActionContainer: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    height: '100%',
    justifyContent: 'center',
    width: COLUMN_WIDTH,
  },
  deleteActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  image: {
    backgroundColor: colors.surface,
    height: COLUMN_WIDTH * 0.9,
    width: '100%',
  },
  info: {
    gap: 4,
    padding: spacing.md,
  },
  list: {
    paddingBottom: 40,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  mrp: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    height: 36,
    lineHeight: 18,
  },
  price: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  priceDropBadge: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 4,
    left: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: spacing.sm,
    zIndex: 2,
  },
  priceDropText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  root: {
    flex: 1,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  swipeContainer: {
    marginBottom: spacing.lg,
    marginHorizontal: spacing.xs,
    width: COLUMN_WIDTH,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
});
