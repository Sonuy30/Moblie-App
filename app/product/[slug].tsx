import React, { useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
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
import RatingBreakdown from '@/components/product/RatingBreakdown';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import VariantSelector from '@/components/product/VariantSelector';
import ProductCard from '@/components/product/ProductCard';
import Badge from '@/components/ui/Badge';
import { ProductDetailSkeleton } from '@/components/skeletons/ProductDetailSkeleton';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { getProductReviews, type Review } from '@/api/reviews';
import { type ProductVariant } from '@/api/products';
import type { Product } from '@/types/product';
import { useProductShare } from '@/hooks/useProductShare';
import { ShareCard } from '@/components/product/ShareCard';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isOnline } = useNetworkStatus();
  const { data: product, isLoading } = useProductDetail(slug || '');
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const showAuthModal = useAuthModalStore((s) => s.show);

  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);

  const shareCardRef = useRef<View>(null);
  const { shareProduct, isSharing } = useProductShare();

  const handleShare = () => {
    if (product) {
      void shareProduct(
        {
          _id: product._id,
          slug: product.slug,
          name: product.name,
          storePrice: activePrice,
        },
        shareCardRef
      );
    }
  };

  // Load reviews once product is available
  React.useEffect(() => {
    if (product?._id && !reviewsLoaded) {
      getProductReviews(product._id)
        .then((r) => {
          setReviews(r);
          setReviewsLoaded(true);
        })
        .catch(() => setReviewsLoaded(true));
    }
  }, [product?._id, reviewsLoaded]);

  // Auto-select first available variant when product loads
  if (product && product._id !== prevProductId) {
    setPrevProductId(product._id);
    if (product.variants && product.variants.length > 0) {
      const firstAvailable = product.variants.find((v) => v.inStock) ?? product.variants[0];
      setSelectedVariant(firstAvailable);
    } else {
      setSelectedVariant(null);
    }
  }

  // Reset qty when variant changes
  const handleVariantSelect = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant);
    setQty(1);
  }, [setSelectedVariant, setQty]);

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

  // ── Active values (variant overrides base product) ──────
  const activePrice    = selectedVariant?.storePrice   ?? product.storePrice;
  const activeMRP      = selectedVariant?.mrp          ?? product.mrp;
  const activeDiscount = selectedVariant?.discount     ?? product.discount;
  const activeStock    = selectedVariant?.stockQty     ?? product.stockQty;
  const activeInStock  = selectedVariant
    ? selectedVariant.inStock
    : product.inStock;
  const activeWeight   = selectedVariant?.weightPerPiece ?? product.weightPerPiece;
  const activeImages   =
    (selectedVariant?.images && selectedVariant.images.length > 0)
      ? selectedVariant.images
      : product.images;
  const activeSpecs    = selectedVariant?.specifications ?? product.specifications;
  const activeItemCode = selectedVariant?.itemCode ?? product.itemCode;

  // ── Calculator ───────────────────────────────────────────
  const hasWeight = typeof activeWeight === 'number' && activeWeight > 0;
  const totalWeightKg = hasWeight ? qty * activeWeight : 0;
  const totalWeightDisplay =
    totalWeightKg >= 1000
      ? `${(totalWeightKg / 1000).toFixed(2)} MT`
      : `${totalWeightKg.toLocaleString()} kg`;

  const baseSubtotal = qty * activePrice;
  let bulkDiscountPercent = 0;
  if (qty >= 50) bulkDiscountPercent = 10;
  else if (qty >= 20) bulkDiscountPercent = 5;
  const discountSavings = baseSubtotal * (bulkDiscountPercent / 100);
  const finalSubtotal = baseSubtotal - discountSavings;

  // ── Cart payload ─────────────────────────────────────────
  const getCartPayload = () => ({
    productId: product._id,
    slug: product.slug,
    name: product.name,
    image:
      activeImages?.[0] ||
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80',
    price: activePrice,
    maxQty: activeStock,
    unit: product.unit || 'pcs',
    variantId: selectedVariant?._id,
    variantLabel: selectedVariant?.label,
  });

  const handleAddToCart = () => {
    if (!activeInStock) return;
    // Require variant selection if variants exist but none selected
    if (product.variants?.length && !selectedVariant) {
      Toast.show({ type: 'info', text1: `Please select a ${product.variantType}`, position: 'bottom' });
      return;
    }
    const payload = getCartPayload();
    if (!isAuthenticated) {
      showAuthModal('cart', payload);
      return;
    }
    for (let i = 0; i < qty; i++) addItem(payload);
    const variantSuffix = selectedVariant ? ` (${selectedVariant.label})` : '';
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${qty} × ${product.name}${variantSuffix}`,
      position: 'bottom',
    });
  };

  const handleBuyNow = () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Checkout is not available while you are offline. Please check your internet connection.'
      );
      return;
    }
    if (!activeInStock) return;
    if (product.variants?.length && !selectedVariant) {
      Toast.show({ type: 'info', text1: `Please select a ${product.variantType}`, position: 'bottom' });
      return;
    }
    const payload = getCartPayload();
    if (!isAuthenticated) {
      showAuthModal('checkout', payload);
      return;
    }
    for (let i = 0; i < qty; i++) addItem(payload);
    router.push('/checkout');
  };

  const handleWriteReview = () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Submitting reviews is not available while offline. Please connect to the internet to write a review.'
      );
      return;
    }
    if (!isAuthenticated) {
      showAuthModal('cart');
      Toast.show({ type: 'info', text1: 'Login required', text2: 'Please login to write a review.', position: 'bottom' });
      return;
    }
    setReviewModalVisible(true);
  };

  const handleReviewSubmitted = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    Toast.show({ type: 'success', text1: '🙏 Review submitted!', text2: 'Your review is now visible.', position: 'bottom' });
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const computedAvgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : product.avgRating || 0;

  const hasVariants = (product.variants?.length ?? 0) > 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="share-social-outline" size={22} color={colors.text} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageCarousel images={activeImages || []} />

        <View style={styles.content}>
          {/* Category badge */}
          {product.category && <Badge text={product.category} variant="neutral" />}

          {/* Product name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Item code */}
          <Text style={styles.itemCode}>
            Code: {activeItemCode || product.itemCode}
          </Text>

          {/* ── Variant Selector ── */}
          {hasVariants && product.variantType && (
            <View style={styles.variantSection}>
              <VariantSelector
                variantType={product.variantType}
                variants={product.variants!}
                selectedVariant={selectedVariant}
                onSelect={handleVariantSelect}
                basePrice={product.storePrice}
              />
            </View>
          )}

          {/* Pricing */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatINR(activePrice)}</Text>
            {activeMRP !== undefined && activeMRP > activePrice && (
              <Text style={styles.mrp}>{formatINR(activeMRP)}</Text>
            )}
            {activeDiscount !== undefined && activeDiscount > 0 && (
              <Badge text={`${activeDiscount}% OFF`} variant="success" />
            )}
          </View>

          {/* Stock badge */}
          <StockBadge inStock={activeInStock} stockQty={activeStock} />

          {/* Rating */}
          <TouchableOpacity onPress={() => {}} style={styles.ratingRow}>
            <StarRating
              rating={computedAvgRating}
              count={reviews.length || product.reviewCount || 0}
            />
          </TouchableOpacity>

          {/* Quantity Stepper */}
          {activeInStock && (
            <View style={styles.qtyRow}>
              <View style={styles.qtyLabelRow}>
                <Ionicons name="cube-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.qtyLabel}>
                  Quantity ({product.unit || 'pcs'})
                  {selectedVariant ? ` · ${selectedVariant.label}` : ''}
                </Text>
              </View>
              <View style={styles.qtySelector}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.max(1, qty - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.min(activeStock, qty + 1))}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Steel Weight & Price Calculator */}
          {hasWeight && activeInStock && (
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
                    <Text style={styles.calcValLarge}>{activeWeight} kg</Text>
                  </View>
                  <View style={styles.calcCol}>
                    <Text style={styles.calcLabel}>Total Est. Weight</Text>
                    <Text style={[styles.calcValLarge, { color: '#38ef7d' }]}>
                      {totalWeightDisplay}
                    </Text>
                  </View>
                </View>

                <View style={styles.calcDivider} />
                <Text style={styles.tiersTitle}>Bulk Wholesale Pricing Tiers</Text>
                <View style={styles.tiersRow}>
                  <View
                    style={[
                      styles.tierBadge,
                      qty >= 20 && qty < 50 && styles.tierBadgeActive,
                      qty >= 50 && styles.tierBadgeSurpassed,
                    ]}
                  >
                    <Text style={styles.tierBadgeText}>20+ Pcs (5% Off)</Text>
                  </View>
                  <View
                    style={[styles.tierBadge, qty >= 50 && styles.tierBadgeActive]}
                  >
                    <Text style={styles.tierBadgeText}>50+ Pcs (10% Off)</Text>
                  </View>
                </View>

                <View style={styles.calcDivider} />

                <View style={styles.summaryRow}>
                  <View>
                    <Text style={styles.summaryLabel}>Estimated Cost</Text>
                    {bulkDiscountPercent > 0 && (
                      <Text style={styles.savingsText}>
                        Saved {formatINR(discountSavings)} ({bulkDiscountPercent}%)
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {bulkDiscountPercent > 0 && (
                      <Text style={styles.oldSubtotal}>{formatINR(baseSubtotal)}</Text>
                    )}
                    <Text style={styles.summaryPrice}>{formatINR(finalSubtotal)}</Text>
                  </View>
                </View>

                {bulkDiscountPercent === 0 && qty < 20 && (
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
          {(activeSpecs?.length || 0) > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              <View style={styles.specsCard}>
                {activeSpecs?.map((s: { key: string; value: string }, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.specRow,
                      i === (activeSpecs.length - 1) && styles.specRowLast,
                    ]}
                  >
                    <View style={styles.specKeyBox}>
                      <Text style={styles.specKey}>{s.key}</Text>
                    </View>
                    <Text style={styles.specVal}>{s.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Customer Reviews Section ── */}
          <View style={styles.section}>
            <View style={styles.reviewSectionHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <TouchableOpacity style={styles.writeReviewBtn} onPress={handleWriteReview}>
                <Ionicons name="create-outline" size={15} color={colors.primary} />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>
            </View>

            {/* Rating Breakdown */}
            {reviews.length > 0 && (
              <RatingBreakdown
                avgRating={computedAvgRating}
                reviewCount={reviews.length}
                reviews={reviews}
              />
            )}

            {/* Review Cards */}
            {reviews.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                {displayedReviews.map((r) => (
                  <ReviewCard
                    key={r._id}
                    userName={r.userName}
                    rating={r.rating}
                    comment={r.comment}
                    createdAt={r.createdAt}
                    title={r.title}
                    isHighlighted={r.userId === 'me'}
                  />
                ))}
                {reviews.length > 3 && (
                  <TouchableOpacity
                    style={styles.showMoreReviewsBtn}
                    onPress={() => setShowAllReviews(!showAllReviews)}
                  >
                    <Text style={styles.showMoreReviewsText}>
                      {showAllReviews
                        ? 'Show fewer reviews'
                        : `Show all ${reviews.length} reviews`}
                    </Text>
                    <Ionicons
                      name={showAllReviews ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.noReviewsBox}>
                <Ionicons name="chatbubble-outline" size={36} color={colors.border} />
                <Text style={styles.noReviewsTitle}>No reviews yet</Text>
                <Text style={styles.noReviewsSub}>Be the first to share your experience!</Text>
                <TouchableOpacity style={styles.firstReviewBtn} onPress={handleWriteReview}>
                  <Text style={styles.firstReviewBtnText}>Write First Review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── You May Also Like ── */}
          {(product.relatedProducts?.length || 0) > 0 && (
            <View style={styles.section}>
              <View style={styles.recommendedHeader}>
                <Ionicons name="sparkles" size={16} color={colors.star} />
                <Text style={styles.sectionTitle}>You May Also Like</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 0, gap: 12 }}
              >
                {product.relatedProducts?.map((p: Product) => (
                  <View key={p._id} style={{ width: 170 }}>
                    <ProductCard {...p} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 110 }} />
        </View>
      </ScrollView>

      {/* Fixed footer controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.addToCartBtn]}
          onPress={handleAddToCart}
          disabled={!activeInStock}
        >
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.buyNowBtn,
            !activeInStock && styles.disabledBtn,
          ]}
          onPress={handleBuyNow}
          disabled={!activeInStock}
        >
          <Text style={styles.buyNowText}>
            {activeInStock ? 'Buy Now' : 'Out of Stock'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Write Review Modal */}
      <WriteReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        productId={product._id}
        productName={product.name}
        onReviewSubmitted={handleReviewSubmitted}
        userName={user?.fullName || 'Customer'}
        userId={user?._id || 'me'}
      />

      {/* Hidden ShareCard for social sharing snapshot */}
      <View style={styles.hiddenShareCard} pointerEvents="none">
        <ShareCard
          ref={shareCardRef}
          name={product.name}
          image={activeImages?.[0] || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80'}
          storePrice={activePrice}
          mrp={activeMRP}
          discount={activeDiscount}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
  },
  addToCartBtn: { backgroundColor: colors.primaryLight },
  addToCartText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    left: 16,
    position: 'absolute',
    top: 50,
    width: 40,
    zIndex: 10,
  },
  buyNowBtn: { backgroundColor: colors.primary },
  buyNowText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  // Calculator
  calcCard: {
    borderRadius: borderRadius.lg,
    elevation: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  calcCol: { flex: 1 },
  calcDivider: { backgroundColor: 'rgba(255,255,255,0.1)', height: 1, marginVertical: 12 },
  calcGradient: { padding: 16 },
  calcHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  calcLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between' },
  calcTitle: { color: colors.white, fontSize: 14, fontWeight: '800' },
  calcValLarge: { color: colors.white, fontSize: 18, fontWeight: '800' },
  content: { gap: spacing.md, padding: spacing.lg },
  desc: { color: colors.textSecondary, fontSize: 14, lineHeight: 22 },
  disabledBtn: { opacity: 0.5 },
  firstReviewBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  firstReviewBtnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.md,
    left: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  headerBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    elevation: 3,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 40,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  helperRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 12 },
  helperText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  hiddenShareCard: {
    left: -9999,
    position: 'absolute',
  },
  itemCode: {
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
    marginTop: -spacing.sm,
  },
  mrp: { color: colors.textMuted, fontSize: 15, textDecorationLine: 'line-through' },
  name: { color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 30 },
  noReviewsBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    gap: 8,
    paddingVertical: 32,
  },
  noReviewsSub: { color: colors.textMuted, fontSize: 13 },
  noReviewsTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  oldSubtotal: { color: '#94a3b8', fontSize: 12, marginBottom: 2, textDecorationLine: 'line-through' },
  price: { color: colors.primary, fontSize: 26, fontWeight: '800' },
  // Pricing
  priceRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  qtyBtn: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  qtyLabel: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '700' },
  qtyLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  // Qty
  qtyRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  qtySelector: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  qtyVal: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center', width: 40 },
  ratingRow: { flexDirection: 'row' },
  readMore: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 4 },
  // Recommended
  recommendedHeader: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  // Reviews
  reviewSectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  safe: { backgroundColor: colors.background, flex: 1 },
  savingsText: { color: '#38ef7d', fontSize: 11, fontWeight: '700', marginTop: 2 },
  section: { gap: spacing.sm, marginTop: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  showMoreReviewsBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 12,
  },
  showMoreReviewsText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  specKey: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  specKeyBox: { flex: 1, paddingRight: 8 },
  specRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  specRowLast: { borderBottomWidth: 0 },
  specVal: { color: colors.text, flex: 1.5, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  // Specs
  specsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryLabel: { color: colors.white, fontSize: 14, fontWeight: '800' },
  summaryPrice: { color: colors.white, fontSize: 20, fontWeight: '900' },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  tierBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tierBadgeActive: { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: '#f97316' },
  tierBadgeSurpassed: { backgroundColor: 'rgba(56,239,125,0.1)', borderColor: 'rgba(56,239,125,0.4)' },
  tierBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  tiersRow: { flexDirection: 'row', gap: 8 },
  tiersTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  // Variant section
  variantSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  writeReviewBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  writeReviewText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
});
