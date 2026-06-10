import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignedDeliveries, type DeliveryOrder } from '@/api/delivery';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { formatRelativeDate } from '@/utils/date';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  packed: { bg: '#EAF3DE', text: '#3B6D11' },
  shipped: { bg: '#E6F1FB', text: '#185FA5' },
  out_for_delivery: { bg: '#FAEEDA', text: '#854F0B' },
  delivered: { bg: '#D4EDDA', text: '#155724' },
};

export default function DeliveryHistory() {
  const [activeTab, setActiveTab] = useState<'completed' | 'all'>('completed');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staff-deliveries'],
    queryFn: fetchAssignedDeliveries,
  });

  const deliveries = data?.deliveries || [];
  const filtered = activeTab === 'completed'
    ? deliveries.filter((d) => d.status === 'delivered')
    : deliveries;

  const renderDeliveryCard = ({ item }: { item: DeliveryOrder }) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.packed;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.orderNumRow}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <Text style={styles.orderNum}>{item.orderNumber}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {item.status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>{item.customer.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>{item.customer.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {item.items.length} item{item.items.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {item.estimatedDelivery && (
          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.footerText}>
              {formatRelativeDate(item.estimatedDelivery)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Delivery History</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderDeliveryCard}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="archive-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No deliveries yet</Text>
            <Text style={styles.emptySub}>Completed deliveries will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, elevation: 3, marginBottom: spacing.md, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  cardBody: { gap: 8, marginBottom: 12 },
  cardFooter: { alignItems: 'center', borderTopColor: colors.surface, borderTopWidth: 1, flexDirection: 'row', gap: 6, paddingTop: 12 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  empty: { alignItems: 'center', gap: 8, justifyContent: 'center', paddingTop: 80 },
  emptySub: { color: colors.textSecondary, fontSize: 14 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  footerText: { color: colors.textSecondary, fontSize: 12 },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  infoText: { color: colors.textSecondary, fontSize: 13 },
  list: { paddingBottom: 100, paddingHorizontal: spacing.lg },
  orderNum: { color: colors.text, fontSize: 15, fontWeight: '700' },
  orderNumRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  safe: { backgroundColor: colors.background, flex: 1 },
  statusBadge: { borderRadius: borderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  tab: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, flex: 1, paddingVertical: 10 },
  tabActive: { backgroundColor: colors.primaryLight },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md, paddingHorizontal: spacing.lg },
  tabText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});
