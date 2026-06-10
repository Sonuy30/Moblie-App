import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useOrderDetail } from '@/hooks/useOrders';
import { getReturnEligibility } from '@/types/returns';
import { getReturnHistory } from '@/api/returns';
import TrackingTimeline from '@/components/order/TrackingTimeline';
import OrderItemRow from '@/components/order/OrderItemRow';
import Badge from '@/components/ui/Badge';
import { ProductDetailSkeleton } from '@/components/skeletons/ProductDetailSkeleton';
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
  const { data: rawOrder, isLoading } = useOrderDetail(id || '');

  const { data: returns } = useQuery({
    queryKey: ['order-returns', id],
    queryFn: () => getReturnHistory(id || ''),
    enabled: !!id && !isLoading && rawOrder?.status === 'delivered',
  });

  // ── Normalise the ERP order shape to guard against undefined fields ──
  const order = rawOrder ? {
    ...rawOrder,
    orderNumber:    rawOrder.orderNumber   || `ORD-${id?.slice(-6).toUpperCase()}`,
    status:         rawOrder.status        || 'confirmed',
    paymentStatus:  rawOrder.paymentStatus || 'pending',
    paymentMethod:  rawOrder.paymentMethod || 'Online',
    items:          rawOrder.items         || [],
    subtotal:       rawOrder.subtotal       ?? 0,
    gstAmount:      rawOrder.gstAmount      ?? 0,
    deliveryCharge: rawOrder.deliveryCharge ?? 0,
    totalAmount:    rawOrder.totalAmount    ?? 0,
    placedAt:       rawOrder.placedAt       || rawOrder.createdAt || new Date().toISOString(),
    updatedAt:      rawOrder.updatedAt      || new Date().toISOString(),
  } : null;

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

  const safeStatus = (order.status || 'confirmed').toLowerCase();
  const banner = statusBanner[safeStatus] || statusBanner.confirmed;

  const latestReturn = returns && returns.length > 0 ? returns[returns.length - 1] : null;
  const eligibility = getReturnEligibility(order.updatedAt);
  const showReturnButton = safeStatus === 'delivered' && (eligibility.eligible || !!latestReturn);

  const handleReturnPress = () => {
    if (latestReturn) {
      router.push(`/order/${id}/return-status?returnId=${latestReturn.returnId}`);
    } else {
      router.push(`/order/${id}/return`);
    }
  };

  const returnButtonText = latestReturn
    ? latestReturn.overallStatus === 'completed'
      ? 'Refund Credited - View Details'
      : latestReturn.overallStatus === 'rejected'
      ? 'Return Rejected - View Details'
      : 'Track Return / Refund'
    : 'Return / Exchange Items';

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
          <Ionicons name={safeStatus === 'delivered' ? 'checkmark-circle' : safeStatus === 'cancelled' ? 'close-circle' : 'time-outline'} size={22} color={banner.color} />
          <Text style={[styles.bannerText, { color: banner.color }]}>{banner.text}</Text>
        </View>

        {/* Tracking */}
        <View style={styles.section}>
          <View style={styles.trackingHeader}>
            <Text style={styles.sectionTitle}>Tracking</Text>
            {safeStatus !== 'cancelled' && safeStatus !== 'delivered' && (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => router.push(`/order/${id}/track`)}
                activeOpacity={0.75}
              >
                <Ionicons name="navigate-outline" size={13} color={colors.primary} />
                <Text style={styles.trackBtnText}>Live Track</Text>
              </TouchableOpacity>
            )}
          </View>
          <TrackingTimeline status={safeStatus} trackingNumber={order.trackingNumber} courierName={order.courierName} placedAt={order.placedAt} updatedAt={order.updatedAt} />
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
            <View style={styles.payRow}><Text style={styles.payLabel}>Status</Text><Badge text={(order.paymentStatus || 'PENDING').toUpperCase()} variant={order.paymentStatus === 'paid' ? 'success' : 'warning'} /></View>
            <View style={styles.payRow}><Text style={styles.payLabel}>Date</Text><Text style={styles.payVal}>{formatDate(order.placedAt)}</Text></View>
          </View>
        </View>

        {/* Return / Exchange */}
        {showReturnButton && (
          <TouchableOpacity style={styles.returnBtn} onPress={handleReturnPress} activeOpacity={0.75}>
            <Ionicons name="return-down-back-outline" size={20} color={colors.primary} />
            <Text style={styles.returnBtnText}>{returnButtonText}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

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
  addrCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, gap: 2, padding: spacing.lg },
  addrLine: { color: colors.textSecondary, fontSize: 13 },
  addrName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  backBtn: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  banner: { alignItems: 'center', borderRadius: borderRadius.lg, flexDirection: 'row', gap: 10, padding: spacing.lg },
  bannerText: { fontSize: 15, fontWeight: '600' },
  content: { gap: spacing.xl, padding: spacing.lg },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: 8 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  helpCard: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  helpText: { color: colors.primary, flex: 1, fontSize: 14, fontWeight: '600' },
  payCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, gap: spacing.md, padding: spacing.lg },
  payLabel: { color: colors.textSecondary, fontSize: 13 },
  payRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  payVal: { color: colors.text, fontSize: 13, fontWeight: '500' },
  priceCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, elevation: 2, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  priceLabel: { color: colors.textSecondary, fontSize: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceVal: { color: colors.text, fontSize: 14, fontWeight: '500' },
  returnBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary + '33',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  returnBtnText: {
    color: colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  safe: { backgroundColor: colors.background, flex: 1 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  totalLabel: { color: colors.text, fontSize: 16, fontWeight: '700' },
  totalVal: { color: colors.primary, fontSize: 18, fontWeight: '700' },
  trackBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  trackBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  trackingHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
