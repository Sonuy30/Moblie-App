import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchMySubscriptions } from '@/api/subscriptions';
import { fetchProducts, type StoreProduct } from '@/api/products';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import type { Subscription } from '@/types/subscription';

const STATUS_COLORS = {
  active: { bg: '#dcfce7', text: '#166534' },
  paused: { bg: '#fef9c3', text: '#854d0e' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
};

function nextDeliveryText(sub: Subscription): string {
  if (sub.status === 'cancelled') return 'Cancelled';
  if (sub.status === 'completed') return 'Completed';
  if (sub.status === 'paused') {
    const lastPause = sub.pauses && sub.pauses.length > 0 ? sub.pauses[sub.pauses.length - 1] : null;
    const resumeStr = lastPause?.to ? new Date(lastPause.to).toLocaleDateString('en-IN') : '';
    return 'Paused' + (resumeStr ? ' — resumes ' + resumeStr : '');
  }

  const start = new Date(sub.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    if (d < start) continue;
    if (sub.skipDates?.some((s) => new Date(s).toISOString().slice(0, 10) === dateStr)) continue;
    if (sub.pauses?.some((p) => d >= new Date(p.from) && d <= new Date(p.to))) continue;

    return 'Next delivery: ' + d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · 3:00–7:00 AM';
  }
  return 'No upcoming delivery';
}

function SubscriptionCard({ sub }: { sub: Subscription }) {
  const isBillDue = sub.billingStatus === 'due' || sub.billingStatus === 'overdue';
  const sc = isBillDue
    ? { bg: '#fee2e2', text: '#991b1b' }
    : STATUS_COLORS[sub.status] || STATUS_COLORS.active;
  const progress = sub.totalDeliveries > 0 ? sub.deliveriesCompleted / sub.totalDeliveries : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/subscription/[id]', params: { id: sub._id } })}
      accessibilityRole="button"
      accessibilityLabel={`${sub.itemName} subscription, ${sub.status}`}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>{sub.itemName}</Text>
          <Text style={styles.itemQty}>{sub.quantityPerDelivery} {sub.unit} per delivery</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>
            {isBillDue ? 'BILL DUE' : sub.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {sub.deliveriesCompleted} / {sub.totalDeliveries} deliveries
      </Text>

      <View style={styles.nextRow}>
        <Ionicons name="time-outline" size={13} color={colors.primary} />
        <Text style={styles.nextText}>{nextDeliveryText(sub)}</Text>
      </View>

      <View style={styles.planRow}>
        <Text style={styles.planLabel}>{sub.planType.charAt(0).toUpperCase() + sub.planType.slice(1)} plan</Text>
        <Text style={styles.planPrice}>₹{sub.totalAmount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function DailyProductCard({ item }: { item: StoreProduct }) {
  return (
    <View style={styles.dailyCard}>
      <Image
        source={{ uri: item.images?.[0] || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80' }}
        style={styles.dailyImg}
        contentFit="cover"
      />
      <View style={styles.dailyInfo}>
        <View style={styles.dailyBadge}>
          <Ionicons name="repeat" size={10} color={colors.primary} />
          <Text style={styles.dailyBadgeText}>Daily Doorstep</Text>
        </View>
        <Text style={styles.dailyName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.dailyCategory}>{item.category || 'Dairy & Daily Essentials'}</Text>
        
        <View style={styles.dailyBottomRow}>
          <Text style={styles.dailyPrice}>{formatINR(item.storePrice)} <Text style={styles.dailyUnit}>/ {item.unit || 'unit'}</Text></Text>
          <TouchableOpacity
            style={styles.subscribeBtn}
            onPress={() => router.push({ pathname: '/subscribe/[itemId]', params: { itemId: item.slug || item._id } })}
          >
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text style={styles.subscribeBtnText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function SubscriptionsScreen() {
  const [tab, setTab] = useState<'my' | 'explore'>('my');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [subsRes, prodsRes] = await Promise.allSettled([
        fetchMySubscriptions(),
        fetchProducts({ limit: 50 }),
      ]);
      if (subsRes.status === 'fulfilled') setSubscriptions(subsRes.value);
      if (prodsRes.status === 'fulfilled') setProducts(prodsRes.value.products || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadData(true);
  };

  // Filter daily/dairy products
  const dailyProducts = products.filter((p) => {
    if (p.isSubscribable) return true;
    const cat = (p.category || '').toLowerCase();
    return ['dairy', 'milk', 'curd', 'paneer', 'butter', 'ghee', 'eggs', 'bread', 'daily', 'beverages', 'groceries', 'subscription'].some((d) => cat.includes(d));
  });

  const displayProducts = dailyProducts.length > 0 ? dailyProducts : products;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dairy & Daily Subscriptions</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.shopBtn}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'my' && styles.tabBtnActive]}
          onPress={() => setTab('my')}
        >
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>
            My Active ({subscriptions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, tab === 'explore' && styles.tabBtnActive]}
          onPress={() => setTab('explore')}
        >
          <Text style={[styles.tabText, tab === 'explore' && styles.tabTextActive]}>
            Daily Essentials ({displayProducts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'my' ? (
        subscriptions.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="repeat-outline" size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>No active subscriptions</Text>
            <Text style={styles.emptySubtitle}>Subscribe to fresh milk & daily essentials for 3-7 AM doorstep delivery</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => setTab('explore')}>
              <Text style={styles.browseBtnText}>Explore Daily Items</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlashList
            data={subscriptions}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <SubscriptionCard sub={item} />}
            estimatedItemSize={160}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <FlashList
          data={displayProducts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <DailyProductCard item={item} />}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  browseBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 12,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  dailyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dailyBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  dailyBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dailyCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    padding: 12,
  },
  dailyCategory: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  dailyImg: {
    borderRadius: 12,
    height: 80,
    width: 80,
  },
  dailyInfo: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  dailyName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  dailyPrice: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  dailyUnit: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  itemQty: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  nextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  nextText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  planLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  planPrice: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBg: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 6,
    marginBottom: 4,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    height: 6,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },
  shopBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subscribeBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subscribeBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtn: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
    flex: 1,
    paddingVertical: 12,
  },
  tabBtnActive: {
    borderColor: colors.primary,
  },
  tabContainer: {
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
