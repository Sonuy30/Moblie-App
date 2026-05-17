import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
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
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProductCard(props: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(props._id));

  const handlePress = () => {
    router.push(`/product/${props.slug}` as any);
  };

  const handleAddToCart = () => {
    if (!props.inStock) return;
    addItem({
      productId: props._id,
      slug: props.slug,
      name: props.name,
      image: props.images?.[0] || '',
      price: props.storePrice,
      maxQty: props.stockQty,
    });
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.card}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.images?.[0] || 'https://via.placeholder.com/300' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {props.discount && props.discount > 0 ? (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{props.discount}% OFF</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => toggle(props._id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isWishlisted ? 'heart' : 'heart-outline'}
            size={20}
            color={isWishlisted ? colors.error : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{props.name}</Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(props.storePrice)}</Text>
          {props.mrp && props.mrp > props.storePrice ? (
            <Text style={styles.mrp}>{formatINR(props.mrp)}</Text>
          ) : null}
        </View>

        <StarRating rating={props.avgRating || 0} count={props.reviewCount || 0} small />

        {!props.inStock ? (
          <Text style={styles.outOfStock}>Out of stock</Text>
        ) : (
          <TouchableOpacity style={styles.addToCart} onPress={handleAddToCart}>
            <Ionicons name="cart-outline" size={14} color={colors.primary} />
            <Text style={styles.addToCartText}>Add to cart</Text>
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
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    backgroundColor: colors.surface,
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
    fontSize: 10,
    fontWeight: '700',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: spacing.md,
    gap: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  mrp: {
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  outOfStock: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
  },
  addToCart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    gap: 4,
    marginTop: 4,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
