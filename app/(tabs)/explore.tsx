import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import { useInfiniteProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import ProductCardWide from '@/components/product/ProductCardWide';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { type ProductFilters } from '@/api/products';

const FlashList = OriginalFlashList as any;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SORT_OPTIONS = [
  { label: 'Relevance', value: undefined },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest', value: 'newest' },
  { label: 'Top Rated', value: 'popular' },
] as const;

const FILTER_CHIPS = [
  { label: 'All', filter: {} },
  { label: 'Under ₹500', filter: { maxPrice: 500 } },
  { label: 'Under ₹2000', filter: { maxPrice: 2000 } },
  { label: 'Top Rated', filter: { sort: 'popular' as const } },
] as const;

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ search?: string; category?: string; featured?: string; sort?: string }>();
  const [search, setSearch] = useState(params.search || '');
  const [activeChip, setActiveChip] = useState(0);
  const [sortIndex, setSortIndex] = useState(0);
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleChipSelect = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveChip(index);
  };

  const handleViewToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const filters: Omit<ProductFilters, 'page'> = {
    ...FILTER_CHIPS[activeChip]?.filter,
    search: search || undefined,
    category: params.category || undefined,
    featured: params.featured === 'true' ? true : undefined,
    sort: SORT_OPTIONS[sortIndex].value,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } = useInfiniteProducts(filters);

  const allProducts = data?.pages.flatMap((p) => p.products) || [];
  const total = data?.pages[0]?.total || 0;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Bar Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search structural steel, plates..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Horizontal Row */}
      <View style={styles.chipRow}>
        {FILTER_CHIPS.map((chip, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.chip, activeChip === i && styles.chipActive]}
            onPress={() => handleChipSelect(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, activeChip === i && styles.chipTextActive]}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Controls Row (Result count, Sort triggers, View toggle) */}
      <View style={styles.controlRow}>
        <Text style={styles.resultCount}>{total} products</Text>
        <View style={styles.controlRight}>
          <TouchableOpacity onPress={() => setShowSort(!showSort)} style={styles.sortBtn} activeOpacity={0.7}>
            <Text style={styles.sortText}>{SORT_OPTIONS[sortIndex].label}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleViewToggle} style={styles.viewBtn} activeOpacity={0.7}>
            <Ionicons name={viewMode === 'grid' ? 'list-outline' : 'grid-outline'} size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Dropdown Popup */}
      {showSort && (
        <View style={styles.sortDropdown}>
          {SORT_OPTIONS.map((opt, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.sortOption, sortIndex === i && styles.sortOptionActive]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSortIndex(i);
                setShowSort(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortOptionText, sortIndex === i && styles.sortOptionTextActive]}>{opt.label}</Text>
              {sortIndex === i && <Ionicons name="checkmark" size={18} color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Product List Content */}
      {isLoading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.gridItem}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Something went wrong"
          subtitle="Please check your connection and retry"
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : allProducts.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No products found"
          subtitle="Try search for structural beams, plates, or TMT bars"
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setActiveChip(0);
          }}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <FlashList
            key={viewMode}
            data={allProducts}
            numColumns={viewMode === 'grid' ? 2 : 1}
            contentContainerStyle={{ paddingHorizontal: spacing.sm, paddingBottom: 100 }}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item }: { item: any }) =>
              viewMode === 'grid' ? (
                <View style={{ flex: 1, padding: spacing.xs }}>
                  <ProductCard {...item} />
                </View>
              ) : (
                <View style={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.xs }}>
                  <ProductCardWide {...item} />
                </View>
              )
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.grid}>
                  {[1, 2].map((i) => (
                    <View key={i} style={styles.gridItem}>
                      <ProductCardSkeleton />
                    </View>
                  ))}
                </View>
              ) : null
            }
            estimatedItemSize={200}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  controlRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  gridItem: {
    marginBottom: spacing.lg,
    width: '48%',
  },
  resultCount: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
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
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  searchRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sortBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sortDropdown: {
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    elevation: 8,
    padding: 8,
    position: 'absolute',
    right: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    top: 144,
    width: 200,
    zIndex: 100,
  },
  sortOption: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortOptionActive: {
    backgroundColor: colors.primaryLight,
  },
  sortOptionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sortText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  viewBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
