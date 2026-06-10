import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { useCategories } from '@/hooks/useProducts';
import type { SearchFilters, SortOption } from '@/types/search';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApply: (newFilters: SearchFilters) => void;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest Arrivals', value: 'newest' },
  { label: 'Popularity', value: 'popularity' },
];

const RATING_OPTIONS = [
  { label: '3.0+ ★', value: 3 },
  { label: '4.0+ ★', value: 4 },
  { label: '4.5+ ★', value: 4.5 },
];

const QUICK_PRICE_PRESETS = [
  { label: 'Under ₹1,000', min: 0, max: 1000 },
  { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
  { label: '₹5,000 - ₹15,000', min: 5000, max: 15000 },
  { label: '₹15,000+', min: 15000, max: 100000 },
];

export default function FilterBottomSheet({
  visible,
  onClose,
  filters,
  onApply,
}: FilterBottomSheetProps) {
  // Local state reflecting current edits before Apply
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Load category list using existing TanStack Query hook
  const { data: categories = [] } = useCategories();

  // Animation values
  const [slideAnim] = useState(() => new Animated.Value(SCREEN_HEIGHT));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  // Sync state when filters prop changes or modal opens
  useEffect(() => {
    if (visible) {
      setMinPrice(filters.minPrice !== undefined ? String(filters.minPrice) : '');
      setMaxPrice(filters.maxPrice !== undefined ? String(filters.maxPrice) : '');
      setSelectedCategories(filters.categories || []);
      setSelectedRating(filters.rating);
      setSortBy(filters.sortBy || 'relevance');

      // Animate In
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, filters]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const handleClose = () => {
    // Animate Out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleApply = () => {
    const parsedMin = minPrice ? parseFloat(minPrice) : undefined;
    const parsedMax = maxPrice ? parseFloat(maxPrice) : undefined;

    onApply({
      minPrice: parsedMin !== undefined && !isNaN(parsedMin) ? parsedMin : undefined,
      maxPrice: parsedMax !== undefined && !isNaN(parsedMax) ? parsedMax : undefined,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      rating: selectedRating,
      sortBy: sortBy === 'relevance' ? undefined : sortBy,
    });
    handleClose();
  };

  const handleReset = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategories([]);
    setSelectedRating(undefined);
    setSortBy('relevance');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const selectQuickPrice = (minVal: number, maxVal: number) => {
    setMinPrice(String(minVal));
    setMaxPrice(String(maxVal));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Backdrop Tap Target */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropButton} activeOpacity={1} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filter Products</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Filters */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Category Filter */}
              {categories.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Categories</Text>
                  <View style={styles.chipsContainer}>
                    {categories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          activeOpacity={0.7}
                          onPress={() => toggleCategory(cat)}
                          style={[styles.chip, isSelected && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                            {cat}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Price Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Price Range (INR)</Text>
                
                {/* TextInputs Row */}
                <View style={styles.priceRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Min"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={minPrice}
                      onChangeText={setMinPrice}
                    />
                  </View>
                  <View style={styles.priceDivider} />
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputPrefix}>₹</Text>
                    <TextInput
                      style={styles.priceInput}
                      placeholder="Max"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                    />
                  </View>
                </View>

                {/* Quick select buttons */}
                <View style={[styles.chipsContainer, styles.presetContainer]}>
                  {QUICK_PRICE_PRESETS.map((preset, i) => (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.7}
                      style={styles.pricePresetChip}
                      onPress={() => selectQuickPrice(preset.min, preset.max)}
                    >
                      <Text style={styles.pricePresetText}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Rating Filter */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Minimum Rating</Text>
                <View style={styles.chipsContainer}>
                  {RATING_OPTIONS.map((opt) => {
                    const isSelected = selectedRating === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.7}
                        onPress={() => setSelectedRating(isSelected ? undefined : opt.value)}
                        style={[styles.chip, isSelected && styles.chipActive]}
                      >
                        <Ionicons
                          name="star"
                          size={14}
                          color={isSelected ? colors.primary : colors.star}
                          style={styles.starIcon}
                        />
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Sort By Filter */}
              <View style={[styles.section, styles.sectionLast]}>
                <Text style={styles.sectionTitle}>Sort By</Text>
                <View style={styles.sortContainer}>
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = sortBy === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        activeOpacity={0.7}
                        onPress={() => setSortBy(opt.value)}
                        style={[styles.sortTile, isSelected && styles.sortTileActive]}
                      >
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                        <Text style={[styles.sortLabel, isSelected && styles.sortLabelActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer buttons */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={handleReset}
                style={styles.resetButton}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApply}
                style={styles.applyButton}
                activeOpacity={0.8}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    flex: 1.5,
    height: 48,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  backdrop: {
    backgroundColor: colors.black,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  backdropButton: {
    height: '100%',
    width: '100%',
  },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  footer: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: spacing.md,
  },
  inputPrefix: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  presetContainer: {
    marginTop: 12,
  },
  priceDivider: {
    backgroundColor: colors.border,
    height: 1,
    width: 12,
  },
  priceInput: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  pricePresetChip: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pricePresetText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  radioInner: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: colors.textMuted,
    borderRadius: 999,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  resetButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 48,
    justifyContent: 'center',
  },
  resetButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  section: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  sectionLast: {
    borderBottomWidth: 0,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.82,
    width: '100%',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sortLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  sortTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '48%',
  },
  sortTileActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  starIcon: {
    marginRight: 2,
  },
});
