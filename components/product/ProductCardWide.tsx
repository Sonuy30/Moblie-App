import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import StarRating from './StarRating';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

interface ProductCardWideProps {
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

export default function ProductCardWide(props: ProductCardWideProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(props._id));

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${props.slug}` as any)}
      activeOpacity={0.7}
      style={styles.card}
    >
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
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{props.name}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatINR(props.storePrice)}</Text>
          {props.mrp && props.mrp > props.storePrice ? (
            <Text style={styles.mrp}>{formatINR(props.mrp)}</Text>
          ) : null}
        </View>

        <StarRating rating={props.avgRating || 0} count={props.reviewCount || 0} small />

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.addToCart, !props.inStock && styles.disabledBtn]}
            disabled={!props.inStock}
            onPress={() => {
              addItem({
                productId: props._id,
                slug: props.slug,
                name: props.name,
                image: props.images?.[0] || '',
                price: props.storePrice,
                maxQty: props.stockQty,
              });
            }}
          >
            <Text style={styles.addToCartText}>
              {props.inStock ? 'Add to cart' : 'Out of stock'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => toggle(props._id)} style={styles.heartBtn}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? colors.error : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: 120,
    height: 140,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addToCart: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: colors.errorLight,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
