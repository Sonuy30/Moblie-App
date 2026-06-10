import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import StarRating from './StarRating';
import SaleBadge from '@/components/sales/SaleBadge';
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
  unit?: string;
}

export default function ProductCardWide(props: ProductCardWideProps) {
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(props._id));

  return (
    <TouchableOpacity
      onPress={() => router.push(`/product/${props.slug}`)}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: props.images?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {props.discount && props.discount > 0 ? (
          <SaleBadge discount={props.discount} style={styles.discountBadgePosition} isFlash={false} />
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
                unit: props.unit || 'pcs',
              });
            }}
          >
            <Text style={styles.addToCartText}>
              {props.inStock ? 'Add to cart' : 'Out of stock'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { void toggle(props._id); }} style={styles.heartBtn}>
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
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addToCart: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    flex: 1,
    paddingVertical: 8,
  },
  addToCartText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 3,
    flexDirection: 'row',
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  disabledBtn: {
    backgroundColor: colors.errorLight,
  },
  discountBadgePosition: {
    left: 8,
    position: 'absolute',
    top: 8,
  },
  heartBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    backgroundColor: colors.surface,
    height: 140,
    width: 120,
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  mrp: {
    color: colors.textMuted,
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  price: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
});
