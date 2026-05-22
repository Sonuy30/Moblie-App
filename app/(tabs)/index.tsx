import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import ProductCard from '@/components/product/ProductCard';
import HeroBanner from '@/components/home/HeroBanner';
import DiscountCarousel from '@/components/home/DiscountCarousel';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Tappable Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search products, structural steel...</Text>
        </TouchableOpacity>

        {/* Hero banner */}
        <HeroBanner />

        {/* Exclusive discount carousel */}
        <DiscountCarousel />

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
                renderItem={({ item }: { item: any }) => (
                  <View style={styles.cardWrapper}>
                    <ProductCard {...item} />
                  </View>
                )}
                keyExtractor={(item: any) => item._id}
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
                renderItem={({ item }: { item: any }) => (
                  <View style={styles.cardWrapper}>
                    <ProductCard {...item} />
                  </View>
                )}
                keyExtractor={(item: any) => item._id}
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
                renderItem={({ item }: { item: any }) => (
                  <View style={styles.gridItem}>
                    <ProductCard {...item} />
                  </View>
                )}
                keyExtractor={(item: any) => item._id}
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
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  brandContainer: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 99,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    height: 50,
    gap: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  categoryContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: colors.surface,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: colors.white,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  skeletonList: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  cardSkeletonWidth: {
    width: 170,
  },
  cardWrapper: {
    width: 170,
    marginRight: 12,
  },
  gridContainer: {
    minHeight: 300,
    paddingHorizontal: spacing.lg - 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: spacing.lg,
  },
});
