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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import ProductCard from '@/components/product/ProductCard';
import type { StoreProduct } from '@/api/products';
import { ProductCardSkeleton } from '@/components/skeletons/ProductCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import FilterBottomSheet from '@/components/search/FilterBottomSheet';
import { searchProducts } from '@/api/search';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import type { SearchFilters } from '@/types/search';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlashList = OriginalFlashList as any;

const RECENT_SEARCHES_KEY = 'aits_recent_searches_list';
const POPULAR_SEARCHES = ['TMT Bar', 'GI Pipe', 'Flat Bar', 'Binding Wire', 'MS Sheet'];

// Memoized product card wrapper to optimize list scrolling performance
const ProductCardMemo = React.memo(ProductCard);

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    minPrice: undefined,
    maxPrice: undefined,
    categories: undefined,
    rating: undefined,
    sortBy: 'relevance',
  });

  const searchInputRef = useRef<TextInput>(null);

  // Focus borders animation
  const [focusAnim] = useState(() => new Animated.Value(0));

  // Debounce search query changes (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Focus automatically on mount
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(focusTimer);
  }, []);

  // Fetch recent searches from AsyncStorage
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored) as string[]);
        }
      } catch (e) {
        console.warn('Failed to load recent searches', e);
      }
    };
    void loadRecent();
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

  // Check if any filters are currently active (ignoring relevance sort)
  const isFilterActive = useMemo(() => {
    const hasPrice = filters.minPrice !== undefined || filters.maxPrice !== undefined;
    const hasCategory = filters.categories && filters.categories.length > 0;
    const hasRating = filters.rating !== undefined;
    const hasSort = filters.sortBy !== undefined && filters.sortBy !== 'relevance';
    return !!(hasPrice || hasCategory || hasRating || hasSort);
  }, [filters]);

  // Determine whether to run query
  const isQueryEnabled = useMemo(() => {
    return debouncedQuery.length > 0 || isFilterActive;
  }, [debouncedQuery, isFilterActive]);

  // Query search products with TanStack Query
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['search-products', debouncedQuery, filters],
    queryFn: ({ signal }) => searchProducts(debouncedQuery, filters, signal),
    enabled: isQueryEnabled,
  });

  const productsList = data?.products || [];
  const totalResults = data?.total || 0;

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      void addRecentSearch(searchQuery.trim());
      Keyboard.dismiss();
    }
  };

  const handleRecentPress = (term: string) => {
    setSearchQuery(term);
    void addRecentSearch(term);
    Keyboard.dismiss();
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      minPrice: undefined,
      maxPrice: undefined,
      categories: undefined,
      rating: undefined,
      sortBy: 'relevance',
    });
  };

  const handleFocusInput = () => {
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const handleBlurInput = () => {
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  // Input background / border animation style interpolations
  const animatedBorderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const animatedElevation = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  const renderProductItem = useCallback(({ item }: { item: StoreProduct }) => {
    return (
      <View style={styles.gridItem}>
        <ProductCardMemo {...item} />
      </View>
    );
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Bar Block */}
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
            placeholder="Search products, materials..."
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
              onPress={() => setSearchQuery('')}
              style={styles.clearIconContainer}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Filter Trigger Button */}
        <TouchableOpacity
          style={[styles.filterButton, isFilterActive && styles.filterButtonActive]}
          activeOpacity={0.8}
          onPress={() => setIsFilterSheetVisible(true)}
        >
          <Ionicons
            name="funnel-outline"
            size={20}
            color={isFilterActive ? colors.white : colors.primary}
          />
          {isFilterActive && <View style={styles.filterDot} />}
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      {!isQueryEnabled ? (
        // Empty State: Recent & Popular Searches
        <ScrollView style={styles.suggestionContainer} keyboardShouldPersistTaps="handled">
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
                      onPress={() => handleRecentPress(term)}
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

          <View style={[styles.suggestionSection, { marginTop: spacing.md }]}>
            <Text style={styles.suggestionTitle}>Popular Searches</Text>
            <View style={styles.popularContainer}>
              {POPULAR_SEARCHES.map((term, idx) => (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleRecentPress(term)}
                  style={styles.popularChip}
                >
                  <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
                  <Text style={styles.popularChipText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : isLoading ? (
        // Loading skeleton list
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <View key={idx} style={styles.gridItem}>
              <ProductCardSkeleton />
            </View>
          ))}
        </View>
      ) : isError ? (
        // Error state
        <EmptyState
          icon="alert-circle-outline"
          title="Search Failed"
          subtitle="We couldn't load your search. Please check your connection."
          actionLabel="Retry"
          onAction={() => { void refetch(); }}
        />
      ) : productsList.length === 0 ? (
        // Empty results state
        <EmptyState
          icon="search-outline"
          title="No results found"
          subtitle={`We couldn't find matches for "${searchQuery || 'your filters'}"`}
          actionLabel={isFilterActive ? 'Clear Filters' : 'Try Another Search'}
          onAction={isFilterActive ? handleClearFilters : () => searchInputRef.current?.focus()}
        />
      ) : (
        // Results grid
        <View style={styles.resultsContainer}>
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

          <FlashList
            data={productsList}
            renderItem={renderProductItem}
            keyExtractor={(item: StoreProduct) => item._id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={220}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Filter Bottom Sheet Modal */}
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
  suggestionContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
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
    fontSize: 15,
    fontWeight: '700',
  },
});
