import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import StarRating from './StarRating';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface ProductCardProps {
  _id: string;
  slug: string;
  name: string;
  storePrice: number;
  mrp?: number;
  discount?: number;
  images: string[];
  avgRating: number;
  reviewCount: number;
  inStock: boolean;
  stockQty: number;
  unit?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

export default function ProductCard(props: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showAuthModal = useAuthModalStore((s) => s.show);

  const handlePress = () => {
    router.push(`/product/${props.slug}` as any);
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation();
    if (!props.inStock) return;

    const cartData = {
      productId: props._id,
      slug: props.slug,
      name: props.name,
      image: props.images?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
      price: props.storePrice,
      maxQty: props.stockQty,
      unit: props.unit || 'pcs',
    };

    if (!isAuthenticated) {
      // Prompt slide-up AuthModal and store pending cart action
      showAuthModal('cart', cartData);
      return;
    }

    addItem(cartData);
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${props.name} added successfully!`,
      position: 'bottom',
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.card}>
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.images?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {props.discount && props.discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{props.discount}% OFF</Text>
          </View>
        ) : null}
      </View>

      {/* Info Container */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{props.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(props.storePrice)}</Text>
          {props.mrp && props.mrp > props.storePrice ? (
            <Text style={styles.mrp}>{formatINR(props.mrp)}</Text>
          ) : null}
        </View>

        <StarRating rating={props.avgRating || 0} count={props.reviewCount || 0} small />

        {props.unit ? (
          <Text style={styles.unitText}>Unit: 1 {props.unit}</Text>
        ) : null}

        {!props.inStock ? (
          <Text style={styles.outOfStock}>Out of stock</Text>
        ) : (
          <TouchableOpacity style={styles.addToCart} onPress={handleAddToCart} activeOpacity={0.8}>
            <Ionicons name="cart-outline" size={14} color={colors.primary} />
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.95,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.discount,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    padding: spacing.md,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
    height: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  mrp: {
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  unitText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  outOfStock: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 8,
  },
  addToCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    gap: 4,
    marginTop: 6,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
