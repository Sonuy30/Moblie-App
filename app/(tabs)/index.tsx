import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

// Stores
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

// Home sections
import CategoryChips from '@/components/home/CategoryChips';
import HeroBanner from '@/components/home/HeroBanner';
import DiscountCarousel from '@/components/home/DiscountCarousel';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import WishlistPreview from '@/components/home/WishlistPreview';
import FlashSaleBanner from '@/components/sales/FlashSaleBanner';
import RecentlyViewed from '@/components/home/RecentlyViewed';

// UI
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'DailyNest';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const cartCount = useCartStore((s) => s.totalItems());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['products-infinite'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['active-sale'] }),
        queryClient.invalidateQueries({ queryKey: ['sale-products'] }),
      ]);
    } catch (err) {
      console.warn('[HomeScreen] Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      {/* ── Premium Custom Header ── */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={{ width: 34, height: 34, borderRadius: 8, marginRight: 8 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandTitle}>{companyName}</Text>
            <Text style={styles.brandSubtitle}>OFFICIAL STORE</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/wishlist')}
            activeOpacity={0.7}
            accessibilityLabel="View wishlist"
            accessibilityRole="button"
          >
            <Ionicons name="heart-outline" size={22} color={colors.text} />
            {wishlistCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/cart')}
            activeOpacity={0.7}
            accessibilityLabel="View cart"
            accessibilityRole="button"
          >
            <Ionicons name="cart-outline" size={22} color={colors.text} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { onRefresh().catch(() => {}); }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tappable Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/search')}
          activeOpacity={0.8}
          accessibilityLabel="Search for products"
          accessibilityRole="search"
        >
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <Text style={styles.searchPlaceholder}>
            Search products...
          </Text>
        </TouchableOpacity>

        {/* ── SECTION 1: Category Chips ── */}
        <CategoryChips />

        {/* ── SECTION 2: Hero Banner Carousel ── */}
        <HeroBanner />

        {/* ── SECTION 3: Flash Sale Banner (null when no active sale) ── */}
        <FlashSaleBanner />

        {/* ── SECTION 4: Top Deals Horizontal Scroll ── */}
        <DiscountCarousel />

        {/* ── SECTION 4.5: Recently Viewed ── */}
        <RecentlyViewed />

        {/* ── SECTION 5: Best Sellers 2-Column Grid ── */}
        <FeaturedProducts />

        {/* ── SECTION 6: Wishlist Preview (null when empty) ── */}
        <WishlistPreview />

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 99,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
  },
  bottomPad: {
    height: 40,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandSubtitle: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -2,
  },
  brandTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    position: 'relative',
    width: 36,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    gap: 10,
    height: 52,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
});
