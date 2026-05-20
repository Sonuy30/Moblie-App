import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProducts, useCategories } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import ProductCard from '@/components/product/ProductCard';
import ProductCardWide from '@/components/product/ProductCardWide';
import HeroBanner from '@/components/home/HeroBanner';
import CategoryRow from '@/components/home/CategoryRow';
import SectionHeader from '@/components/home/SectionHeader';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

export default function HomeScreen() {
  const totalItems = useCartStore((s) => s.totalItems());
  const { data: categories } = useCategories();
  const { data: featured, isLoading: loadFeat, refetch: refetchFeat } = useProducts({ featured: true, limit: 10 });
  const { data: newest, isLoading: loadNew, refetch: refetchNew } = useProducts({ sort: 'newest', limit: 10 });
  const { data: popular, isLoading: loadPop, refetch: refetchPop } = useProducts({ sort: 'popular', limit: 8 });

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFeat(), refetchNew(), refetchPop()]);
    setRefreshing(false);
  };

  const featuredProducts = featured?.products || [];
  const newestProducts = newest?.products || [];
  const popularProducts = popular?.products || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>AITS</Text>
          <Text style={styles.logoSub}>SHOP</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(customer)/cart')}>
            <Ionicons name="cart-outline" size={22} color={colors.text} />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/search' as any)} activeOpacity={0.7}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>Search for products...</Text>
        </TouchableOpacity>

        {/* Hero */}
        <HeroBanner />

        {/* Categories */}
        {categories && categories.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Categories" />
            <CategoryRow categories={categories} />
          </View>
        )}

        {/* Featured */}
        <View style={styles.section}>
          <SectionHeader title="Featured" onSeeAll={() => router.push({ pathname: '/(customer)/explore', params: { featured: 'true' } } as any)} />
          {loadFeat ? (
            <FlatList data={[1,2,3]} horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList} keyExtractor={(i) => i.toString()}
              renderItem={() => <View style={{ width: 320, marginRight: 12 }}><ProductCardSkeleton /></View>}
            />
          ) : (
            <FlatList data={featuredProducts} horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList} keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={{ width: 320, marginRight: 12 }}>
                  <ProductCardWide {...item} />
                </View>
              )}
            />
          )}
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <SectionHeader title="New Arrivals" onSeeAll={() => router.push({ pathname: '/(customer)/explore', params: { sort: 'newest' } } as any)} />
          {loadNew ? (
            <FlatList data={[1,2,3]} horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList} keyExtractor={(i) => i.toString()}
              renderItem={() => <View style={{ width: 170, marginRight: 12 }}><ProductCardSkeleton /></View>}
            />
          ) : (
            <FlatList data={newestProducts} horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList} keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={{ width: 170, marginRight: 12 }}>
                  <ProductCard {...item} />
                </View>
              )}
            />
          )}
        </View>

        {/* Best Sellers */}
        <View style={styles.section}>
          <SectionHeader title="Best Sellers" />
          {loadPop ? (
            <View style={styles.grid}>
              {[1,2,3,4].map((i) => <View key={i} style={styles.gridItem}><ProductCardSkeleton /></View>)}
            </View>
          ) : (
            <View style={styles.grid}>
              {popularProducts.map((item) => (
                <View key={item._id} style={styles.gridItem}>
                  <ProductCard {...item} />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  logo: { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: 2 },
  logoSub: { fontSize: 10, fontWeight: '600', color: colors.textMuted, letterSpacing: 4, marginTop: -2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: colors.error, borderRadius: 99, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: 12, paddingHorizontal: spacing.lg, height: 48, gap: 10 },
  searchPlaceholder: { fontSize: 14, color: colors.textMuted },
  section: { marginTop: spacing['2xl'] },
  hList: { paddingHorizontal: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: spacing.lg },
});
