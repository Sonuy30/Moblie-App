import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrders } from '@/hooks/useOrders';
import { useAuthStore } from '@/stores/authStore';
import OrderCard from '@/components/order/OrderCard';
import EmptyState from '@/components/ui/EmptyState';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { router } from 'expo-router';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS = ['All', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

export default function OrdersScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, refetch } = useOrders();
  const [activeFilter, setActiveFilter] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Text style={styles.title}>My Orders</Text>
        <EmptyState icon="log-in-outline" title="Sign in to view orders" subtitle="Track your orders and manage returns" actionLabel="Sign In" onAction={() => router.push('/(auth)/login')} />
      </SafeAreaView>
    );
  }

  const orders = data || [];
  const filtered = activeFilter === 0 ? orders : orders.filter((o) => o.status === FILTERS[activeFilter].toLowerCase());

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };

  const handleFilter = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveFilter(index);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>My Orders</Text>

      <View>
        <FlatList data={FILTERS} horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow} keyExtractor={(item) => item}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={[styles.chip, activeFilter === index && styles.chipActive]} onPress={() => handleFilter(index)}>
              <Text style={[styles.chipText, activeFilter === index && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          {[1,2,3].map((i) => <View key={i} style={styles.skeletonCard}><ProductCardSkeleton /></View>)}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No orders yet" subtitle="Start shopping to see your orders here" actionLabel="Shop Now" onAction={() => router.push('/(tabs)/explore')} />
      ) : (
        <FlatList data={filtered} keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => <OrderCard order={item} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  filterRow: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: spacing.md },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  loadingContainer: { paddingHorizontal: spacing.lg, gap: spacing.md },
  skeletonCard: { height: 120 },
});
