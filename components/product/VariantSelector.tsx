/**
 * VariantSelector — Amazon-style variant picker
 *
 * Groups variants by attribute key (e.g. "Size", "Color", "Grade").
 * Each attribute axis gets its own labelled row of chips/swatches.
 * Tapping a chip updates price, image and stock in real time.
 *
 * Works with ANY attribute structure the ERP sends:
 *  - Single attribute  { "Size": "10mm" }
 *  - Multi-attribute   { "Color": "Red", "Size": "Large" }
 *  - Flat label only   variants with no attributes (uses variant.label)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import type { ProductVariant } from '@/types/product';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { formatINR } from '@/utils/currency';

// ── Named CSS colors that should render as swatches ─────────────────────────
const KNOWN_COLORS = new Set([
  'red','green','blue','yellow','orange','purple','pink','black','white',
  'grey','gray','brown','cyan','magenta','gold','silver','navy','teal',
  'maroon','olive','lime','indigo','violet','beige','cream','ivory',
  'khaki','lavender','salmon','coral','crimson','aqua','turquoise',
]);

function isColorValue(val: string): boolean {
  if (!val) return false;
  const lower = val.toLowerCase().trim();
  return lower.startsWith('#') || KNOWN_COLORS.has(lower);
}

function colorToHex(val: string): string {
  if (val.startsWith('#')) return val;
  // Map common color names → hex
  const map: Record<string, string> = {
    red: '#E53935', green: '#43A047', blue: '#1E88E5',
    yellow: '#FDD835', orange: '#FB8C00', purple: '#8E24AA',
    pink: '#E91E63', black: '#212121', white: '#FAFAFA',
    grey: '#9E9E9E', gray: '#9E9E9E', brown: '#6D4C41',
    cyan: '#00ACC1', magenta: '#D81B60', gold: '#FFB300',
    silver: '#BDBDBD', navy: '#1A237E', teal: '#00796B',
    maroon: '#880E4F', olive: '#827717', lime: '#AEEA00',
    indigo: '#3949AB', violet: '#7B1FA2', beige: '#F5F5DC',
    cream: '#FFFDD0', ivory: '#FFFFF0', khaki: '#C8B560',
    lavender: '#E6E6FA', salmon: '#FA8072', coral: '#FF6B6B',
    crimson: '#DC143C', aqua: '#00FFFF', turquoise: '#40E0D0',
  };
  return map[val.toLowerCase()] || '#9E9E9E';
}

// ── Types ────────────────────────────────────────────────────────────────────

interface VariantSelectorProps {
  variantType: string;
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
  basePrice?: number;
}

// For each attribute key, the values it takes across all variants
type AttrGroup = {
  key: string;
  values: string[];
  isColor: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse variant attributes into a plain object.
 * Handles: Map, plain object, or missing attributes (falls back to {label: variant.label}).
 */
function getAttrs(v: ProductVariant): Record<string, string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (v as any).attributes;
  if (!raw) return { Variant: v.label || 'Default' };
  if (raw instanceof Map) return Object.fromEntries(raw);
  if (typeof raw === 'object') return raw as Record<string, string>;
  return { Variant: v.label || 'Default' };
}

/** Build grouped attribute axes from the full variants array */
function buildAttrGroups(variants: ProductVariant[]): AttrGroup[] {
  const keyOrder: string[] = [];
  const keyValues: Record<string, Set<string>> = {};

  variants.forEach((v) => {
    const attrs = getAttrs(v);
    Object.entries(attrs).forEach(([k, val]) => {
      if (!keyValues[k]) {
        keyValues[k] = new Set();
        keyOrder.push(k);
      }
      keyValues[k].add(val);
    });
  });

  return keyOrder.map((k) => {
    const values = Array.from(keyValues[k]);
    const isColor = values.some(isColorValue);
    return { key: k, values, isColor };
  });
}

/**
 * Find the best matching variant given the current selection map.
 * If we change one axis, keep other axes the same where possible.
 */
