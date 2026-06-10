import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import Toast from 'react-native-toast-message';
import { getActiveSale, getSaleProducts, setMockSaleOffset, type SaleProduct } from '@/api/sales';
import CountdownTimer from '@/components/sales/CountdownTimer';
import SaleBadge from '@/components/sales/SaleBadge';
import { SearchResultSkeleton } from '@/components/skeletons/SearchResultSkeleton';
import { SkeletonRect } from '@/components/skeletons/SkeletonBase';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlashList = OriginalFlashList as any;

type SortOption = 'timeLeft' | 'discount' | 'priceAsc' | 'priceDesc';

// Simulated individual product end time offsets (in seconds from now) for sorting by "Time Left"
const MOCK_PRODUCT_TIMEOUTS: Record<string, number> = {
  'prod-tmt-10mm': 3600 * 1.5, // 1.5 hours
  'prod-gi-pipe-25': 3600 * 0.8, // 48 minutes
  'prod-sht-15': 3600 * 2.5,   // 2.5 hours
  'prod-rnd-16': 300,          // 5 minutes (sold out)
  'prod-ang-40': 120,          // 2 minutes (low stock)
};

export default function SaleScreen() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showAuthModal = useAuthModalStore((s) => s.show);

  const [sortBy, setSortBy] = useState<SortOption>('discount');
  const [demoMode, setDemoMode] = useState<'normal' | 'pulsing' | 'expired'>('normal');

  // Query active sale
  const { data: activeSale, isLoading: loadingSale } = useQuery({
    queryKey: ['active-sale'],
    queryFn: getActiveSale,
  });

  // Query sale products
  const { data: saleProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['sale-products', activeSale?._id],
    queryFn: () => getSaleProducts(activeSale?._id || ''),
    enabled: !!activeSale?._id,
  });

  // Handle simulated QA countdown tests
  const handleQAOffsetChange = (mode: 'normal' | 'pulsing' | 'expired') => {
    setDemoMode(mode);
    if (mode === 'normal') {
      setMockSaleOffset(2 * 60 * 60); // 2 hours
    } else if (mode === 'pulsing') {
      setMockSaleOffset(4 * 60); // 4 minutes
    } else {
      setMockSaleOffset(-10); // Already ended
    }
    // Invalidate react query cache to trigger immediate update of components
    void queryClient.invalidateQueries({ queryKey: ['active-sale'] });
  };

  const handleAddToCart = (item: SaleProduct) => {
    if (!item.inStock || item.stockQty <= 0) return;

    const cartData = {
      productId: item._id,
      slug: item.slug,
      name: item.name,
      image: item.images?.[0] || '',
      price: item.storePrice,
      maxQty: item.stockQty,
      unit: item.unit || 'pcs',
    };

    if (!isAuthenticated) {
      showAuthModal('cart', cartData);
      return;
    }

    addItem(cartData);
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${item.name} added successfully!`,
      position: 'bottom',
    });
  };

  // Sort and process product list
  const getSortedProducts = (): SaleProduct[] => {
    if (!saleProducts) return [];
    const list = [...saleProducts];

    return list.sort((a, b) => {
      if (sortBy === 'discount') {
        return b.discount - a.discount; // High discount first
      }
      if (sortBy === 'priceAsc') {
        return a.storePrice - b.storePrice; // Low price first
      }
      if (sortBy === 'priceDesc') {
        return b.storePrice - a.storePrice; // High price first
      }
      if (sortBy === 'timeLeft') {
        const timeA = MOCK_PRODUCT_TIMEOUTS[a._id] ?? 99999;
        const timeB = MOCK_PRODUCT_TIMEOUTS[b._id] ?? 99999;
        return timeA - timeB; // Shortest time left first
      }
      return 0;
    });
  };

  const sortedList = getSortedProducts();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Hot Deals</Text>
          <Text style={styles.headerSub}>Exclusive flash sales</Text>
        </View>
        <Ionicons name="flame" size={24} color="#FF5722" />
      </View>

      {/* QA Demo Switcher */}
      <View style={styles.qaBar}>
        <Text style={styles.qaLabel}>QA Mode:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qaScroll}>
          <TouchableOpacity
            style={[styles.qaButton, demoMode === 'normal' && styles.qaButtonActive]}
            onPress={() => handleQAOffsetChange('normal')}
          >
            <Text style={[styles.qaButtonText, demoMode === 'normal' && styles.qaButtonTextActive]}>2h Left</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.qaButton, demoMode === 'pulsing' && styles.qaButtonActive]}
            onPress={() => handleQAOffsetChange('pulsing')}
          >
            <Text style={[styles.qaButtonText, demoMode === 'pulsing' && styles.qaButtonTextActive]}>4m (Pulse)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.qaButton, demoMode === 'expired' && styles.qaButtonActive]}
            onPress={() => handleQAOffsetChange('expired')}
          >
            <Text style={[styles.qaButtonText, demoMode === 'expired' && styles.qaButtonTextActive]}>Expired</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loadingSale || loadingProducts ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Sale details card skeleton */}
          <View style={[styles.saleDetailsCard, { backgroundColor: colors.border }]}>
            <View style={{ gap: 8 }}>
              <SkeletonRect width="60%" height={20} radius={4} />
              <SkeletonRect width="80%" height={14} radius={4} />
            </View>
          </View>
          {/* Sort header skeleton */}
          <View style={styles.sortHeader}>
            <SkeletonRect width="15%" height={14} radius={3} />
            <View style={{ flexDirection: 'row', gap: 8, flex: 1, marginLeft: 10 }}>
              <SkeletonRect width={80} height={28} radius={14} />
              <SkeletonRect width={80} height={28} radius={14} />
              <SkeletonRect width={80} height={28} radius={14} />
            </View>
          </View>
          {/* Products list skeleton: 6 items */}
          <View style={styles.listContainer}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SearchResultSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      ) : activeSale ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Sale details card */}
          <View style={styles.saleDetailsCard}>
            <View style={styles.detailsRow}>
              <View style={styles.bannerInfo}>
                <Text style={styles.saleTitle}>{activeSale.title}</Text>
                <Text style={styles.saleDesc}>{activeSale.description}</Text>
              </View>
              <View style={styles.timerBadge}>
                <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.7)" />
                <CountdownTimer
                  endTime={activeSale.endTime}
                  textStyle={styles.timerText}
                />
              </View>
            </View>
          </View>

          {/* Sticky-like Sort Header */}
          <View style={styles.sortHeader}>
            <Text style={styles.sortLabel}>Sort By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'discount' && styles.sortPillActive]}
                onPress={() => setSortBy('discount')}
              >
                <Text style={[styles.sortPillText, sortBy === 'discount' && styles.sortPillTextActive]}>
                  Discount %
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'timeLeft' && styles.sortPillActive]}
                onPress={() => setSortBy('timeLeft')}
              >
                <Text style={[styles.sortPillText, sortBy === 'timeLeft' && styles.sortPillTextActive]}>
                  Time Left
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'priceAsc' && styles.sortPillActive]}
                onPress={() => setSortBy('priceAsc')}
              >
                <Text style={[styles.sortPillText, sortBy === 'priceAsc' && styles.sortPillTextActive]}>
                  Price: Low to High
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sortPill, sortBy === 'priceDesc' && styles.sortPillActive]}
                onPress={() => setSortBy('priceDesc')}
              >
                <Text style={[styles.sortPillText, sortBy === 'priceDesc' && styles.sortPillTextActive]}>
                  Price: High to Low
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* FlashList product feed */}
          {sortedList.length > 0 ? (
            <View style={styles.listContainer}>
              <FlashList
                data={sortedList}
                estimatedItemSize={160}
                scrollEnabled={false}
                renderItem={({ item }: { item: SaleProduct }) => {
                  const hasStock = item.inStock && item.stockQty > 0;
                  const totalQty = item.soldQty + item.stockQty;
                  const soldPercent = totalQty > 0 ? Math.round((item.soldQty / totalQty) * 100) : 0;
                  const individualTimeLeft = MOCK_PRODUCT_TIMEOUTS[item._id] || 0;

                  return (
                    <View style={[styles.productCard, !hasStock && styles.soldOutCard]}>
                      {/* Left: Product Image */}
                      <View style={styles.imageContainer}>
                        <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                        <SaleBadge discount={item.discount} style={styles.badgePosition} />
                        
                        {/* Sold out overlay */}
                        {!hasStock && (
                          <View style={styles.soldOutOverlay}>
                            <View style={styles.soldOutBadge}>
                              <Text style={styles.soldOutBadgeText}>SOLD OUT</Text>
                            </View>
                          </View>
                        )}
                      </View>

                      {/* Right: Info and Action */}
                      <View style={styles.infoContainer}>
                        <Text style={styles.productName} numberOfLines={2}>
                          {item.name}
                        </Text>

                        {/* Ticking Time left label if not sold out */}
                        {hasStock && individualTimeLeft > 0 && (
                          <View style={styles.timeLeftRow}>
                            <Ionicons name="time" size={12} color={individualTimeLeft <= 600 ? colors.error : colors.textSecondary} />
                            <Text style={[
                              styles.timeLeftText,
                              individualTimeLeft <= 600 && styles.timeLeftTextUrgent
                            ]}>
                              {individualTimeLeft <= 600 ? 'Ending soon!' : 'Deal active'}
                            </Text>
                          </View>
                        )}

                        <View style={styles.priceRow}>
                          <Text style={styles.salePrice}>{formatINR(item.storePrice)}</Text>
                          <Text style={styles.originalPrice}>{formatINR(item.originalPrice)}</Text>
                        </View>

                        {/* Sold Quantity Progress bar */}
                        <View style={styles.progressSection}>
                          <View style={styles.progressBarBackground}>
                            <View style={[styles.progressBarFill, { width: `${soldPercent}%` }]} />
                          </View>
                          <Text style={styles.progressText}>
                            {soldPercent}% sold ({item.soldQty} items)
                          </Text>
                        </View>

                        {/* Action buttons */}
                        <TouchableOpacity
                          style={[styles.addBtn, !hasStock && styles.addBtnDisabled]}
                          disabled={!hasStock}
                          onPress={() => handleAddToCart(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="cart-outline" size={16} color={hasStock ? colors.primary : colors.textMuted} />
                          <Text style={[styles.addBtnText, !hasStock && styles.addBtnTextDisabled]}>
                            {hasStock ? 'Claim Deal' : 'Unavailable'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
                keyExtractor={(item: SaleProduct) => item._id}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No sales products available.</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="flame-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No active sales found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 10,
  },
  addBtnDisabled: {
    backgroundColor: colors.surface,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  addBtnTextDisabled: {
    color: colors.textMuted,
  },
  badgePosition: {
    left: 8,
    position: 'absolute',
    top: 8,
    zIndex: 2,
  },
  bannerInfo: {
    flex: 1,
    gap: 4,
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  imageContainer: {
    backgroundColor: colors.surface,
    height: 160,
    position: 'relative',
    width: 130,
  },
  infoContainer: {
    flex: 1,
    gap: 6,
    padding: spacing.md,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
  },
  originalPrice: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  priceRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
  },
  productCard: {
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  progressBarBackground: {
    backgroundColor: colors.surface,
    borderRadius: 3,
    height: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    backgroundColor: '#FF7043',
    height: '100%',
  },
  progressSection: {
    gap: 4,
    marginVertical: 2,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  qaBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  qaButton: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  qaButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qaButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  qaButtonTextActive: {
    color: colors.white,
  },
  qaLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  qaScroll: {
    gap: 6,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  saleDesc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  saleDetailsCard: {
    backgroundColor: '#D84315',
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  salePrice: {
    color: '#D84315',
    fontSize: 16,
    fontWeight: '900',
  },
  saleTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  soldOutBadge: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soldOutBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  soldOutCard: {
    borderColor: colors.border,
  },
  soldOutOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  sortHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sortLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
  },
  sortOptions: {
    gap: 8,
  },
  sortPill: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortPillActive: {
    backgroundColor: colors.primaryLight,
  },
  sortPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sortPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  timeLeftRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  timeLeftText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  timeLeftTextUrgent: {
    color: colors.error,
  },
  timerBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 4,
    height: 32,
    paddingHorizontal: 8,
  },
  timerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  titleWrapper: {
    flexDirection: 'column',
  },
});
