import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useOrderDetail } from '@/hooks/useOrders';
import TrackingTimeline from '@/components/order/TrackingTimeline';
import OrderItemRow from '@/components/order/OrderItemRow';
import Badge from '@/components/ui/Badge';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const statusBanner: Record<string, { text: string; bg: string; color: string }> = {
  confirmed: { text: 'Your order is confirmed!', bg: colors.primaryLight, color: colors.primary },
  packed: { text: 'Your order is being packed!', bg: colors.warningLight, color: colors.warning },
  shipped: { text: 'Your order is on the way!', bg: colors.primaryLight, color: colors.primary },
  delivered: { text: 'Order delivered!', bg: colors.successLight, color: colors.success },
  cancelled: { text: 'Order cancelled', bg: colors.errorLight, color: colors.error },
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrderDetail(id || '');

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <ProductDetailSkeleton />
      </SafeAreaView>
    );
  }

  const banner = statusBanner[order.status] || statusBanner.confirmed;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{order.orderNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.banner, { backgroundColor: banner.bg }]}>
          <Ionicons name={order.status === 'delivered' ? 'checkmark-circle' : order.status === 'cancelled' ? 'close-circle' : 'time-outline'} size={22} color={banner.color} />
          <Text style={[styles.bannerText, { color: banner.color }]}>{banner.text}</Text>
        </View>

        {/* Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracking</Text>
          <TrackingTimeline status={order.status} trackingNumber={order.trackingNumber} courierName={order.courierName} placedAt={order.placedAt} updatedAt={order.updatedAt} />
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.addrCard}>
              <Text style={styles.addrName}>{order.deliveryAddress.fullName}</Text>
              <Text style={styles.addrLine}>{order.deliveryAddress.addressLine1}</Text>
              <Text style={styles.addrLine}>{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</Text>
              <Text style={styles.addrLine}>{order.deliveryAddress.phone}</Text>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items in this order</Text>
          {order.items.map((item, i) => <OrderItemRow key={i} name={item.name} image={item.image} quantity={item.quantity} price={item.price} />)}
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceVal}>{formatINR(order.subtotal)}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>GST</Text><Text style={styles.priceVal}>{formatINR(order.gstAmount)}</Text></View>
            <View style={styles.priceRow}><Text style={styles.priceLabel}>Delivery</Text><Text style={styles.priceVal}>{order.deliveryCharge === 0 ? 'FREE' : formatINR(order.deliveryCharge)}</Text></View>
            <View style={styles.divider} />
            <View style={styles.priceRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalVal}>{formatINR(order.totalAmount)}</Text></View>
          </View>
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.payCard}>
            <View style={styles.payRow}><Text style={styles.payLabel}>Method</Text><Text style={styles.payVal}>{order.paymentMethod || 'Online'}</Text></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Status</Text><Badge text={order.paymentStatus.toUpperCase()} variant={order.paymentStatus === 'paid' ? 'success' : 'warning'} /></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Date</Text><Text style={styles.payVal}>{formatDate(order.placedAt)}</Text></View>
          </View>
        </View>

        {/* Help */}
        <TouchableOpacity style={styles.helpCard}>
          <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.helpText}>Need help with this order?</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg, gap: spacing.xl },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.lg, borderRadius: borderRadius.lg },
  bannerText: { fontSize: 15, fontWeight: '600' },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  addrCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, gap: 2 },
  addrName: { fontSize: 15, fontWeight: '600', color: colors.text },
  addrLine: { fontSize: 13, color: colors.textSecondary },
  priceCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontSize: 14, color: colors.textSecondary },
  priceVal: { fontSize: 14, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  totalVal: { fontSize: 18, fontWeight: '700', color: colors.primary },
  payCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, gap: spacing.md },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel: { fontSize: 13, color: colors.textSecondary },
  payVal: { fontSize: 13, fontWeight: '500', color: colors.text },
  helpCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, padding: spacing.lg },
  helpText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },
});
