import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import { useProducts, useCategories } from '@/hooks/useProducts';
import type { StoreProduct } from '@/api/products';
import { useCartStore } from '@/stores/cartStore';
import ProductCard from '@/components/product/ProductCard';
import HeroBanner from '@/components/home/HeroBanner';
import DiscountCarousel from '@/components/home/DiscountCarousel';
import FlashSaleBanner from '@/components/sales/FlashSaleBanner';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlashList = OriginalFlashList as any;

export default function HomeScreen() {
  const totalItems = useCartStore((s) => s.totalItems());
  const { data: categoriesData } = useCategories();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: featuredData, isLoading: loadFeat, refetch: refetchFeat } = useProducts({
    featured: true,
    limit: 10,
    category: selectedCategory || undefined,
  });

  const { data: newestData, isLoading: loadNew, refetch: refetchNew } = useProducts({
    sort: 'newest',
    limit: 10,
    category: selectedCategory || undefined,
  });

  const { data: allData, isLoading: loadAll, refetch: refetchAll } = useProducts({
    limit: 20,
    category: selectedCategory || undefined,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFeat(), refetchNew(), refetchAll()]);
    setRefreshing(false);
  };

  const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Pankaj Steel';
  const categories = categoriesData || [];
  const featuredProducts = featuredData?.products || [];
  const newestProducts = newestData?.products || [];
  const allProducts = allData?.products || [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Text style={styles.brandTitle}>{companyName}</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL STORE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/explore')}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Ionicons name="cart-outline" size={22} color={colors.text} />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { onRefresh().catch(() => {}); }} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Tappable Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search steel, pipes, TMT bars...</Text>
        </TouchableOpacity>

        {/* Hero banner */}
        <HeroBanner />

        {/* Exclusive discount carousel */}
        <DiscountCarousel />

        {/* Flash Sale Banner */}
        <FlashSaleBanner />

        {/* Category horizontal scroll pills */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            <TouchableOpacity
              style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/explore', params: { featured: 'true' } })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadFeat ? (
            <View style={styles.skeletonList}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.cardSkeletonWidth}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ height: 260 }}>
              <FlashList
                data={featuredProducts}
                horizontal
                estimatedItemSize={170}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                renderItem={({ item }: { item: StoreProduct }) => (
                  <View style={styles.cardWrapper}>
                    <ProductCard {...item} />
                  </View>
                )}
                keyExtractor={(item: StoreProduct) => item._id}
              />
            </View>
          )}
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Arrivals</Text>
            <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/explore', params: { sort: 'newest' } })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadNew ? (
            <View style={styles.skeletonList}>
              {[1, 2].map((i) => (
                <View key={i} style={styles.cardSkeletonWidth}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ height: 260 }}>
              <FlashList
                data={newestProducts}
                horizontal
                estimatedItemSize={170}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                renderItem={({ item }: { item: StoreProduct }) => (
                  <View style={styles.cardWrapper}>
                    <ProductCard {...item} />
                  </View>
                )}
                keyExtractor={(item: StoreProduct) => item._id}
              />
            </View>
          )}
        </View>

        {/* All Products Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Products</Text>
          </View>

          {loadAll ? (
            <View style={styles.grid}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.gridItem}>
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.gridContainer}>
              <FlashList
                data={allProducts}
                numColumns={2}
                estimatedItemSize={260}
                renderItem={({ item }: { item: StoreProduct }) => (
                  <View style={styles.gridItem}>
                    <ProductCard {...item} />
                  </View>
                )}
                keyExtractor={(item: StoreProduct) => item._id}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandContainer: {
    flexDirection: 'column',
  },
  brandSubtitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
  },
  brandTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardSkeletonWidth: {
    width: 170,
  },
  cardWrapper: {
    marginRight: 12,
    width: 170,
  },
  cartBadge: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 99,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
  },
  categoryContainer: {
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  categoryPill: {
    backgroundColor: colors.surface,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryScroll: {
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.white,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  gridContainer: {
    minHeight: 300,
    paddingHorizontal: spacing.lg - 4,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.lg,
    marginHorizontal: 4,
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
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 10,
    height: 50,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  seeAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  skeletonList: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
  },
});
