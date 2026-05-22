import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useProductDetail } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import ImageCarousel from '@/components/product/ImageCarousel';
import { LinearGradient } from 'expo-linear-gradient';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showAuthModal = useAuthModalStore((s) => s.show);
  
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

  // Calculator calculations
  const hasWeight = typeof product.weightPerPiece === 'number' && product.weightPerPiece > 0;
  const totalWeightKg = hasWeight ? qty * product.weightPerPiece! : 0;
  const totalWeightDisplay = totalWeightKg >= 1000 
    ? `${(totalWeightKg / 1000).toFixed(2)} Metric Tons` 
    : `${totalWeightKg.toLocaleString()} kg`;

  const baseSubtotal = qty * product.storePrice;
  let bulkDiscountPercent = 0;
  if (qty >= 50) {
    bulkDiscountPercent = 10;
  } else if (qty >= 20) {
    bulkDiscountPercent = 5;
  }
  const discountSavings = baseSubtotal * (bulkDiscountPercent / 100);
  const finalSubtotal = baseSubtotal - discountSavings;

  const getCartPayload = () => ({
    productId: product._id,
    slug: product.slug,
    name: product.name,
    image: product.images?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    price: product.storePrice,
    maxQty: product.stockQty,
    unit: product.unit || 'pcs',
  });

  const handleAddToCart = () => {
    if (!product.inStock) return;

    const payload = getCartPayload();

    if (!isAuthenticated) {
      showAuthModal('cart', payload);
      return;
    }

    // Add multiple quantities as selected by the user
    for (let i = 0; i < qty; i++) {
      addItem(payload);
    }
    
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${qty} x ${product.name} added!`,
      position: 'bottom',
    });
  };

  const handleBuyNow = () => {
    if (!product.inStock) return;

    const payload = getCartPayload();

    if (!isAuthenticated) {
      showAuthModal('checkout', payload);
      return;
    }

    // Add multiple quantities as selected by the user to checkout
    for (let i = 0; i < qty; i++) {
      addItem(payload);
    }
    router.push('/checkout');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={22} color={colors.text} />
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
            {product.mrp !== undefined && product.mrp > product.storePrice && (
              <Text style={styles.mrp}>{formatINR(product.mrp)}</Text>
            )}
            {product.discount !== undefined && product.discount > 0 && (
              <Badge text={`${product.discount}% OFF`} variant="success" />
            )}
          </View>

          <StockBadge inStock={product.inStock} stockQty={product.stockQty} />

          <TouchableOpacity onPress={() => {}} style={styles.ratingRow}>
            <StarRating rating={product.avgRating || 0} count={product.reviewCount || 0} />
          </TouchableOpacity>

          {/* Quantity Stepper */}
          {product.inStock && (
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Quantity ({product.unit || 'pcs'}):</Text>
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

          {/* Steel Weight & Price Calculator Widget */}
          {hasWeight && product.inStock && (
            <View style={styles.calcCard}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.calcGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.calcHeader}>
                  <Ionicons name="calculator-outline" size={18} color="#f97316" />
                  <Text style={styles.calcTitle}>Steel Weight & Price Estimator</Text>
                </View>

                <View style={styles.calcDivider} />

                <View style={styles.calcRow}>
                  <View style={styles.calcCol}>
                    <Text style={styles.calcLabel}>Unit Weight</Text>
                    <Text style={styles.calcValLarge}>{product.weightPerPiece} kg</Text>
                  </View>
                  <View style={styles.calcCol}>
                    <Text style={styles.calcLabel}>Total Est. Weight</Text>
                    <Text style={[styles.calcValLarge, { color: '#38ef7d' }]}>{totalWeightDisplay}</Text>
                  </View>
                </View>

                <View style={styles.calcDivider} />
                <Text style={styles.tiersTitle}>Bulk Wholesale Pricing Tiers</Text>
                <View style={styles.tiersRow}>
                  <View style={[
                    styles.tierBadge, 
                    qty >= 20 && qty < 50 && styles.tierBadgeActive,
                    qty >= 50 && styles.tierBadgeSurpassed
                  ]}>
                    <Text style={styles.tierBadgeText}>20+ Pcs (5% Off)</Text>
                  </View>
                  <View style={[
                    styles.tierBadge, 
                    qty >= 50 && styles.tierBadgeActive
                  ]}>
                    <Text style={styles.tierBadgeText}>50+ Pcs (10% Off)</Text>
                  </View>
                </View>

                <View style={styles.calcDivider} />

                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Estimated Cost</Text>
                    {bulkDiscountPercent > 0 && (
                      <Text style={styles.savingsText}>Saved {formatINR(discountSavings)} ({bulkDiscountPercent}%)</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {bulkDiscountPercent > 0 && (
                      <Text style={styles.oldSubtotal}>{formatINR(baseSubtotal)}</Text>
                    )}
                    <Text style={styles.summaryPrice}>{formatINR(finalSubtotal)}</Text>
                  </View>
                </View>

                {bulkDiscountPercent === 0 && (
                  <View style={styles.helperRow}>
                    <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
                    <Text style={styles.helperText}>
                      Add {20 - qty} more to unlock 5% wholesale discount!
                    </Text>
                  </View>
                )}
                {bulkDiscountPercent === 5 && (
                  <View style={styles.helperRow}>
                    <Ionicons name="sparkles-outline" size={14} color="#f59e0b" />
                    <Text style={[styles.helperText, { color: '#f59e0b' }]}>
                      Add {50 - qty} more to unlock 10% wholesale discount!
                    </Text>
                  </View>
                )}
                {bulkDiscountPercent === 10 && (
                  <View style={styles.helperRow}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#10b981" />
                    <Text style={[styles.helperText, { color: '#10b981' }]}>
                      Maximum wholesale tier (10% OFF) applied!
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this product</Text>
              <Text style={styles.desc} numberOfLines={expanded ? undefined : 4}>
                {product.description}
              </Text>
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={styles.readMore}>{expanded ? 'Show less' : 'Read more'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Specifications */}
          {(product.specifications?.length || 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {product.specifications?.map((s: any, i: number) => (
                <View key={i} style={styles.specRow}>
                  <Text style={styles.specKey}>{s.key}</Text>
                  <Text style={styles.specVal}>{s.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Reviews List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {reviews.length > 0 ? (
              reviews.slice(0, 5).map((r) => (
                <ReviewCard
                  key={r._id}
                  userName={r.userName}
                  rating={r.rating}
                  comment={r.comment}
                  createdAt={r.createdAt}
                  title={r.title}
                />
              ))
            ) : (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>

          {/* Related products */}
          {(product.relatedProducts?.length || 0) > 0 && (
            <View style={styles.section}>
              <SectionHeader title="You may also like" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 12 }}>
                {product.relatedProducts?.map((p: any) => (
                  <View key={p._id} style={{ width: 170 }}>
                    <ProductCard {...p} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Fixed footer controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.addToCartBtn]}
          onPress={handleAddToCart}
          disabled={!product.inStock}
        >
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.buyNowBtn, !product.inStock && styles.disabledBtn]}
          onPress={handleBuyNow}
          disabled={!product.inStock}
        >
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
  name: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 30 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price: { fontSize: 24, fontWeight: '800', color: colors.primary },
  mrp: { fontSize: 15, color: colors.textMuted, textDecorationLine: 'line-through' },
  ratingRow: { flexDirection: 'row' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 12, borderRadius: borderRadius.lg },
  qtyLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  qtySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  qtyBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { width: 40, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.white, padding: spacing.lg, paddingBottom: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: spacing.md, zIndex: 20 },
  actionBtn: { flex: 1, height: 52, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  addToCartBtn: { backgroundColor: colors.primaryLight },
  addToCartText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  buyNowBtn: { backgroundColor: colors.primary },
  buyNowText: { fontSize: 15, fontWeight: '700', color: colors.white },
  disabledBtn: { opacity: 0.5 },
  section: { marginTop: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  desc: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  readMore: { fontSize: 13, color: colors.primary, fontWeight: '700', marginTop: 4 },
  specRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  specKey: { flex: 1, fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  specVal: { flex: 1.5, fontSize: 13, color: colors.text, fontWeight: '700' },
  noReviews: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  calcCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  calcGradient: {
    padding: 16,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  calcDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcCol: {
    flex: 1,
  },
  calcLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  calcValLarge: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  tiersTitle: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  tiersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierBadge: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tierBadgeActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#f97316',
  },
  tierBadgeSurpassed: {
    backgroundColor: 'rgba(56, 239, 125, 0.1)',
    borderColor: 'rgba(56, 239, 125, 0.4)',
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  savingsText: {
    fontSize: 11,
    color: '#38ef7d',
    fontWeight: '700',
    marginTop: 2,
  },
  oldSubtotal: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.white,
  },
  helperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  helperText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