function findVariant(
  variants: ProductVariant[],
  currentAttrs: Record<string, string>,
  changedKey: string,
  changedVal: string
): ProductVariant | null {
  const target = { ...currentAttrs, [changedKey]: changedVal };

  // Perfect match (all keys match)
  const perfect = variants.find((v) => {
    const a = getAttrs(v);
    return Object.entries(target).every(([k, val]) => a[k] === val);
  });
  if (perfect) return perfect;

  // Partial match — only the changed key must match
  const partial = variants.find((v) => {
    const a = getAttrs(v);
    return a[changedKey] === changedVal;
  });
  return partial ?? null;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function VariantSelector({
  variantType,
  variants,
  selectedVariant,
  onSelect,
  basePrice,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  const attrGroups = buildAttrGroups(variants);
  const selectedAttrs = selectedVariant ? getAttrs(selectedVariant) : {};

  // Reference price for delta display — use base product price or cheapest variant
  const refPrice =
    basePrice ??
    [...variants].sort((a, b) => a.storePrice - b.storePrice)[0]?.storePrice ??
    0;

  const handleChipPress = (groupKey: string, value: string) => {
    const next = findVariant(variants, selectedAttrs, groupKey, value);
    if (next) onSelect(next);
  };

  // If no meaningful attribute keys, fall back to flat list using label
  const isFlatList = attrGroups.length === 0 ||
    (attrGroups.length === 1 && attrGroups[0].key === 'Variant');

  return (
    <View style={styles.container}>
      {isFlatList ? (
        // ── Flat variant list (label-only) ──────────────────────────────
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{variantType}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {variants.map((v) => {
              const isSelected = selectedVariant?._id === v._id;
              const isOOS = !v.inStock;
              const diff = v.storePrice - refPrice;
              return (
                <PillChip
                  key={v._id}
                  label={v.label}
                  priceDiff={diff !== 0 ? diff : null}
                  isSelected={isSelected}
                  isOOS={isOOS}
                  onPress={() => { if (!isOOS) onSelect(v); }}
                />
              );
            })}
          </ScrollView>
        </View>
      ) : (
        // ── Grouped attribute axes (Amazon-style) ───────────────────────
        attrGroups.map((group) => {
          const selectedVal = selectedAttrs[group.key];

          return (
            <View key={group.key} style={styles.group}>
              {/* Row label — e.g. "Color: Red" or "Size:" */}
              <View style={styles.groupLabelRow}>
                <Text style={styles.groupLabel}>{group.key}</Text>
                {selectedVal ? (
                  <Text style={styles.groupSelected}> · {selectedVal}</Text>
                ) : null}
              </View>

              {group.isColor ? (
                // ── Color swatches ──────────────────────────────────────
                <View style={styles.swatchesRow}>
                  {group.values.map((val) => {
                    const matchedVariant = variants.find(
                      (v) => getAttrs(v)[group.key] === val
                    );
                    const isSelected = selectedVal === val;
                    const isOOS = !matchedVariant || !matchedVariant.inStock;
                    const hex = colorToHex(val);
                    return (
                      <ColorSwatch
                        key={val}
                        colorName={val}
                        hex={hex}
                        isSelected={isSelected}
                        isOOS={isOOS}
                        onPress={() => handleChipPress(group.key, val)}
                      />
                    );
                  })}
                </View>
              ) : (
                // ── Text pill chips ─────────────────────────────────────
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {group.values.map((val) => {
                    // Find best matching variant for price delta
                    const matchedVariant = findVariant(
                      variants,
                      selectedAttrs,
                      group.key,
                      val
                    );
                    const isSelected = selectedVal === val;
                    const isOOS = !matchedVariant || !matchedVariant.inStock;
                    const diff = matchedVariant
                      ? matchedVariant.storePrice - refPrice
                      : null;

                    return (
                      <PillChip
                        key={val}
                        label={val}
                        priceDiff={diff !== 0 ? diff ?? null : null}
                        isSelected={isSelected}
                        isOOS={isOOS}
                        onPress={() => handleChipPress(group.key, val)}
                      />
                    );
                  })}
                </ScrollView>
              )}
            </View>
          );
        })
      )}

      {/* Selected variant summary bar */}
      {selectedVariant && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Price</Text>
            <Text style={styles.summaryValue}>{formatINR(selectedVariant.storePrice)}</Text>
          </View>
          {selectedVariant.weightPerPiece ? (
            <View style={[styles.summaryItem, styles.summaryBorder]}>
              <Text style={styles.summaryLabel}>Unit Wt.</Text>
              <Text style={styles.summaryValue}>{selectedVariant.weightPerPiece} kg</Text>
            </View>
          ) : null}
          <View style={[styles.summaryItem, styles.summaryBorder]}>
            <Text style={styles.summaryLabel}>Stock</Text>
            <Text
              style={[
                styles.summaryValue,
                !selectedVariant.inStock && { color: colors.error },
              ]}
            >
              {selectedVariant.inStock
                ? `${selectedVariant.stockQty} pcs`
                : 'Out of Stock'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── PillChip ─────────────────────────────────────────────────────────────────

interface PillChipProps {
  label: string;
  priceDiff: number | null;
  isSelected: boolean;
  isOOS: boolean;
  onPress: () => void;
}

function PillChip({ label, priceDiff, isSelected, isOOS, onPress }: PillChipProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (isOOS) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={isOOS ? 1 : 0.75}
        style={[
          styles.chip,
          isSelected && styles.chipSelected,
          isOOS && styles.chipOOS,
        ]}
      >
        <Text
          style={[
            styles.chipLabel,
            isSelected && styles.chipLabelSelected,
            isOOS && styles.chipLabelOOS,
          ]}
        >
          {label}
        </Text>

        {/* Price delta — e.g. "+₹120" or "–₹50" */}
        {priceDiff !== null && !isOOS && (
          <Text
            style={[
              styles.chipDelta,
              isSelected && styles.chipDeltaSelected,
            ]}
          >
            {priceDiff > 0 ? `+${formatINR(priceDiff)}` : formatINR(priceDiff)}
          </Text>
        )}

        {/* OOS diagonal strike */}
        {isOOS && <View style={styles.oosStrike} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── ColorSwatch ───────────────────────────────────────────────────────────────

interface ColorSwatchProps {
  colorName: string;
  hex: string;
  isSelected: boolean;
  isOOS: boolean;
  onPress: () => void;
}

function ColorSwatch({ colorName, hex, isSelected, isOOS, onPress }: ColorSwatchProps) {
  const isDark = hex === '#212121' || hex === '#1A237E' || hex === '#880E4F';
  return (
    <TouchableOpacity
      onPress={() => { if (!isOOS) onPress(); }}
      activeOpacity={isOOS ? 1 : 0.75}
      style={[
        styles.swatch,
        isSelected && styles.swatchSelected,
        isOOS && { opacity: 0.35 },
      ]}
    >
      {/* Color circle */}
      <View
        style={[
          styles.swatchCircle,
          { backgroundColor: hex },
          hex === '#FAFAFA' && styles.swatchCircleWhiteBorder,
        ]}
      />
      {/* Name below swatch */}
      <Text
        style={[
          styles.swatchName,
          isSelected && styles.swatchNameSelected,
        ]}
        numberOfLines={1}
      >
        {colorName}
      </Text>
      {/* Selected ring */}
      {isSelected && <View style={styles.swatchRing} />}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    minWidth: 60,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'relative',
  },
  chipDelta: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  chipDeltaSelected: {
    color: colors.primary,
  },
  chipLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  chipLabelOOS: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  chipLabelSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  chipOOS: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    opacity: 0.55,
  },
  chipSelected: {
    backgroundColor: '#EBF3FF',
    borderColor: colors.primary,
    borderWidth: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    paddingBottom: 2,
    paddingRight: spacing.md,
    paddingTop: 2,
  },
  container: {
    gap: 18,
  },
  group: {
    gap: 10,
  },
  groupLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  groupLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  groupSelected: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  oosStrike: {
    backgroundColor: colors.textMuted,
    height: 1.5,
    left: 0,
    opacity: 0.6,
    position: 'absolute',
    right: 0,
    top: '50%',
  },
  summaryBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: 4,
    overflow: 'hidden',
  },
  summaryBorder: {
    borderLeftColor: colors.border,
    borderLeftWidth: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    paddingVertical: 10,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  swatch: {
    alignItems: 'center',
    gap: 5,
    padding: 4,
    position: 'relative',
    width: 56,
  },
  swatchCircle: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  swatchCircleWhiteBorder: {
    borderColor: colors.border,
    borderWidth: 1,
  },
  swatchName: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  swatchNameSelected: {
    color: colors.primary,
    fontWeight: '800',
  },
  swatchRing: {
    borderColor: colors.primary,
    borderRadius: 26,
    borderWidth: 2.5,
    bottom: 22,
    height: 52,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 4,
    width: 52,
    alignSelf: 'center',
  },
  swatchSelected: {
    // outer highlight handled by swatchRing
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 2,
  },
});
