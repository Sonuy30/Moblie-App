import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useWishlistStore } from '@/stores/wishlistStore';
import WishlistModal from '@/components/wishlist/WishlistModal';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import type { WishlistItem } from '@/types/wishlist';

const CARD_W = 140;
const { width: SCREEN_W } = Dimensions.get('window');
const PLACEHOLDER =
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&auto=format&fit=crop&q=80';

export default function WishlistPreview() {
  const items = useWishlistStore((s) => s.items);
  const [modalVisible, setModalVisible] = useState(false);

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Your Saved Items</Text>
          <Ionicons name="heart" size={15} color={colors.error} />
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{items.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAll}>View All →</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll of Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item: WishlistItem) => (
          <TouchableOpacity
            key={item.productId}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/product/[id]',
                params: { id: item.product._id },
              })
            }
          >
            <Image
              source={{ uri: item.product.images?.[0] ?? PLACEHOLDER }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.price}>
                {formatINR(item.product.storePrice)}
              </Text>
              {item.product.mrp && item.product.mrp > item.product.storePrice && (
                <Text style={styles.mrp}>{formatINR(item.product.mrp)}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* See All Card */}
        <TouchableOpacity
          style={styles.seeAllCard}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.seeAllCircle}>
            <Ionicons name="heart" size={22} color={colors.error} />
          </View>
          <Text style={styles.seeAllText}>See All</Text>
          <Text style={styles.seeAllSubtext}>{items.length} items</Text>
        </TouchableOpacity>
      </ScrollView>

      <WishlistModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    width: CARD_W,
  },
  container: {
    marginTop: spacing.xl,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 999,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
  },
  countText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
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
    gap: 6,
  },
  image: {
    backgroundColor: colors.surface,
    height: CARD_W * 0.85,
    width: '100%',
  },
  info: {
    gap: 3,
    padding: spacing.sm,
  },
  mrp: {
    color: colors.textMuted,
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  name: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  price: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 4,
    paddingHorizontal: spacing.lg,
  },
  seeAllCard: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 6,
    height: CARD_W + 42,
    justifyContent: 'center',
    width: 90,
  },
  seeAllCircle: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  seeAllSubtext: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '600',
  },
  seeAllText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '800',
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
