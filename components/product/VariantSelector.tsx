import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProductVariant } from '@/types/product';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { formatINR } from '@/utils/currency';

interface VariantSelectorProps {
  variantType: string;          // e.g. "Diameter", "Size", "Color"
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
  basePrice?: number;           // base product price for delta comparison
}

export default function VariantSelector({
  variantType,
  variants,
  selectedVariant,
  onSelect,
  basePrice,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  const inStockCount = variants.filter((v) => v.inStock).length;

  // Determine if this product has color/size variants
  const hasColorOrSize = variants.some((v) => v.color || v.size);

  // Reference price for delta: first in-stock variant (or cheapest)
  const refPrice =
    basePrice ??
    variants
      .filter((v) => v.inStock)
      .sort((a, b) => a.storePrice - b.storePrice)[0]?.storePrice ??
    variants[0].storePrice;

  if (hasColorOrSize) {
    const colorsList = Array.from(new Set(variants.map((v) => v.color).filter(Boolean))) as string[];
    const sizesList = Array.from(new Set(variants.map((v) => v.size).filter(Boolean))) as string[];

    return (
      <View style={styles.container}>
        {/* Colors Selector */}
        {colorsList.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupLabel}>
              Select Color:
              {selectedVariant?.color ? (
                <Text style={styles.selectedLabel}> · {selectedVariant.color}</Text>
              ) : null}
            </Text>
            <View style={styles.swatchesRow}>
              {colorsList.map((colorVal) => {
                const isSelected = selectedVariant?.color === colorVal;
                // Check if color is hex
                const isHex = colorVal.startsWith('#');
                // Find matching variant. Prefer currently selected size.
                const matched = variants.find(
                  (v) => v.color === colorVal && (selectedVariant?.size ? v.size === selectedVariant.size : true)
                ) || variants.find((v) => v.color === colorVal);
                const isOOS = !matched || !matched.inStock;

                return (
                  <TouchableOpacity
                    key={colorVal}
                    activeOpacity={isOOS ? 0.9 : 0.7}
                    onPress={() => {
                      if (matched) onSelect(matched);
                    }}
                    style={[
                      styles.colorSwatchOuter,
                      isSelected && styles.colorSwatchOuterSelected,
                      isOOS && { opacity: 0.4 },
                    ]}
                  >
                    {isHex ? (
                      <View style={[styles.colorSwatchInner, { backgroundColor: colorVal }]} />
                    ) : (
                      <Text style={[styles.colorSwatchText, isSelected && styles.colorSwatchTextSelected]}>
                        {colorVal}
                      </Text>
                    )}
                    {isSelected && (
                      <View style={styles.colorCheckBadge}>
                        <Ionicons name="checkmark" size={10} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Sizes Selector */}
        {sizesList.length > 0 && (
          <View style={styles.groupSection}>
            <Text style={styles.groupLabel}>
              Select Size:
              {selectedVariant?.size ? (
                <Text style={styles.selectedLabel}> · {selectedVariant.size}</Text>
              ) : null}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillsRow}
              keyboardShouldPersistTaps="handled"
            >
              {sizesList.map((sizeVal) => {
                const isSelected = selectedVariant?.size === sizeVal;
                // Find matching variant. Prefer currently selected color.
                const matched = variants.find(
                  (v) => v.size === sizeVal && (selectedVariant?.color ? v.color === selectedVariant.color : true)
                ) || variants.find((v) => v.size === sizeVal);
                const isOOS = !matched || !matched.inStock;

                return (
                  <TouchableOpacity
                    key={sizeVal}
                    activeOpacity={isOOS ? 0.9 : 0.75}
                    onPress={() => {
                      if (matched) onSelect(matched);
                    }}
                    style={[
                      styles.pill,
                      isSelected && styles.pillSelected,
                      isOOS && styles.pillOOS,
                    ]}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected, isOOS && styles.pillTextOOS]}>
                      {sizeVal}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={10} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  // Fallback to single-axis variant selectors
  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="options-outline" size={16} color={colors.primary} />
          <Text style={styles.label}>
            {variantType}
            {selectedVariant ? (
              <Text style={styles.selectedLabel}> · {selectedVariant.label}</Text>
            ) : null}
          </Text>
        </View>
        <Text style={styles.availableText}>
          {inStockCount}/{variants.length} available
        </Text>
      </View>

      {/* Pill row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        keyboardShouldPersistTaps="handled"
      >
        {variants.map((variant) => {
          const isSelected = selectedVariant?._id === variant._id;
          const isOOS = !variant.inStock;

          // Compare against the cheapest in-stock reference (computed above)
          const diff = variant.storePrice - refPrice;
          const showDiff = Math.abs(diff) > 0 && !isSelected;

          return (
            <VariantPill
              key={variant._id}
              label={variant.label}
              isSelected={isSelected}
              isOOS={isOOS}
              priceDiff={showDiff ? diff : null}
              onPress={() => {
                if (!isOOS) onSelect(variant);
              }}
            />
          );
        })}
      </ScrollView>

      {/* Selected variant info bar */}
      {selectedVariant && (
        <View style={styles.infoBar}>
          <View style={styles.infoItem}>
            <Text style={styles.infoKey}>Price</Text>
            <Text style={styles.infoVal}>{formatINR(selectedVariant.storePrice)}</Text>
          </View>
          {selectedVariant.weightPerPiece && (
            <View style={[styles.infoItem, styles.infoItemBorder]}>
              <Text style={styles.infoKey}>Unit Weight</Text>
              <Text style={styles.infoVal}>{selectedVariant.weightPerPiece} kg</Text>
            </View>
          )}
          <View style={[styles.infoItem, styles.infoItemBorder]}>
            <Text style={styles.infoKey}>Stock</Text>
            <Text style={[styles.infoVal, !selectedVariant.inStock && { color: colors.error }]}>
              {selectedVariant.inStock
                ? `${selectedVariant.stockQty.toLocaleString()} pcs`
                : 'Out of Stock'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Individual pill ───────────────────────────────────────
interface PillProps {
  label: string;
  isSelected: boolean;
  isOOS: boolean;
  priceDiff: number | null;
  onPress: () => void;
}

function VariantPill({ label, isSelected, isOOS, priceDiff, onPress }: PillProps) {
  const [scale] = useState(() => new Animated.Value(1));

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={isOOS ? 1 : 0.75}
        style={[
          styles.pill,
          isSelected && styles.pillSelected,
          isOOS && styles.pillOOS,
        ]}
      >
        <Text
          style={[
            styles.pillText,
            isSelected && styles.pillTextSelected,
            isOOS && styles.pillTextOOS,
          ]}
        >
          {label}
        </Text>

        {/* Price delta badge */}
        {priceDiff !== null && !isOOS && (
          <View
            style={[
              styles.deltaBadge,
              priceDiff > 0 ? styles.deltaBadgeUp : styles.deltaBadgeDown,
            ]}
          >
            <Text
              style={[
                styles.deltaText,
                priceDiff > 0 ? styles.deltaTextUp : styles.deltaTextDown,
              ]}
            >
              {priceDiff > 0 ? '+' : ''}
              {formatINR(priceDiff)}
            </Text>
          </View>
        )}

        {/* OOS overlay stripe */}
        {isOOS && (
          <View style={styles.oosStripe} />
        )}

        {isSelected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={10} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  availableText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 7,
    height: 14,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 4,
    width: 14,
  },
  colorCheckBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 7,
    bottom: -4,
    height: 14,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    width: 14,
  },
  colorSwatchInner: {
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  colorSwatchOuter: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    width: 36,
  },
  colorSwatchOuterSelected: {
    borderColor: colors.primary,
  },
  colorSwatchText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  colorSwatchTextSelected: {
    color: colors.primary,
  },
  container: {
    gap: spacing.sm,
  },
  deltaBadge: {
    alignSelf: 'center',
    borderRadius: borderRadius.sm,
    marginTop: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  deltaBadgeDown: {
    backgroundColor: colors.successLight,
  },
  deltaBadgeUp: {
    backgroundColor: colors.errorLight,
  },
  deltaText: {
    fontSize: 9,
    fontWeight: '800',
  },
  deltaTextDown: {
    color: colors.success,
  },
  deltaTextUp: {
    color: colors.error,
  },
  groupLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  groupSection: {
    gap: 2,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  infoItemBorder: {
    borderLeftColor: colors.border,
    borderLeftWidth: 1,
  },
  infoKey: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoVal: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  oosStripe: {
    backgroundColor: colors.textMuted,
    height: 1.5,
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  pill: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    minWidth: 56,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  pillOOS: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.6,
  },
  pillSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextOOS: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  pillTextSelected: {
    color: colors.primary,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: spacing.md,
    paddingVertical: 2,
  },
  selectedLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  swatchesRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
});
