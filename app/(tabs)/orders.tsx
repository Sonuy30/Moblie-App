import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList as OriginalFlashList } from '@shopify/flash-list';
import { useAuthStore } from '@/stores/authStore';
import { useOrders } from '@/hooks/useOrders';
import OrderCard from '@/components/order/OrderCard';
import { OrderCardSkeleton } from '@/components/skeletons/OrderCardSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';
import { StatusBar } from 'expo-status-bar';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlashList = OriginalFlashList as any;

const STATUS_FILTERS = [
  { label: 'All', value: null },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function OrdersScreen() {
  const { isAuthenticated } = useAuthStore();
  const { data: orders, isLoading, isError, refetch } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Orders</Text>
        </View>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="receipt-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Track your orders</Text>
          <Text style={styles.guestSub}>
            Sign in to view your order history, invoice summaries, and track shipping deliveries.
          </Text>

          <View style={styles.guestActionContainer}>
            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestPrimaryBtnText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestSecondaryBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Filter orders in-memory
  const filteredOrders = orders?.filter((order) => {
    if (!selectedStatus) return true;
    
    // Group pending with confirmed, out_for_delivery with shipped
    if (selectedStatus === 'confirmed') {
      return order.status === 'confirmed' || order.status === 'pending';
    }
    if (selectedStatus === 'shipped') {
      return order.status === 'shipped' || order.status === 'out_for_delivery';
    }
    
    return order.status === selectedStatus;
  }) || [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Orders</Text>
      </View>

      {/* Filter Scroll Pills */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = selectedStatus === filter.value;
            return (
              <TouchableOpacity
                key={filter.label}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedStatus(filter.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders Content */}
      {isLoading ? (
        <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: spacing.xs }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </ScrollView>
        </View>
      ) : isError ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load orders"
          subtitle="An error occurred while fetching your order history. Please try again."
          actionLabel="Retry"
          onAction={() => { void refetch(); }}
        />
      ) : filteredOrders.length === 0 ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { void onRefresh(); }}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <EmptyState
              icon="receipt-outline"
              title={selectedStatus ? "No matching orders" : "No orders yet"}
              subtitle={
                selectedStatus
                  ? `You don't have any orders with status "${selectedStatus}"`
                  : "Start shopping and your order history will appear here."
              }
              actionLabel={selectedStatus ? "View All Orders" : "Browse Shop"}
              onAction={
                selectedStatus
                  ? () => setSelectedStatus(null)
                  : () => router.push('/(tabs)')
              }
            />
          </ScrollView>
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
          <FlashList
            data={filteredOrders}
            estimatedItemSize={140}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: spacing.xs }}
            renderItem={({ item }: { item: any }) => <OrderCard order={item} />}
            keyExtractor={(item: any) => (item as { _id: string })._id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { void onRefresh(); }}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    paddingVertical: spacing.md,
  },
  filterPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 99,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterScroll: {
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  guestActionContainer: {
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  guestContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  guestIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    marginBottom: 24,
    width: 96,
  },
  guestPrimaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    elevation: 4,
    height: 52,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  guestPrimaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
  },
  guestSecondaryBtnText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  guestTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  header: {
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
});
