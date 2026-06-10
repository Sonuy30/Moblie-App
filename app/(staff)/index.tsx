import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Modal, Alert, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchAssignedDeliveries, type DeliveryOrder } from '@/api/delivery';
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
  actionBtn: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.md, flexDirection: 'row', gap: 8, height: 44, justifyContent: 'center' },
  actionBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  addressRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  addressText: { color: colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 18 },
  addressTextCol: { flex: 1, flexDirection: 'row', gap: 6 },
  
  callBtn: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  card: { backgroundColor: colors.white, borderColor: 'rgba(0,0,0,0.02)', borderRadius: borderRadius.lg, borderWidth: 1, elevation: 3, marginBottom: spacing.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardBody: { gap: 10, marginBottom: 16 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },

  customerName: { color: colors.text, fontSize: 15, fontWeight: '700' },
  customerPhone: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
  customerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  directionBtn: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: borderRadius.sm, flexDirection: 'row', gap: 4, paddingHorizontal: 10, paddingVertical: 6 },
  directionText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  divider: { backgroundColor: colors.surface, height: 1, marginVertical: 2 },
  empty: { alignItems: 'center', gap: 12, justifyContent: 'center', paddingTop: 80 },

  emptySub: { color: colors.textSecondary, fontSize: 14, paddingHorizontal: spacing['2xl'], textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  greeting: { color: colors.text, fontSize: 22, fontWeight: '800' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  itemsRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  
  itemsText: { color: colors.textSecondary, flex: 1, fontSize: 13 },
  
  list: { paddingBottom: 100, paddingHorizontal: spacing.lg },
  locIcon: { marginTop: 2 },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: spacing['3xl'] },
  modalHeader: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'flex-end' },
  modalTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },

  orderNum: { color: colors.text, fontSize: 16, fontWeight: '800' },
  orderNumRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },

  safe: { backgroundColor: colors.surface, flex: 1 },
  statCard: { alignItems: 'center', borderRadius: borderRadius.lg, elevation: 1, flex: 1, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2 },

  statLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 2 },
  statNum: { fontSize: 20, fontWeight: '800' },
  statsContainer: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },

  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  syncBtn: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 20, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
});
