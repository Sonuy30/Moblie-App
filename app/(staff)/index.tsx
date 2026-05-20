import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchAssignedDeliveries, DeliveryOrder } from '@/api/delivery';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import StatusUpdateSheet from '@/components/delivery/StatusUpdateSheet';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const TypedFlashList = FlashList as any;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  packed: { bg: colors.successLight, text: colors.success },
  shipped: { bg: colors.primaryLight, text: colors.primary },
  out_for_delivery: { bg: colors.warningLight, text: colors.warning },
  delivered: { bg: '#D4EDDA', text: '#155724' },
};

export default function DeliveryDashboard() {
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff-deliveries'],
    queryFn: fetchAssignedDeliveries,
    refetchInterval: 30000,   // Poll every 30s for new assignments
  });

  const deliveries = data?.deliveries || [];
  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered');
  const completedCount = deliveries.filter(d => d.status === 'delivered').length;

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call. Please dial manually.');
    });
  };

  const handleDirections = (address: any) => {
    const fullAddress = `${address.addressLine1}, ${address.addressLine2 || ''}, ${address.city}, ${address.state} - ${address.pincode}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application.');
    });
  };

  const renderDeliveryCard = ({ item }: { item: DeliveryOrder }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.packed;
    const addr = item.deliveryAddress;
    const addressStr = `${addr.addressLine1}${addr.addressLine2 ? ', ' + addr.addressLine2 : ''}, ${addr.city}, ${addr.state} - ${addr.pincode}`;

    const nextLabel: Record<string, string> = {
      packed:           'Ship Order',
      shipped:          'Start Delivery',
      out_for_delivery: 'Complete Delivery',
    };

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.orderNumRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            <Text style={styles.orderNum}>{item.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Customer info */}
          <View style={styles.customerRow}>
            <View>
              <Text style={styles.customerName}>{item.customer.fullName}</Text>
              <Text style={styles.customerPhone}>{item.customer.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => handleCall(item.customer.phone)}>
              <Ionicons name="call" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Address */}
          <View style={styles.divider} />
          <View style={styles.addressRow}>
            <View style={styles.addressTextCol}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} style={styles.locIcon} />
              <Text style={styles.addressText} numberOfLines={2}>{addressStr}</Text>
            </View>
            <TouchableOpacity style={styles.directionBtn} onPress={() => handleDirections(addr)}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={styles.directionText}>Map</Text>
            </TouchableOpacity>
          </View>

          {/* Items Preview */}
          <View style={styles.divider} />
          <View style={styles.itemsRow}>
            <Ionicons name="cube-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.itemsText}>
              {item.items.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
            </Text>
          </View>
        </View>

        {/* Card Footer Actions */}
        {nextLabel[item.status] && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => setSelectedOrder(item)}
          >
            <Text style={styles.actionBtnText}>{nextLabel[item.status]}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top Banner Stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Delivery Agent</Text>
          <Text style={styles.subtitle}>Manage your tasks for today</Text>
        </View>
        <TouchableOpacity style={styles.syncBtn} onPress={() => refetch()}>
          <Ionicons name="sync" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{activeDeliveries.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
          <Text style={[styles.statNum, { color: colors.success }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNum, { color: colors.text }]}>{deliveries.length}</Text>
          <Text style={styles.statLabel}>Total Today</Text>
        </View>
      </View>

      {/* Main List */}
      <TypedFlashList
        data={activeDeliveries}
        renderItem={renderDeliveryCard}
        estimatedItemSize={220}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.success} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySub}>No active deliveries assigned to you right now.</Text>
          </View>
        }
      />

      {/* Status Update Modal Sheet */}
      <Modal
        visible={selectedOrder !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedOrder(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order #{selectedOrder?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selectedOrder && (
              <StatusUpdateSheet
                orderId={selectedOrder._id}
                currentStatus={selectedOrder.status}
                deliveryToken={selectedOrder.deliveryToken}
                onClose={() => setSelectedOrder(null)}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  syncBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  
  statsContainer: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },

  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderNum: { fontSize: 16, fontWeight: '800', color: colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  cardBody: { gap: 10, marginBottom: 16 },
  customerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerName: { fontSize: 15, fontWeight: '700', color: colors.text },
  customerPhone: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  
  divider: { height: 1, backgroundColor: colors.surface, marginVertical: 2 },
  
  addressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  addressTextCol: { flex: 1, flexDirection: 'row', gap: 6 },
  locIcon: { marginTop: 2 },
  addressText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  directionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.sm },
  directionText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemsText: { flex: 1, fontSize: 13, color: colors.textSecondary },

  actionBtn: { backgroundColor: colors.primary, height: 44, borderRadius: borderRadius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptySub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing['2xl'] },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: spacing['3xl'] },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
});
