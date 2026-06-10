/**
 * app/order/[id]/return.tsx — Return Initiation Screen
 *
 * Lets the customer raise a return / refund request for a delivered order.
 *
 * Flow:
 *  1. Item selector    — check items to include (returnable items only)
 *  2. Reason picker    — 5 reasons with icons; "Other" shows a text field
 *  3. Return method    — Doorstep Pickup (default) | Drop-off at Store
 *  4. Photo upload     — optional, shown when reason requires evidence (up to 3)
 *  5. Refund timeline  — "Expected refund: within 7 business days"
 *  6. Submit           — calls initiateReturn(), navigates to return-status
 *
 * Guard: only reachable from the order detail screen when the order is
 * within the 7-day return window AND status = 'delivered'.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { initiateReturn } from '@/api/returns';
import { useOrderDetail } from '@/hooks/useOrders';
import { SkeletonRect } from '@/components/skeletons/SkeletonBase';
import { formatINR } from '@/utils/currency';
import { formatDate } from '@/utils/date';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import {
  RETURN_REASON_META,
  RETURN_METHOD_META,
  getReturnEligibility,
  type ReturnReason,
  type ReturnMethod,
} from '@/types/returns';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PHOTOS     = 3;
const REASONS        = Object.entries(RETURN_REASON_META) as [ReturnReason, typeof RETURN_REASON_META[ReturnReason]][];
const METHODS        = Object.entries(RETURN_METHOD_META) as [ReturnMethod, typeof RETURN_METHOD_META[ReturnMethod]][];
const REFUND_DAYS    = 7;

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ step, title, subtitle }: { step: number; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <View style={styles.sectionMeta}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ReturnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrderDetail(id ?? '');

  // ── Form state ──────────────────────────────────────────────────────────
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [reason,         setReason]          = useState<ReturnReason | null>(null);
  const [reasonDetail,   setReasonDetail]    = useState('');
  const [method,         setMethod]          = useState<ReturnMethod>('pickup');
  const [photoUris,      setPhotoUris]       = useState<string[]>([]);

  // ── Shake animation for unselected required fields ──────────────────────
  const [shakeAnim] = useState(() => new Animated.Value(0));

  // Estimated refund date — computed once at mount, outside render phase
  const [estimatedRefundDate] = useState(() =>
    new Date(
      Date.now() + REFUND_DAYS * 24 * 60 * 60 * 1000
    ).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  );

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── Mutation ────────────────────────────────────────────────────────────
  const { mutate: submitReturn, isPending } = useMutation({
    mutationFn: initiateReturn,
    onSuccess: (res) => {
      router.replace(`/order/${id ?? ''}/return-status?returnId=${res.returnId}`);
    },
    onError: (err) => {
      Alert.alert(
        'Submission Failed',
        err instanceof Error ? err.message : 'Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // ── Photo picker ────────────────────────────────────────────────────────
  const handleAddPhoto = useCallback(async () => {
    if (photoUris.length >= MAX_PHOTOS) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality:    0.7,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUris((prev) => [...prev, result.assets[0].uri]);
    }
  }, [photoUris.length]);

  const handleRemovePhoto = useCallback((uri: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uri));
  }, []);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (selectedItemIds.size === 0 || !reason) {
      shake();
      Alert.alert('Incomplete', 'Please select at least one item and a return reason.');
      return;
    }

    if (reason === 'other' && reasonDetail.trim().length < 10) {
      shake();
      Alert.alert('Details Required', 'Please describe the issue in at least 10 characters.');
      return;
    }

    Alert.alert(
      'Confirm Return Request',
      `Submit a return for ${selectedItemIds.size} item(s)? Our team will contact you within 24 hours.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: () => {
            submitReturn({
              orderId:      id ?? '',
              items:        Array.from(selectedItemIds).map((itemId) => ({
                itemId,
                returnQty: 1,
              })),
              reason,
              reasonDetail: reasonDetail.trim() || undefined,
              method,
              photoUris:    photoUris.length > 0 ? photoUris : undefined,
            });
          },
        },
      ]
    );
  }, [selectedItemIds, reason, reasonDetail, method, photoUris, id, submitReturn, shake]);

  // ── Guard: loading ──────────────────────────────────────────────────────
  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Request</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Window badge skeleton */}
          <View style={[styles.windowBadge, { backgroundColor: colors.border }]}>
            <SkeletonRect width={240} height={14} radius={7} />
          </View>
          {/* Card skeleton */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <SkeletonRect width={24} height={24} radius={12} />
              <View style={[styles.sectionMeta, { marginLeft: 10 }]}>
                <SkeletonRect width="60%" height={16} radius={4} style={{ marginBottom: 4 }} />
                <SkeletonRect width="80%" height={12} radius={3} />
              </View>
            </View>
            <View style={styles.cardBody}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.itemRow}>
                  <SkeletonRect width={22} height={22} radius={6} />
                  <SkeletonRect width={52} height={52} radius={4} style={{ marginLeft: 10 }} />
                  <View style={{ flex: 1, gap: 4, marginLeft: 10 }}>
                    <SkeletonRect width="80%" height={14} radius={3} />
                    <SkeletonRect width="40%" height={12} radius={3} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Guard: eligibility ──────────────────────────────────────────────────
  const deliveredAt  = order.updatedAt;
  const eligibility  = getReturnEligibility(deliveredAt);

  if (!eligibility.eligible) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Return Request</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Ionicons name="time-outline" size={48} color={colors.textMuted} />
          <Text style={styles.ineligibleTitle}>Return Window Closed</Text>
          <Text style={styles.ineligibleSub}>
            Returns are accepted within {REFUND_DAYS} days of delivery.{'\n'}
            Deadline was {formatDate(eligibility.deadline)}.
          </Text>
          <TouchableOpacity style={styles.helpLink} onPress={() => router.back()}>
            <Text style={styles.helpLinkText}>Contact Support for Help</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const requiresPhoto = reason ? RETURN_REASON_META[reason].requiresPhoto : false;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Return Request</Text>
          <Text style={styles.headerSub}>{order.orderNumber}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Return window badge */}
      <View style={styles.windowBadge}>
        <Ionicons name="time-outline" size={14} color={colors.warning} />
        <Text style={styles.windowText}>
          {eligibility.daysRemaining} day{eligibility.daysRemaining !== 1 ? 's' : ''} left to return
          · Deadline {formatDate(eligibility.deadline)}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Step 1: Select Items ────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={styles.card}>
            <SectionHeader
              step={1}
              title="Select Items to Return"
              subtitle="Only delivered items can be returned"
            />

            <View style={styles.cardBody}>
              {order.items.map((item, idx) => {
                const itemId    = String(idx);
                const isChecked = selectedItemIds.has(itemId);
                return (
                  <TouchableOpacity
                    key={itemId}
                    style={[styles.itemRow, isChecked && styles.itemRowSelected]}
                    onPress={() => {
                      setSelectedItemIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(itemId)) next.delete(itemId);
                        else next.add(itemId);
                        return next;
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Checkbox */}
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>

                    {/* Item image */}
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImg} />
                    ) : (
                      <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                        <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                      </View>
                    )}

                    {/* Item info */}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.itemMeta}>
                        Qty: {item.quantity}  ·  {formatINR(item.price)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* ── Step 2: Reason ─────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
          <View style={styles.card}>
            <SectionHeader step={2} title="Why are you returning?" />
            <View style={styles.cardBody}>
              {REASONS.map(([key, meta]) => {
                const isSelected = reason === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.reasonRow, isSelected && styles.reasonRowSelected]}
                    onPress={() => setReason(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.reasonIcon, isSelected && styles.reasonIconSelected]}>
                      <Ionicons
                        name={meta.icon as React.ComponentProps<typeof Ionicons>['name']}
                        size={18}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                      {meta.label}
                    </Text>
                    {meta.requiresPhoto && (
                      <View style={styles.photoRequiredBadge}>
                        <Ionicons name="camera-outline" size={12} color={colors.warning} />
                        <Text style={styles.photoRequiredText}>Photo</Text>
                      </View>
                    )}
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* "Other" free-text field */}
              {reason === 'other' && (
                <TextInput
                  style={styles.reasonTextInput}
                  placeholder="Describe the issue (min 10 characters)…"
                  placeholderTextColor={colors.textMuted}
                  value={reasonDetail}
                  onChangeText={setReasonDetail}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                />
              )}
            </View>
          </View>
        </Animated.View>

        {/* ── Step 3: Return Method ───────────────────────────────────── */}
        <View style={styles.card}>
          <SectionHeader step={3} title="Return Method" />
          <View style={styles.cardBody}>
            {METHODS.map(([key, meta]) => {
              const isSelected = method === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.methodRow, isSelected && styles.methodRowSelected]}
                  onPress={() => setMethod(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.methodIcon, isSelected && styles.methodIconSelected]}>
                    <Ionicons
                      name={meta.icon as React.ComponentProps<typeof Ionicons>['name']}
                      size={22}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={[styles.methodLabel, isSelected && { color: colors.primary }]}>
                      {meta.label}
                      {key === 'pickup' && (
                        <Text style={styles.defaultTag}>  Recommended</Text>
                      )}
                    </Text>
                    <Text style={styles.methodDesc}>{meta.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Step 4: Photo Upload (conditional) ─────────────────────── */}
        <View style={styles.card}>
          <SectionHeader
            step={4}
            title="Photo Evidence"
            subtitle={requiresPhoto
              ? 'Required for this return reason (up to 3 photos)'
              : 'Optional — photos help us process your return faster'}
          />
          <View style={styles.cardBody}>
            <View style={styles.photoGrid}>
              {photoUris.map((uri) => (
                <View key={uri} style={styles.photoThumb}>
                  <Image source={{ uri }} style={styles.photoImg} />
                  <TouchableOpacity
                    style={styles.photoRemove}
                    onPress={() => handleRemovePhoto(uri)}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {photoUris.length < MAX_PHOTOS && (
                <TouchableOpacity
                  style={styles.photoAdd}
                  onPress={() => { void handleAddPhoto(); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={28} color={colors.textMuted} />
                  <Text style={styles.photoAddText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {photoUris.length === 0 && requiresPhoto && (
              <View style={styles.photoHint}>
                <Ionicons name="information-circle-outline" size={15} color={colors.warning} />
                <Text style={styles.photoHintText}>
                  Please upload a photo showing the {reason === 'damaged_product' ? 'damage' : 'wrong item'}.
                  This speeds up your refund.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Refund Timeline Card ────────────────────────────────────── */}
        <View style={styles.refundCard}>
          <View style={styles.refundCardHeader}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
            <Text style={styles.refundCardTitle}>Expected Refund Timeline</Text>
          </View>
          <View style={styles.refundSteps}>
            {[
              { label: 'Return accepted',    days: '1–2 days' },
              { label: 'Quality inspection', days: '2–3 days' },
              { label: 'Refund initiated',   days: '5–7 days' },
              { label: 'Amount credited',    days: 'By ' + estimatedRefundDate },
            ].map((step, i, arr) => (
              <View key={i} style={styles.refundStep}>
                <View style={styles.refundStepLeft}>
                  <View style={styles.refundDot} />
                  {i < arr.length - 1 && <View style={styles.refundLine} />}
                </View>
                <View style={styles.refundStepRight}>
                  <Text style={styles.refundStepLabel}>{step.label}</Text>
                  <Text style={styles.refundStepDays}>{step.days}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={styles.refundNote}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
            <Text style={styles.refundNoteText}>
              Refund will be credited to your original payment method
            </Text>
          </View>
        </View>

        {/* ── Submit Button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (isPending || selectedItemIds.size === 0 || !reason) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="return-down-back-outline" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Return Request</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
  cardBody: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingTop: 0,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  defaultTag: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '700',
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
  helpLink: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  helpLinkText: { color: colors.primary, fontWeight: '700' },
  ineligibleSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  ineligibleTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  itemImg: {
    borderRadius: borderRadius.sm,
    height: 52,
    width: 52,
  },
  itemImgPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 3 },
  itemMeta: { color: colors.textSecondary, fontSize: 12 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  itemRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  itemRowSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  methodDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 2 },
  methodIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  methodIconSelected: { backgroundColor: colors.primaryLight },
  methodInfo: { flex: 1 },
  methodLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  methodRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  methodRowSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  photoAdd: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: 6,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  photoAddText: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  photoHint: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  photoHintText: { color: colors.warning, flex: 1, fontSize: 12, lineHeight: 16 },
  photoImg: { borderRadius: borderRadius.md, height: 88, width: 88 },
  photoRemove: {
    position: 'absolute',
    right: -8,
    top: -8,
  },
  photoRequiredBadge: {
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  photoRequiredText: { color: colors.warning, fontSize: 10, fontWeight: '700' },
  photoThumb: { position: 'relative' },
  radioInner: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioOuterSelected: { borderColor: colors.primary },
  reasonIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  reasonIconSelected: { backgroundColor: colors.primaryLight },
  reasonLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  reasonLabelSelected: { color: colors.primary },
  reasonRow: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  reasonRowSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  reasonTextInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  refundCard: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '33',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  refundCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  refundCardTitle: { color: colors.success, fontSize: 15, fontWeight: '800' },
  refundDot: {
    backgroundColor: colors.success,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  refundLine: {
    backgroundColor: colors.success + '44',
    flex: 1,
    marginVertical: 2,
    width: 2,
  },
  refundNote: {
    alignItems: 'center',
    borderTopColor: colors.success + '33',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  refundNoteText: { color: colors.success, flex: 1, fontSize: 12, fontWeight: '500' },
  refundStep: { flexDirection: 'row', gap: spacing.md, minHeight: 48 },
  refundStepDays: { color: colors.success, fontSize: 12, fontWeight: '700', marginTop: 2 },
  refundStepLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  refundStepLeft: { alignItems: 'center', width: 14 },
  refundStepRight: { flex: 1, paddingBottom: spacing.md },
  refundSteps: { gap: 0 },
  safe: { backgroundColor: colors.background, flex: 1 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionMeta: { flex: 1, gap: 2 },
  sectionSub: { color: colors.textSecondary, fontSize: 12 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stepNum: { color: '#fff', fontSize: 12, fontWeight: '800' },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    elevation: 4,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitBtnDisabled: { backgroundColor: colors.textMuted, elevation: 0, shadowOpacity: 0 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  windowBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
  },
  windowText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
});
