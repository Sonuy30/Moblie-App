import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function RecentlyViewed() {
  const items = useRecentlyViewedStore((s) => s.items);

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={styles.title}>Recently Viewed</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.7}
          accessibilityLabel="Browse all products"
          accessibilityRole="button"
        >
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item._id}
            style={styles.card}
            onPress={() => router.push(`/product/${item._id}`)}
            activeOpacity={0.85}
            accessibilityLabel={`View ${item.name}`}
            accessibilityRole="button"
          >
            {/* Product Image */}
            <View style={styles.imageWrapper}>
              <Image
                source={{
                  uri:
                    item.image ||
                    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=200&auto=format&fit=crop&q=80',
                }}
                style={styles.image}
                contentFit="cover"
                transition={200}
              />
              {!item.inStock && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockText}>Out of{'\n'}Stock</Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.price}>
                {formatINR(item.storePrice)}
                <Text style={styles.unit}> /{item.unit || 'pcs'}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 140;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    elevation: 2,
    marginRight: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    width: CARD_WIDTH,
  },
  container: {
    marginTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  image: {
    height: 120,
    width: CARD_WIDTH,
  },
  imageWrapper: {
    position: 'relative',
  },
  info: {
    gap: 4,
    padding: spacing.sm,
  },
  name: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  outOfStockOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  outOfStockText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  price: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
  },
});
