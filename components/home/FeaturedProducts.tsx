import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useProducts } from '@/hooks/useProducts';
import type { StoreProduct } from '@/api/products';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

// ── Section Header ──────────────────────────────────────────
function SectionHeader({
  title,
  badge,
  badgeColor,
  badgeBg,
  onViewAll,
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
  badgeBg?: string;
  onViewAll: () => void;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeBg ?? '#FFF3E0' }]}>
            <Text style={[styles.badgeText, { color: badgeColor ?? '#E65100' }]}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
        <Text style={styles.viewAll}>View All →</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Skeleton row ────────────────────────────────────────────
function SkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      {[1, 2].map((i) => (
        <View key={i} style={styles.skeletonItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

// ── Horizontal product scroll ───────────────────────────────
function HorizontalProductScroll({ products }: { products: StoreProduct[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.hScrollContent}
    >
      {products.map((item) => (
        <View key={item._id} style={styles.hCard}>
          <ProductCard {...item} />
        </View>
      ))}
    </ScrollView>
  );
}

// ── Main component ──────────────────────────────────────────
export default function FeaturedProducts() {
  const { data: featData, isLoading: loadFeat } = useProducts({
    featured: true,
    limit: 6,
  });
  const { data: newData, isLoading: loadNew } = useProducts({
    sort: 'newest',
    limit: 8,
  });

  // If featured list is empty after load, fall back to general products
  const { data: allData, isLoading: loadAll } = useProducts({
    limit: 6,
  });

  const featuredProducts = featData?.products ?? [];
  const newestProducts = newData?.products ?? [];
  const allProducts = allData?.products ?? [];

  // Use featured products if available, else fall back to general
  const bestSellers =
    featuredProducts.length > 0 ? featuredProducts : allProducts;
  const isBestLoading = featuredProducts.length === 0 ? loadAll : loadFeat;

  return (
    <View>
      {/* ── Best Sellers ── */}
      <View style={styles.section}>
        <SectionHeader
          title="Best Sellers"
          badge="🔥 HOT"
          onViewAll={() =>
            router.push({ pathname: '/(tabs)/search', params: { featured: 'true' } })
          }
        />
        {isBestLoading ? (
          <SkeletonRow />
        ) : bestSellers.length === 0 ? null : (
        <FlatList
            data={bestSellers}
            numColumns={2}
            keyExtractor={(item: StoreProduct) => item._id}
            scrollEnabled={false}
            renderItem={({ item }: { item: StoreProduct }) => (
              <View style={styles.gridItem}>
                <ProductCard {...item} />
              </View>
            )}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.row}
            getItemLayout={(_data, index) => ({
              length: 220,
              offset: 220 * Math.floor(index / 2),
              index,
            })}
          />
        )}
      </View>

      {/* ── New Arrivals (horizontal scroll) ── */}
      <View style={[styles.section, styles.sectionNew]}>
        <SectionHeader
          title="New Arrivals"
          badge="✨ FRESH"
          badgeBg="#E8F5E9"
          badgeColor="#2E7D32"
          onViewAll={() =>
            router.push({ pathname: '/(tabs)/search', params: { sort: 'newest' } })
          }
        />
        {loadNew ? (
          <View style={styles.hScrollContent}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.hCard}>
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : newestProducts.length === 0 ? null : (
          <HorizontalProductScroll products={newestProducts} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  grid: {
    paddingHorizontal: spacing.lg - 4,
    paddingTop: spacing.sm,
  },
  gridItem: {
    flex: 1,
    marginBottom: spacing.md,
    marginHorizontal: 4,
  },
  hCard: {
    marginRight: 12,
    width: 160,
  },
  hScrollContent: {
    flexDirection: 'row',
    paddingBottom: 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  row: {
    gap: 0,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionNew: {
    marginTop: spacing.lg,
  },
  skeletonItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  viewAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
