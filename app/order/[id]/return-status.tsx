/**
 * app/order/[id]/return-status.tsx — Return Status Tracking Screen
 *
 * Tracks the progress of a submitted return request.
 *
 * Features:
 *  • Vertical milestone timeline matching the order tracking UX
 *    Milestones: Return Requested → Pickup Scheduled → Item Picked Up
 *               → Quality Check → Refund Initiated → Refund Credited
 *  • Animated pulse on the currently active step
 *  • Refund method + amount card
 *  • Auto-refresh every 60 s (stops once terminal)
 *  • Deep-linkable via /order/[id]/return-status?returnId=RTN-XXXXX
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getReturnStatus } from '@/api/returns';
import { formatDate, formatTime } from '@/utils/date';
import { formatINR } from '@/utils/currency';
import { SkeletonCircle, SkeletonRect } from '@/components/skeletons/SkeletonBase';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import type { ReturnMilestone, RefundInfo } from '@/types/returns';

// ── Constants ─────────────────────────────────────────────────────────────────

const REFETCH_INTERVAL_MS = 60_000;

// ── Milestone colours ─────────────────────────────────────────────────────────

const MILESTONE_COLORS = {
  completed: { dot: colors.success,  line: colors.success,  text: colors.text,      icon: '#fff' },
  active:    { dot: colors.primary,  line: colors.border,   text: colors.primary,   icon: '#fff' },
  pending:   { dot: colors.border,   line: colors.border,   text: colors.textMuted, icon: colors.textMuted },
  failed:    { dot: colors.error,    line: colors.error,    text: colors.error,     icon: '#fff' },
} as const;

// ── Animated pulse (reused from order tracking) ───────────────────────────────

function PulseRing({ color }: { color: string }) {
  const [scale]   = useState(() => new Animated.Value(1));
  const [opacity] = useState(() => new Animated.Value(0.7));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.9, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,   duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
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
        { backgroundColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
}

// ── Milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  isLast,
}: {
  milestone: ReturnMilestone;
  isLast:    boolean;
}) {
  const palette = MILESTONE_COLORS[milestone.status];

  return (
    <View style={styles.milestoneRow}>
      {/* Left: dot + connector */}
      <View style={styles.milestoneLeft}>
        <View style={styles.dotWrapper}>
          {milestone.status === 'active' && <PulseRing color={palette.dot} />}
          <View style={[styles.dot, { backgroundColor: palette.dot }]}>
            {milestone.status === 'completed' && (
              <Ionicons name="checkmark" size={12} color="#fff" />
            )}
            {milestone.status === 'active' && (
              <View style={styles.dotInner} />
            )}
            {milestone.status === 'failed' && (
              <Ionicons name="close" size={12} color="#fff" />
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

      {/* Right: label, description, timestamp */}
      <View style={[styles.milestoneContent, isLast && styles.milestoneContentLast]}>
        <View style={styles.milestoneMeta}>
          <View
            style={[
              styles.milestoneIconBadge,
              { backgroundColor: palette.dot + '18' },
            ]}
          >
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
            {milestone.failureNote && (
              <Text style={styles.failureNote}>{milestone.failureNote}</Text>
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

// ── Refund info card ──────────────────────────────────────────────────────────

const REFUND_METHOD_LABEL: Record<string, string> = {
  original_payment: 'Original Payment Method',
  store_credit:     'AITS Store Credit',
  bank_transfer:    'Bank Transfer (NEFT)',
  upi:              'UPI Transfer',
};

function RefundCard({ refund }: { refund: RefundInfo }) {
  const methodLabel = REFUND_METHOD_LABEL[refund.method] ?? refund.method;

  return (
    <View style={styles.refundCard}>
      <View style={styles.refundCardHeader}>
        <Ionicons name="cash-outline" size={20} color={colors.success} />
        <Text style={styles.refundCardTitle}>Refund Information</Text>
      </View>

      <View style={styles.refundBody}>
        {refund.amount > 0 && (
          <View style={styles.refundAmountRow}>
            <Text style={styles.refundAmountLabel}>Refund Amount</Text>
            <Text style={styles.refundAmount}>{formatINR(refund.amount)}</Text>
          </View>
        )}

        <View style={styles.refundInfoRow}>
          <Text style={styles.refundInfoLabel}>Method</Text>
          <Text style={styles.refundInfoValue}>{methodLabel}</Text>
        </View>

        {refund.estimatedDate && !refund.creditedAt && (
          <View style={styles.refundInfoRow}>
            <Text style={styles.refundInfoLabel}>Expected By</Text>
            <Text style={[styles.refundInfoValue, { color: colors.primary }]}>
              {formatDate(refund.estimatedDate)}
            </Text>
          </View>
        )}

        {refund.creditedAt && (
          <View style={styles.refundInfoRow}>
            <Text style={styles.refundInfoLabel}>Credited On</Text>
            <Text style={[styles.refundInfoValue, { color: colors.success }]}>
              {formatDate(refund.creditedAt)}
            </Text>
          </View>
        )}

        {refund.referenceId && (
          <View style={styles.refundInfoRow}>
            <Text style={styles.refundInfoLabel}>Reference ID</Text>
            <Text
              style={[
                styles.refundInfoValue,
                styles.refundMonospace,
              ]}
            >
              {refund.referenceId}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.skeletonRow}>
          <SkeletonCircle size={28} />
          <View style={styles.skeletonContent}>
            <SkeletonRect width="50%" height={14} radius={4} />
            <SkeletonRect width="75%" height={14} radius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReturnStatusScreen() {
  const { id, returnId } = useLocalSearchParams<{ id: string; returnId: string }>();

  const {
    data:         returnRecord,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey:        ['return-status', returnId],
    queryFn:         () => getReturnStatus(returnId ?? ''),
    enabled:         !!returnId,
    refetchInterval: (query) => {
      if (query.state.data?.isTerminal) return false;
      return REFETCH_INTERVAL_MS;
    },
    staleTime: 30_000,
  });

  const lastRefreshed = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', {
        hour:   '2-digit',
        minute: '2-digit',
      })
    : null;

  const isRejected  = returnRecord?.overallStatus === 'rejected';
  const isCompleted = returnRecord?.overallStatus === 'completed';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Return Status</Text>
          {returnRecord?.orderNumber && (
            <Text style={styles.headerSub}>{returnRecord.orderNumber}</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => void refetch()} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Auto-refresh badge */}
      {lastRefreshed && !isLoading && (
        <View style={styles.refreshBadge}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.refreshBadgeText}>Updated {lastRefreshed}</Text>
          {!returnRecord?.isTerminal && (
            <Text style={styles.refreshBadgeText}> · auto-refresh every 60s</Text>
          )}
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Outcome banners */}
        {isCompleted && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={styles.successBannerText}>
              Refund has been credited to your account! 🎉
            </Text>
          </View>
        )}

        {isRejected && (
          <View style={styles.rejectedBanner}>
            <Ionicons name="close-circle" size={22} color={colors.error} />
            <View style={styles.rejectedFlex}>
              <Text style={styles.rejectedTitle}>Return Rejected</Text>
              <Text style={styles.rejectedSub}>
                The returned item did not pass quality inspection.
                Please contact support for assistance.
              </Text>
            </View>
          </View>
        )}

        {/* Milestone timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Return Progress</Text>
          {isLoading ? (
            <View style={styles.card}>
              <Skeleton />
            </View>
          ) : isError ? (
            <View style={styles.errorState}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.textMuted} />
              <Text style={styles.errorText}>Couldn&apos;t load return status.</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => void refetch()}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.timeline}>
                {returnRecord?.milestones.map((m, idx) => (
                  <MilestoneRow
                    key={m.key}
                    milestone={m}
                    isLast={idx === (returnRecord.milestones.length - 1)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Return details */}
        {returnRecord && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Return Details</Text>
            <View style={styles.card}>
              <View style={styles.detailBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Return ID</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      styles.refundMonospace,
                    ]}
                  >
                    {returnRecord.returnId}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>
                    {returnRecord.reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method</Text>
                  <Text style={styles.detailValue}>
                    {returnRecord.method === 'pickup' ? 'Doorstep Pickup' : 'Drop-off at Store'}
                  </Text>
                </View>
                {returnRecord.pickupAddress && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Pickup Address</Text>
                      <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                        {returnRecord.pickupAddress}
                      </Text>
                    </View>
                  </>
                )}
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested On</Text>
                  <Text style={styles.detailValue}>{formatDate(returnRecord.createdAt)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Items being returned */}
        {returnRecord && returnRecord.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items Returned</Text>
            <View style={styles.card}>
              {returnRecord.items.map((item, idx) => (
                <View
                  key={item.itemId}
                  style={[
                    styles.returnItemRow,
                    idx > 0 && styles.returnItemBorder,
                  ]}
                >
                  <View style={styles.returnItemIcon}>
                    <Ionicons name="cube-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.returnItemInfo}>
                    <Text style={styles.returnItemName}>{item.name || `Item ${idx + 1}`}</Text>
                    <Text style={styles.returnItemMeta}>
                      Return qty: {item.returnQty}
                      {item.price > 0 ? `  ·  ${formatINR(item.price)}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Refund card */}
        {returnRecord?.refund && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Refund</Text>
            <RefundCard refund={returnRecord.refund} />
          </View>
        )}

        {/* Help / contact */}
        <TouchableOpacity
          style={styles.helpCard}
          onPress={() => router.push(`/order/${id ?? ''}`)}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
          <Text style={styles.helpText}>Need help with this return?</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  connector: {
    flex: 1,
    marginVertical: 2,
    width: 2,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  detailBody: {
    padding: spacing.lg,
  },
  detailLabel: { color: colors.textSecondary, fontSize: 13 },
  detailRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  detailValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: spacing.sm },
  dot: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
    zIndex: 2,
  },
  dotInner: { backgroundColor: '#fff', borderRadius: 4, height: 8, width: 8 },
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
  failureNote: {
    backgroundColor: colors.errorLight,
    borderRadius: 6,
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
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
  helpCard: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  helpText: { color: colors.primary, flex: 1, fontSize: 14, fontWeight: '600' },
  milestoneContent: {
    flex: 1,
    gap: 4,
    paddingBottom: spacing.xl,
    paddingLeft: spacing.md,
  },
  milestoneContentLast: { paddingBottom: 0 },
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
  pulseRing: {
    borderRadius: 18,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
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
  refundAmount: { color: colors.success, fontSize: 20, fontWeight: '800' },
  refundAmountLabel: { color: colors.textSecondary, fontSize: 13 },
  refundAmountRow: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  refundBody: { padding: spacing.lg, paddingTop: 0 },
  refundCard: {
    backgroundColor: colors.white,
    borderColor: colors.success + '44',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  refundCardHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: spacing.lg,
  },
  refundCardTitle: { color: colors.success, fontSize: 15, fontWeight: '800' },
  refundInfoLabel: { color: colors.textSecondary, fontSize: 13 },
  refundInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  refundInfoValue: { color: colors.text, fontSize: 13, fontWeight: '600' },
  refundMonospace: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  rejectedBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  rejectedFlex: { flex: 1 },
  rejectedSub: { color: colors.error, fontSize: 12, lineHeight: 17, marginTop: 3 },
  rejectedTitle: { color: colors.error, fontSize: 14, fontWeight: '700' },
  retryBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  retryText: { color: colors.primary, fontWeight: '700' },
  returnItemBorder: { borderTopColor: colors.border, borderTopWidth: 1 },
  returnItemIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  returnItemInfo: { flex: 1, gap: 3 },
  returnItemMeta: { color: colors.textSecondary, fontSize: 12 },
  returnItemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  returnItemRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  safe: { backgroundColor: colors.background, flex: 1 },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  skeletonContent: { flex: 1, gap: 4, paddingLeft: spacing.md },
  skeletonRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  skeletonWrap: { gap: 0, padding: spacing.lg },
  successBanner: {
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  successBannerText: { color: colors.success, flex: 1, fontSize: 14, fontWeight: '600' },
  timeline: { gap: 0, padding: spacing.lg },
});
