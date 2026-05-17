import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProductDetail } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import ImageCarousel from '@/components/product/ImageCarousel';
import StarRating from '@/components/product/StarRating';
import StockBadge from '@/components/product/StockBadge';
import ReviewCard from '@/components/product/ReviewCard';
import ProductCard from '@/components/product/ProductCard';
import Badge from '@/components/ui/Badge';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import SectionHeader from '@/components/home/SectionHeader';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { getProductReviews, Review } from '@/api/reviews';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: product, isLoading } = useProductDetail(slug || '');
  const addItem = useCartStore((s) => s.addItem);
  const toggle = useWishlistStore((s) => s.toggle);
  const isWishlisted = useWishlistStore((s) => product ? s.isWishlisted(product._id) : false);
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);

  React.useEffect(() => {
    if (product?._id) {
      getProductReviews(product._id).then(setReviews).catch(() => {});
    }
  }, [product?._id]);

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ProductDetailSkeleton />
      </SafeAreaView>
    );
  }

  const handleAddToCart = () => {
    addItem({ productId: product._id, slug: product.slug, name: product.name, image: product.images?.[0] || '', price: product.storePrice, maxQty: product.stockQty });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout' as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => toggle(product._id)}>
            <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={22} color={isWishlisted ? colors.error : colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageCarousel images={product.images || []} />

        <View style={styles.content}>
          {product.category && <Badge text={product.category} variant="neutral" />}
          <Text style={styles.name}>{product.name}</Text>

          {/* Pricing */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(product.storePrice)}</Text>
            {product.mrp > product.storePrice && <Text style={styles.mrp}>{formatINR(product.mrp)}</Text>}
            {product.discount > 0 && <Badge text={`${product.discount}% OFF`} variant="success" />}
          </View>

          <StockBadge inStock={product.inStock} stockQty={product.stockQty} />

          <TouchableOpacity onPress={() => {}} style={styles.ratingRow}>
            <StarRating rating={product.avgRating || 0} count={product.reviewCount || 0} />
          </TouchableOpacity>

          {/* Quantity */}
          {product.inStock && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity:</Text>
              <View style={styles.qtySelector}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(Math.min(product.stockQty, qty + 1))}>
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Action buttons are in the fixed footer below */}


          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.desc} numberOfLines={expanded ? undefined : 3}>{product.description}</Text>
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Specifications */}
          {product.specifications?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {product.specifications.map((s, i) => (
                <View key={i} style={styles.specRow}>
                  <Text style={styles.specKey}>{s.key}</Text>
                  <Text style={styles.specVal}>{s.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {reviews.length > 0 ? (
              reviews.slice(0, 5).map((r) => (
                <ReviewCard key={r._id} userName={r.userName} rating={r.rating} comment={r.comment} createdAt={r.createdAt} title={r.title} />
              ))
            ) : (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>

          {/* Related */}
          {product.relatedProducts?.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="You may also like" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 12 }}>
                {product.relatedProducts.map((p) => (
                  <View key={p._id} style={{ width: 170 }}><ProductCard {...p} /></View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Fixed Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionBtn, styles.addToCartBtn]} onPress={handleAddToCart} disabled={!product.inStock}>
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.buyNowBtn, !product.inStock && styles.disabledBtn]} onPress={handleBuyNow} disabled={!product.inStock}>
          <Text style={styles.buyNowText}>{product.inStock ? 'Buy Now' : 'Out of Stock'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  backBtn: { position: 'absolute', top: 50, left: 16, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerRight: { flexDirection: 'row', gap: 8 },
  content: { padding: spacing.lg, gap: spacing.lg },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 26, fontWeight: '800', color: colors.primary },
  mrp: { fontSize: 16, color: colors.textMuted, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 12, borderRadius: borderRadius.lg },
  qtyLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  qtySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  qtyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { width: 40, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, padding: spacing.lg, paddingBottom: spacing['3xl'], borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: spacing.md, zIndex: 20 },
  actionBtn: { flex: 1, height: 52, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  addToCartBtn: { backgroundColor: colors.primaryLight },
  addToCartText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  buyNowBtn: { backgroundColor: colors.primary },
  buyNowText: { fontSize: 15, fontWeight: '700', color: colors.white },
  disabledBtn: { opacity: 0.5 },
  section: { marginTop: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  desc: { fontSize: 15, color: colors.textSecondary, lineHeight: 24 },
  readMore: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 4 },
  specRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  specKey: { flex: 1, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  specVal: { flex: 1.5, fontSize: 14, color: colors.text, fontWeight: '600' },
  noReviews: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
});
