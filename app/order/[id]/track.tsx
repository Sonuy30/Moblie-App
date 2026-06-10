/**
 * app/order/[id]/track.tsx — Order Tracking Screen
 *
 * Premium vertical-timeline tracking screen for AITS Shop.
 *
 * Features:
 *  • Vertical milestone timeline (Placed → Confirmed → Packed → Shipped
 *    → Out for Delivery → Delivered) with animated pulse on active step
 *  • Auto-refresh every 60 s via TanStack Query refetchInterval
 *  • Courier details card (name, AWB, ETA)
 *  • 'View on Map' button (stub — wires into AITS Delivery WebSocket)
 *  • 'Call Delivery Partner' button (active when out_for_delivery)
 *  • Cancelled order state
 *  • Skeleton loading state
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getTrackingDetails } from '@/api/orders';
import { formatDate, formatTime } from '@/utils/date';
import { SkeletonCircle, SkeletonRect } from '@/components/skeletons/SkeletonBase';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import type { TrackingMilestone, CourierInfo, DeliveryPartner } from '@/types/orders';

// ── Auto-refresh interval ────────────────────────────────────────────────────

const REFETCH_INTERVAL_MS = 60_000; // 60 seconds

// ── Milestone config ─────────────────────────────────────────────────────────

const MILESTONE_COLORS = {
  completed: { dot: colors.success,      line: colors.success,      text: colors.text,    icon: '#fff' },
  active:    { dot: colors.primary,      line: colors.border,       text: colors.primary, icon: '#fff' },
  pending:   { dot: colors.border,       line: colors.border,       text: colors.textMuted, icon: colors.textMuted },
} as const;

// ── Animated pulse for active milestone ──────────────────────────────────────

function PulseRing() {
  const [scale]   = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.9, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

// ── Single milestone row ─────────────────────────────────────────────────────

interface MilestoneRowProps {
  milestone: TrackingMilestone;
  isLast:    boolean;
}

function MilestoneRow({ milestone, isLast }: MilestoneRowProps) {
  const palette = MILESTONE_COLORS[milestone.status];

  return (
    <View style={styles.milestoneRow}>
      {/* Left column: dot + connector line */}
      <View style={styles.milestoneLeft}>
        <View style={styles.dotWrapper}>
          {milestone.status === 'active' && <PulseRing />}
          <View style={[styles.dot, { backgroundColor: palette.dot }]}>
            {milestone.status === 'completed' && (
              <Ionicons name="checkmark" size={11} color="#fff" />
            )}
            {milestone.status === 'active' && (
              <View style={styles.dotInner} />
            )}
          </View>
        </View>
        {!isLast && (
          <View
            style={[
              styles.connector,
              { backgroundColor: milestone.status === 'completed' ? colors.success : colors.border },
            ]}
          />
        )}
      </View>

      {/* Right column: label, description, timestamp */}
      <View style={[styles.milestoneContent, isLast && { paddingBottom: 0 }]}>
        <View style={styles.milestoneMeta}>
          <View style={[styles.milestoneIconBadge, { backgroundColor: palette.dot + '18' }]}>
            <Ionicons
              name={milestone.icon as React.ComponentProps<typeof Ionicons>['name']}
              size={15}
              color={palette.dot}
            />
          </View>
          <View style={styles.milestoneTitleBlock}>
            <Text style={[styles.milestoneLabel, { color: palette.text }]}>
              {milestone.label}
            </Text>
            {milestone.status !== 'pending' && (
              <Text style={styles.milestoneDesc}>{milestone.description}</Text>
            )}
          </View>
        </View>
        {milestone.timestamp && milestone.status !== 'pending' && (
          <Text style={styles.milestoneTime}>
            {formatDate(milestone.timestamp)}  ·  {formatTime(milestone.timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Courier card ────────────────────────────────────────────────────────────

function CourierCard({ courier }: { courier: CourierInfo }) {
  const handleCourierTrack = useCallback(() => {
    if (courier.trackingUrl) {
      void Linking.openURL(courier.trackingUrl);
    }
  }, [courier.trackingUrl]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="car-outline" size={18} color={colors.primary} />
        <Text style={styles.cardTitle}>Courier Details</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Courier</Text>
          <Text style={styles.infoValue}>{courier.name}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>AWB Number</Text>
          <Text style={[styles.infoValue, styles.awbText]}>{courier.trackingNumber}</Text>
        </View>
        {courier.estimatedDelivery ? (
          <>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expected Delivery</Text>
              <Text style={[styles.infoValue, { color: colors.success }]}>
                {formatDate(courier.estimatedDelivery)}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {courier.trackingUrl ? (
        <TouchableOpacity style={styles.trackUrlBtn} onPress={handleCourierTrack} activeOpacity={0.7}>
          <Ionicons name="open-outline" size={14} color={colors.primary} />
          <Text style={styles.trackUrlText}>Track on {courier.name} website</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Delivery partner card ─────────────────────────────────────────────────────

function DeliveryPartnerCard({ partner }: { partner: DeliveryPartner }) {
  const handleCall = useCallback(() => {
    void Linking.openURL(`tel:${partner.phone}`);
  }, [partner.phone]);

  const handleMap = useCallback(() => {
    // TODO: Navigate to live map screen once AITS Delivery WebSocket is live.
    // router.push(`/order/${partner.id}/map`);
    // For now, open native maps at last-known location if available.
    if (partner.location) {
      const { latitude, longitude } = partner.location;
      const url =
        Platform.OS === 'ios'
          ? `maps://app?saddr=&daddr=${latitude},${longitude}`
          : `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
      void Linking.openURL(url);
    }
  }, [partner]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="bicycle-outline" size={18} color={colors.primary} />
        <Text style={styles.cardTitle}>Your Delivery Partner</Text>
      </View>

      <View style={styles.partnerRow}>
        {/* Avatar */}
        <View style={styles.partnerAvatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </View>

        <View style={styles.partnerInfo}>
          <Text style={styles.partnerName}>{partner.name}</Text>
          {partner.vehicleNo && (
            <Text style={styles.partnerVehicle}>{partner.vehicleNo}</Text>
          )}
          {partner.rating !== undefined && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.ratingText}>{partner.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.partnerActions}>
        {/* Call button */}
        <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.75}>
          <Ionicons name="call-outline" size={18} color="#fff" />
          <Text style={styles.callBtnText}>Call Partner</Text>
        </TouchableOpacity>

        {/* Map button */}
        <TouchableOpacity
          style={[styles.mapBtn, !partner.location && styles.mapBtnDisabled]}
          onPress={handleMap}
          activeOpacity={partner.location ? 0.75 : 1}
          disabled={!partner.location}
        >
          <Ionicons
            name="map-outline"
            size={18}
            color={partner.location ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.mapBtnText, !partner.location && { color: colors.textMuted }]}>
            View on Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Map / CTA stub card (shown when no partner assigned yet) ──────────────────

function MapStubCard() {
  return (
    <View style={[styles.card, styles.stubCard]}>
      <Ionicons name="map-outline" size={28} color={colors.textMuted} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.stubTitle}>Live Tracking Coming Soon</Text>
        <Text style={styles.stubDesc}>
          Real-time map tracking will be available once your order is out for delivery.
        </Text>
      </View>
    </View>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function TrackingSkeleton() {
  return (
    <View style={styles.skeleton}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonCircle size={28} />
          <View style={styles.skeletonContent}>
            <SkeletonRect width="55%" height={14} radius={4} />
            <SkeletonRect width="80%" height={14} radius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function OrderTrackScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data:        tracking,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey:        ['order-tracking', id],
    queryFn:         () => getTrackingDetails(id ?? ''),
    enabled:         !!id,
    refetchInterval: (query) => {
      // Stop polling once delivered or cancelled
      if (query.state.data?.isTerminal) return false;
      return REFETCH_INTERVAL_MS;
    },
    staleTime: 30_000,
  });

  const lastRefreshed = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  const isCancelled = tracking?.currentStatus === 'cancelled';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Track Order</Text>
          {tracking?.orderNumber ? (
            <Text style={styles.headerSub}>{tracking.orderNumber}</Text>
          ) : null}
        </View>
        {/* Manual refresh */}
        <TouchableOpacity onPress={() => void refetch()} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Last refreshed badge */}
      {lastRefreshed && !isLoading && (
        <View style={styles.refreshBadge}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.refreshBadgeText}>Updated {lastRefreshed}</Text>
          {!tracking?.isTerminal && (
            <Text style={styles.refreshBadgeText}> · auto-refresh every 60s</Text>
          )}
        </View>
      )}

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Cancelled banner */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={22} color={colors.error} />
            <Text style={styles.cancelledText}>This order has been cancelled.</Text>
          </View>
        )}

        {/* Delivered banner */}
        {tracking?.currentStatus === 'delivered' && (
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.deliveredText}>Your order has been delivered! 🎉</Text>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Progress</Text>
          {isLoading ? (
            <TrackingSkeleton />
          ) : isError ? (
            <View style={styles.errorState}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
              <Text style={styles.errorText}>Couldn&apos;t load tracking info.</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => void refetch()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timeline}>
              {tracking?.milestones.map((milestone, idx) => (
                <MilestoneRow
                  key={milestone.key}
                  milestone={milestone}
                  isLast={idx === (tracking.milestones.length - 1)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Courier details */}
        {tracking?.courier && !isCancelled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipment Info</Text>
            <CourierCard courier={tracking.courier} />
          </View>
        )}

        {/* Delivery partner (AITS Delivery system) */}
        {tracking?.deliveryPartner && !isCancelled ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Partner</Text>
            <DeliveryPartnerCard partner={tracking.deliveryPartner} />
          </View>
        ) : !isCancelled && tracking && !tracking.isTerminal && (
          <View style={styles.section}>
            <MapStubCard />
          </View>
        )}

        {/* View full order link */}
        <TouchableOpacity
          style={styles.viewOrderBtn}
          onPress={() => router.push(`/order/${id ?? ''}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          <Text style={styles.viewOrderText}>View Full Order Details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  awbText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  callBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  callBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelledBanner: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: 10,
    padding: spacing.lg,
  },
  cancelledText: { color: colors.error, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 3,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardBody: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  cardHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  connector: {
    flex: 1,
    marginVertical: 2,
    width: 2,
  },
  content: {
    gap: spacing.xl,
    padding: spacing.lg,
  },
  deliveredBanner: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: 10,
    padding: spacing.lg,
  },
  deliveredText: { color: colors.success, fontSize: 14, fontWeight: '600' },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: spacing.sm },
  dot: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
    zIndex: 2,
  },
  dotInner: {
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotWrapper: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  errorState: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing['3xl'],
  },
  errorText: { color: colors.textSecondary, fontSize: 14 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerCenter: { flex: 1, gap: 2 },
  headerSub: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  mapBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  mapBtnDisabled: { backgroundColor: colors.surface },
  mapBtnText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  milestoneContent: {
    flex: 1,
    gap: 4,
    paddingBottom: spacing.xl,
    paddingLeft: spacing.md,
  },
  milestoneDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 16 },
  milestoneIconBadge: {
    alignItems: 'center',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  milestoneLabel: { fontSize: 14, fontWeight: '700' },
  milestoneLeft: { alignItems: 'center', width: 36 },
  milestoneMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  milestoneRow: { flexDirection: 'row' },
  milestoneTime: { color: colors.textMuted, fontSize: 11, fontWeight: '500', paddingLeft: 38 },
  milestoneTitleBlock: { flex: 1, gap: 2 },
  partnerActions: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  partnerAvatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  partnerInfo: { flex: 1, gap: 4 },
  partnerName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  partnerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    paddingTop: 0,
  },
  partnerVehicle: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },
  pulseRing: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  ratingText: { color: colors.textSecondary, fontSize: 12 },
  refreshBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingBottom: spacing.sm,
  },
  refreshBadgeText: { color: colors.textMuted, fontSize: 11 },
  refreshBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  retryBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: { color: colors.primary, fontWeight: '700' },
  safe: { backgroundColor: colors.background, flex: 1 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  skeleton: { gap: 0 },
  skeletonContent: { flex: 1, gap: 4, paddingLeft: spacing.md },
  skeletonRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 0,
    marginBottom: spacing.xl,
  },
  stubCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  stubDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  stubTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  timeline: { gap: 0 },
  trackUrlBtn: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  trackUrlText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  viewOrderBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  viewOrderText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
