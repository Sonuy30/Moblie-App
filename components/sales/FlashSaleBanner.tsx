import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getActiveSale, getSaleProducts } from '@/api/sales';
import CountdownTimer from './CountdownTimer';
import SaleBadge from './SaleBadge';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';


export default function FlashSaleBanner() {
  // Query active sale
  const { data: activeSale, isLoading: loadingSale } = useQuery({
    queryKey: ['active-sale'],
    queryFn: getActiveSale,
    refetchInterval: 30000, // Refresh every 30 seconds to stay updated
  });

  // Query sale products
  const { data: saleProducts, isLoading: loadingProducts } = useQuery({
    queryKey: ['sale-products', activeSale?._id],
    queryFn: () => getSaleProducts(activeSale?._id || ''),
    enabled: !!activeSale?._id,
  });

  if (loadingSale || !activeSale) return null;

  const products = saleProducts || [];

  const handleBannerPress = () => {
    router.push('/(tabs)/sale');
  };

  return (
    <LinearGradient
      colors={['#FF5722', '#D84315', '#C62828']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bannerContainer}
    >
      {/* Banner Header */}
      <TouchableOpacity 
        style={styles.headerRow} 
        onPress={handleBannerPress}
        activeOpacity={0.9}
      >
        <View style={styles.titleCol}>
          <View style={styles.flashTag}>
            <Ionicons name="flash" size={14} color="#FFD54F" />
            <Text style={styles.flashTagText}>FLASH SALE</Text>
          </View>
          <Text style={styles.saleTitle} numberOfLines={1}>
            {activeSale.title}
          </Text>
        </View>

        <View style={styles.timerCol}>
          <Text style={styles.endsInLabel}>ENDS IN</Text>
          <CountdownTimer 
            endTime={activeSale.endTime} 
            style={styles.timerContainer}
            textStyle={styles.timerText}
          />
        </View>
      </TouchableOpacity>

      {/* Horizontal Product list */}
      {loadingProducts ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading hot deals...</Text>
        </View>
      ) : products.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {products.map((item) => {
            const hasStock = item.inStock && item.stockQty > 0;
            return (
              <TouchableOpacity
                key={item._id}
                style={[styles.productCard, !hasStock && styles.soldOutCard]}
                activeOpacity={hasStock ? 0.9 : 1}
                onPress={() => {
                  if (hasStock) {
                    router.push(`/product/${item.slug}`);
                  }
                }}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: item.images[0] }} style={styles.productImage} />
                  <SaleBadge discount={item.discount} style={styles.badgePosition} />
                  
                  {!hasStock && (
                    <View style={styles.soldOutBadge}>
                      <Text style={styles.soldOutBadgeText}>SOLD OUT</Text>
                    </View>
                  )}
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.salePrice}>
                      {formatINR(item.storePrice)}
                    </Text>
                    <Text style={styles.originalPrice}>
                      {formatINR(item.originalPrice)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* See all card */}
          <TouchableOpacity 
            style={styles.seeAllCard} 
            onPress={handleBannerPress}
            activeOpacity={0.8}
          >
            <View style={styles.seeAllCircle}>
              <Ionicons name="arrow-forward" size={24} color="#D84315" />
            </View>
            <Text style={styles.seeAllText}>See All Deals</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products currently on sale.</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  badgePosition: {
    left: 4,
    position: 'absolute',
    top: 4,
    zIndex: 2,
  },
  bannerContainer: {
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    overflow: 'hidden',
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  endsInLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'right',
  },
  flashTag: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flashTagText: {
    color: '#FFD54F',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  imageWrapper: {
    backgroundColor: colors.surface,
    height: 100,
    position: 'relative',
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  originalPrice: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  priceContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: 2,
  },
  productCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    elevation: 3,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    width: 120,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productInfo: {
    gap: 2,
    padding: spacing.sm,
  },
  productName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  salePrice: {
    color: '#D84315',
    fontSize: 13,
    fontWeight: '800',
  },
  saleTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  scrollContent: {
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  seeAllCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
    height: 145,
    justifyContent: 'center',
    width: 100,
  },
  seeAllCircle: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  seeAllText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  soldOutBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  soldOutBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  soldOutCard: {
    opacity: 0.85,
  },
  timerCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  titleCol: {
    alignItems: 'flex-start',
    flex: 1,
    paddingRight: spacing.sm,
  },
});
