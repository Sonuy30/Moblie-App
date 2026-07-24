import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  type ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

interface Banner {
  id: string;
  gradient: [string, string, string];
  badge: string;
  brandLine: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaRoute: '/(tabs)/search';
}

const BANNERS: Banner[] = [
  {
    id: 'b1',
    gradient: ['#0F2027', '#203A43', '#2C5364'],
    badge: '⚡ MEGA DEAL',
    brandLine: `🌟 ${companyName} SUPER VALUE FEST`,
    title: 'Build Securely\nSave Up To 20%',
    subtitle:
      'Direct-from-mill discounts on premium TMT rebars, rust-proof GI pipes, and binding wire combos.',
    ctaText: 'Claim Offers',
    ctaRoute: '/(tabs)/search',
  },
  {
    id: 'b2',
    gradient: ['#1a1a2e', '#16213e', '#0f3460'],
    badge: '🎁 COMBO SAVER',
    brandLine: `🔩 ${companyName} BULK BONANZA`,
    title: 'Buy More,\nPay Less',
    subtitle:
      'Order 15 bundles of annealed binding wire, get 1 FREE. Exclusive bulk pricing unlocked.',
    ctaText: 'Shop Combos',
    ctaRoute: '/(tabs)/search',
  },
  {
    id: 'b3',
    gradient: ['#11998e', '#1a6b51', '#0d4a38'],
    badge: '📉 PRICE DROP',
    brandLine: `🏗️ ${companyName} CONTRACTOR WEEK`,
    title: 'GI Pipe Price\nDrop — 20% Off',
    subtitle:
      'Premium galvanized iron pipes, 20mm & 25mm light grade. Stock up now before prices rise.',
    ctaText: 'View Deals',
    ctaRoute: '/(tabs)/search',
  },
];

export default function HeroBanner() {
  const flatListRef = useRef<FlatList<Banner>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const indexRef = useRef(0);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % BANNERS.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      indexRef.current = next;
      setActiveIndex(next);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index !== null && viewableItems[0]?.index !== undefined) {
        indexRef.current = viewableItems[0].index;
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderBanner = ({ item }: { item: Banner }) => (
    <View style={styles.slide}>
      <LinearGradient
        colors={item.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top Row */}
        <View style={styles.topRow}>
          <LinearGradient
            colors={['#FF512F', '#DD2476']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveBadgeGradient}
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{item.badge}</Text>
          </LinearGradient>
          <View style={styles.certBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#38ef7d" />
            <Text style={styles.certText}>ISI Certified</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.brandLine}>{item.brandLine}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>

          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.push(item.ctaRoute)}
              activeOpacity={0.85}
            >
              <Ionicons name="cart-outline" size={15} color="#fff" />
              <Text style={styles.primaryCtaText}>{item.ctaText}</Text>
            </TouchableOpacity>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>Flat 20%</Text>
              <Text style={styles.statLabel}>Instant Off</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>FREE</Text>
              <Text style={styles.statLabel}>Site Shipping</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        renderItem={renderBanner}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH - spacing.lg * 2,
          offset: (SCREEN_WIDTH - spacing.lg * 2) * index,
          index,
        })}
      />

      {/* Pagination Dots */}
      <View style={styles.dotsRow}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const SLIDE_WIDTH = SCREEN_WIDTH - spacing.lg * 2;

const styles = StyleSheet.create({
  brandLine: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  certBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(56,239,125,0.15)',
    borderColor: 'rgba(56,239,125,0.3)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  certText: {
    color: '#38ef7d',
    fontSize: 9,
    fontWeight: '700',
  },
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  content: {
    zIndex: 1,
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dot: {
    backgroundColor: 'rgba(24,95,165,0.25)',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 10,
  },
  gradient: {
    justifyContent: 'space-between',
    minHeight: 200,
    overflow: 'hidden',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  liveBadgeGradient: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    backgroundColor: '#38ef7d',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  liveText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  primaryCtaText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  slide: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    width: SLIDE_WIDTH,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  statNumber: {
    color: '#38ef7d',
    fontSize: 13,
    fontWeight: '900',
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 1,
  },
});
