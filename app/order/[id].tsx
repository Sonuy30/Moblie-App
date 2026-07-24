import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useOrderDetail, useCancelOrder } from '@/hooks/useOrders';
import { useCompanySettings } from '@/hooks/useCompany';
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
import Toast from 'react-native-toast-message';

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
  const { data: settings } = useCompanySettings();
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Ordered by mistake');
  const cancelMutation = useCancelOrder();



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
  // Use updatedAt if available and looks like a delivery timestamp,
  // else fall back to placedAt so the window is always calculated from something real.
  const eligibilityDate =
    rawOrder?.updatedAt && rawOrder.updatedAt !== rawOrder.placedAt
      ? rawOrder.updatedAt
      : order.placedAt;
  const eligibility = getReturnEligibility(eligibilityDate, settings?.returnWindowDays);
  const showReturnSection = safeStatus === 'delivered';

  const handleReturnPress = () => {
    if (latestReturn) {
      router.push(`/order/${id}/return-status?returnId=${latestReturn.returnId}`);
    } else {
      router.push(`/order/${id}/return`);
    }
  };

  const handleCancelOrder = () => {
    cancelMutation.mutate(
      { orderId: id || '', reason: selectedReason },
      {
        onSuccess: (data) => {
          setIsCancelModalVisible(false);
          Toast.show({
            type: 'success',
            text1: 'Order cancelled successfully',
            text2: data?.message || '',
          });
        },
        onError: (err: any) => {
          Toast.show({
            type: 'error',
            text1: 'Failed to cancel order',
            text2: err.response?.data?.message || err.message || 'Please try again',
          });
        },
      }
    );
  };

  const returnButtonText = latestReturn
    ? latestReturn.overallStatus === 'completed'
      ? 'Refund Credited — View Details'
      : latestReturn.overallStatus === 'rejected'
      ? 'Return Rejected — View Details'
      : 'Track Return / Refund'
    : eligibility.eligible
    ? `Return / Exchange Items (${eligibility.daysRemaining}d left)`
    : 'Return Window Closed';

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
                onPress={() => router.replace(`/order/${id}/track`)}
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
        {showReturnSection && (
          <TouchableOpacity
            style={[
              styles.returnBtn,
              !eligibility.eligible && !latestReturn && styles.returnBtnDisabled,
            ]}
            onPress={eligibility.eligible || !!latestReturn ? handleReturnPress : undefined}
            activeOpacity={eligibility.eligible || !!latestReturn ? 0.75 : 1}
          >
            <Ionicons
              name="return-down-back-outline"
              size={20}
              color={eligibility.eligible || !!latestReturn ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.returnBtnText,
                !eligibility.eligible && !latestReturn && styles.returnBtnTextDisabled,
              ]}
            >
              {returnButtonText}
            </Text>
            {(eligibility.eligible || !!latestReturn) && (
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}

        {/* Download Invoice — delivered orders only */}
        {safeStatus === 'delivered' && (
          <TouchableOpacity
            style={styles.invoiceBtn}
            onPress={() => router.push(`/order/${id}/invoice`)}
            activeOpacity={0.8}
            accessibilityLabel="Download GST invoice PDF"
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.invoiceBtnText}>Download GST Invoice (PDF)</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
        {/* Cancel Order Section */}
        {(safeStatus === 'confirmed' || safeStatus === 'pending' || safeStatus === 'open') && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setIsCancelModalVisible(true)}
            activeOpacity={0.75}
            disabled={cancelMutation.isPending}
          >
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
            <Text style={styles.cancelBtnText}>
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
            </Text>
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

      {/* Cancellation Reason Modal */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsCancelModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Order</Text>
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>Please select a reason for cancellation:</Text>
              
              {['Ordered by mistake', 'Found cheaper elsewhere', 'Delivery too slow', 'Other'].map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={styles.reasonOption}
                  onPress={() => setSelectedReason(reason)}
                >
                  <Ionicons
                    name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={selectedReason === reason ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.confirmCancelBtn, cancelMutation.isPending && styles.confirmCancelBtnDisabled]}
                onPress={handleCancelOrder}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.confirmCancelBtnText}>Confirm Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.error + '33',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  cancelBtnText: {
    color: colors.error,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmCancelBtn: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  confirmCancelBtnDisabled: {
    opacity: 0.6,
  },
  confirmCancelBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  content: { gap: spacing.xl, padding: spacing.lg },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: 8 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  helpCard: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  helpText: { color: colors.primary, flex: 1, fontSize: 14, fontWeight: '600' },
  invoiceBtn: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  invoiceBtnText: { color: colors.primary, flex: 1, fontSize: 14, fontWeight: '700' },
  modalBody: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacing['3xl'],
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  payCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, gap: spacing.md, padding: spacing.lg },
  payLabel: { color: colors.textSecondary, fontSize: 13 },
  payRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  payVal: { color: colors.text, fontSize: 13, fontWeight: '500' },
  priceCard: { backgroundColor: colors.white, borderRadius: borderRadius.lg, elevation: 2, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  priceLabel: { color: colors.textSecondary, fontSize: 14 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceVal: { color: colors.text, fontSize: 14, fontWeight: '500' },
  reasonOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: spacing.md,
  },
  reasonText: {
    color: colors.text,
    fontSize: 14,
  },
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
  returnBtnDisabled: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  returnBtnText: {
    color: colors.primary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  returnBtnTextDisabled: {
    color: colors.textMuted,
    fontWeight: '600',
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
