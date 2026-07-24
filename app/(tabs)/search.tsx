import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import ProductCard from '@/components/product/ProductCard';
import type { StoreProduct } from '@/api/products';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import FilterBottomSheet from '@/components/search/FilterBottomSheet';
import { searchProducts } from '@/api/search';
import { useCategories } from '@/hooks/useProducts';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import type { SearchFilters } from '@/types/search';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
const FlashList = OriginalFlashList as any;

const RECENT_SEARCHES_KEY = 'aits_recent_searches_list';
const POPULAR_SEARCHES = ['TMT Bar', 'GI Pipe', 'Flat Bar', 'Binding Wire', 'MS Sheet'];

const QUICK_FILTER_CHIPS = [
  { label: '🔥 Deals',      query: 'sale',      color: '#FF6D00', bg: '#FFF3E0' },
  { label: '⭐ Top Rated',  query: 'top rated', color: '#1565C0', bg: '#E3F2FD' },
  { label: '✨ New Items',  query: 'new',       color: '#2E7D32', bg: '#E8F5E9' },
  { label: '💰 Under ₹500', query: 'under 500', color: '#6A1B9A', bg: '#F3E5F5' },
] as const;

const ProductCardMemo = React.memo(ProductCard);

function SearchScreen() {
  // ── Route params (from home chips / deal cards / banners) ──
  const params = useLocalSearchParams<{
    category?: string;
    query?: string;
    featured?: string;
    sort?: string;
    minDiscount?: string;
    minPrice?: string;
    maxPrice?: string;
  }>();

  const [searchQuery, setSearchQuery] = useState(() => {
    if (params.featured === 'true') return 'featured';
    if (params.category) return params.category;
    if (params.query) return params.query;
    return '';
  });
  const [debouncedQuery, setDebouncedQuery] = useState(() => {
    if (params.featured === 'true') return 'featured';
    if (params.category) return params.category;
    if (params.query) return params.query;
    return '';
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const [filters, setFilters] = useState<SearchFilters>(() => {
    const initialFilters: SearchFilters = {
      minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
      categories: params.category ? [params.category] : undefined,
      rating: undefined,
      sortBy: 'relevance',
    };
    if (params.sort === 'newest') initialFilters.sortBy = 'newest';
    if (params.sort === 'popular') initialFilters.sortBy = 'popularity';
    if (params.sort === 'price_asc') initialFilters.sortBy = 'price_asc';
    return initialFilters;
  });

  // ── Sync Route Params on Focus ────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const hasParams =
        params.category ||
        params.query ||
        params.featured ||
        params.sort ||
        params.minPrice ||
        params.maxPrice;

      if (hasParams) {
        let newQuery = '';
        if (params.featured === 'true') {
          newQuery = 'featured';
        } else if (params.category) {
          newQuery = params.category;
        } else if (params.query) {
          newQuery = params.query;
        }

        setSearchQuery(newQuery);
        setDebouncedQuery(newQuery);

        setFilters((prev) => {
          const updated: SearchFilters = {
            ...prev,
            minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
            maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
            categories: params.category ? [params.category] : undefined,
          };
          if (params.sort === 'newest') updated.sortBy = 'newest';
          else if (params.sort === 'popular') updated.sortBy = 'popularity';
          else if (params.sort === 'price_asc') updated.sortBy = 'price_asc';
          else updated.sortBy = 'relevance';
          return updated;
        });

        // Clear the params from the route so they don't get re-applied on subsequent focuses
        router.setParams({
          category: undefined,
          query: undefined,
          featured: undefined,
          sort: undefined,
          minPrice: undefined,
          maxPrice: undefined,
        });
      }
    }, [params])
  );

  const searchInputRef = useRef<TextInput>(null);
  const [focusAnim] = useState(() => new Animated.Value(0));

  // ── Debounce query ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Recent searches ───────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) setRecentSearches(JSON.parse(stored) as string[]);
      } catch (e) {
        console.warn('Failed to load recent searches', e);
      }
    };
    void load();
  }, []);

  const addRecentSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 8);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save recent search', e);
    }
  };

  const removeRecentSearch = async (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete recent search', e);
    }
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.warn('Failed to clear recent searches', e);
    }
  };

  // ── Filter active check ───────────────────────────────────
  const isFilterActive = useMemo(() => {
    const hasPrice = filters.minPrice !== undefined || filters.maxPrice !== undefined;
    const hasCategory = filters.categories && filters.categories.length > 0;
    const hasRating = filters.rating !== undefined;
    const hasSort = filters.sortBy !== undefined && filters.sortBy !== 'relevance';
    return !!(hasPrice || hasCategory || hasRating || hasSort);
  }, [filters]);

  // ── Search query (Always enabled for merged Explore Catalog) ──
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['search-products', debouncedQuery, filters],
    queryFn: ({ signal }) => searchProducts(debouncedQuery, filters, signal),
  });

  const productsList = data?.products || [];
  const totalResults = data?.total || 0;

  // ── Handlers ──────────────────────────────────────────────
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      void addRecentSearch(searchQuery.trim());
      Keyboard.dismiss();
    }
  };

  const handleChipPress = (term: string) => {
    setSearchQuery(term);
    setDebouncedQuery(term);
    void addRecentSearch(term);
    Keyboard.dismiss();
  };

  const handleApplyFilters = (newFilters: SearchFilters) => setFilters(newFilters);

  const handleClearFilters = () => {
    setFilters({
      minPrice: undefined,
      maxPrice: undefined,
      categories: undefined,
      rating: undefined,
      sortBy: 'relevance',
    });
  };

  const handleFocusInput = () =>
    Animated.timing(focusAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();

  const handleBlurInput = () =>
    Animated.timing(focusAnim, { toValue: 0, duration: 250, useNativeDriver: false }).start();

  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });
  const animatedElevation = focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 4] });

  const renderProductItem = useCallback(({ item }: { item: StoreProduct }) => (
    <View style={styles.gridItem}>
      <ProductCardMemo {...item} />
    </View>
  ), []);

  const renderHeader = () => {
    if (debouncedQuery.length > 0 || isFilterActive) {
      return (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCountText}>Found {totalResults} items</Text>
          {isFetching && <ActivityIndicator size="small" color={colors.primary} />}
          {isFilterActive && (
            <TouchableOpacity onPress={handleClearFilters} activeOpacity={0.7} style={styles.clearFiltersBadge}>
              <Text style={styles.clearFiltersBadgeText}>Clear Filters</Text>
              <Ionicons name="close-circle-sharp" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.exploreHeaderContainer}>
        {/* Browse header */}
        <View style={styles.browseHeader}>
          <Text style={styles.browseTitle}>Explore Catalog</Text>
          <Text style={styles.browseSubtitle}>Categories · Popular · Deals</Text>
        </View>

        {/* Quick filter chips */}
        <View style={styles.suggestionSection}>
          <Text style={styles.suggestionTitle}>Quick Filters</Text>
          <View style={styles.quickChipsRow}>
            {QUICK_FILTER_CHIPS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.75}
                onPress={() => handleChipPress(chip.query)}
                style={[styles.quickChip, { backgroundColor: chip.bg }]}
              >
                <Text style={[styles.quickChipText, { color: chip.color }]}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories grid */}
        {categories.length > 0 && (
          <View style={styles.suggestionSection}>
            <Text style={styles.suggestionTitle}>Browse Categories</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSearchQuery(cat.name);
                    setDebouncedQuery(cat.name);
                    setFilters((f) => ({ ...f, categories: [cat.name] }));
                  }}
                  style={styles.categoryChip}
                >
                  <Ionicons name={(cat.icon || 'grid-outline') as any} size={14} color={colors.primary} />
                  <Text style={styles.categoryChipText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <View style={styles.suggestionSection}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionTitle}>Recent Searches</Text>
              <TouchableOpacity onPress={() => { void clearAllRecent(); }} activeOpacity={0.7}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.historyList}>
              {recentSearches.map((term, idx) => (
                <View key={idx} style={styles.historyRow}>
                  <TouchableOpacity
                    style={styles.historyLeft}
                    onPress={() => handleChipPress(term)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.historyText}>{term}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { void removeRecentSearch(term); }}
                    style={styles.historyRemove}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Popular searches */}
        <View style={styles.suggestionSection}>
          <Text style={styles.suggestionTitle}>Popular Searches</Text>
          <View style={styles.popularContainer}>
            {POPULAR_SEARCHES.map((term, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleChipPress(term)}
                style={styles.popularChip}
              >
                <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                <Text style={styles.popularChipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section title for general grid */}
        <View style={styles.productsSectionHeader}>
          <Text style={styles.productsSectionTitle}>All Products</Text>
          <Text style={styles.productsSectionSubtitle}>Browse the complete catalog below</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="search-outline"
          title="No results found"
          subtitle={`We couldn't find matches for "${searchQuery || 'your filters'}"`}
          actionLabel={isFilterActive ? 'Clear Filters' : 'Try Another Search'}
          onAction={isFilterActive ? handleClearFilters : () => searchInputRef.current?.focus()}
        />
        
        {/* Recovery suggestions */}
        <View style={[styles.suggestionSection, styles.emptyRecoverySection]}>
          <Text style={styles.suggestionTitle}>You might be looking for</Text>
          <View style={styles.popularContainer}>
            {POPULAR_SEARCHES.map((term, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => handleChipPress(term)}
                style={styles.popularChip}
              >
                <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                <Text style={styles.popularChipText}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Search Bar Row ── */}
      <View style={styles.searchHeader}>
        <Animated.View
          style={[
            styles.searchContainer,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              borderColor: animatedBorderColor,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: focusAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.15] }),
              shadowRadius: 6,
              elevation: animatedElevation,
            },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search products, categories..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleFocusInput}
            onBlur={handleBlurInput}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setDebouncedQuery('');
                setFilters((f) => ({ ...f, categories: undefined }));
              }}
              style={styles.clearIconContainer}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
          activeOpacity={0.8}
          onPress={() => setIsFilterSheetVisible(true)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={isFilterActive ? colors.white : colors.primary}
          />
          {isFilterActive && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Active category tag */}
      {filters.categories && filters.categories.length > 0 && (
        <View style={styles.activeCategoryRow}>
          <View style={styles.activeCategoryTag}>
            <Ionicons name="pricetag-outline" size={12} color={colors.primary} />
            <Text style={styles.activeCategoryText}>{filters.categories.join(', ')}</Text>
            <TouchableOpacity
              onPress={() => {
                setFilters((f) => ({ ...f, categories: undefined }));
                setSearchQuery('');
                setDebouncedQuery('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <View key={idx} style={styles.gridItem}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>

      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Search Failed"
          subtitle="We couldn't load your search. Please check your connection."
          actionLabel="Retry"
          onAction={() => { void refetch(); }}
        />

      ) : (
        <View style={styles.resultsContainer}>
          <FlashList
            data={productsList}
            renderItem={renderProductItem}
            keyExtractor={(item: StoreProduct) => item._id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={220}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        filters={filters}
        onApply={handleApplyFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeCategoryRow: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  activeCategoryTag: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeCategoryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  browseHeader: {
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
  },
  browseSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  browseTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  categoryChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  clearAllText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  clearFiltersBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearFiltersBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  clearIconContainer: {
    justifyContent: 'center',
    padding: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  emptyRecoverySection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  exploreHeaderContainer: {
    paddingHorizontal: spacing.sm,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterDot: {
    backgroundColor: colors.warning,
    borderRadius: 999,
    height: 8,
    position: 'absolute',
    right: 4,
    top: 4,
    width: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  gridItem: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    width: '50%',
  },
  historyLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    height: '100%',
  },
  historyList: {
    marginTop: spacing.sm,
  },
  historyRemove: {
    justifyContent: 'center',
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
  },
  historyRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
  },
  historyText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing['4xl'],
    paddingHorizontal: spacing.xs,
  },
  popularChip: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  popularChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  popularContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  productsSectionHeader: {
    marginTop: spacing.lg,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  productsSectionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  productsSectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  quickChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  resultsCountText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: spacing.md,
  },
  searchHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    height: '100%',
  },
  suggestionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionSection: {
    paddingVertical: spacing.sm,
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default withErrorBoundary(SearchScreen);
