import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';
import {
  fetchMySubscriptions,
  skipSubscriptionDate,
  pauseSubscription,
  removeSubscriptionPause,
  resumeSubscription,
  cancelSubscription,
  updateSubscriptionAddress,
  paySubscriptionBill,
  fetchDeliveryDetails,
} from '@/api/subscriptions';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import type { Subscription, DeliveryAddress } from '@/types/subscription';
import { getErrorMessage } from '@/api/client';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Interactive Delivery Calendar — multi-month navigation */
function DeliveryCalendar({
  sub,
  onDateClick,
}: {
  sub: Subscription;
  onDateClick: (dateStr: string, currentState: 'active' | 'skipped') => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(calYear, calMonth, 1);
  const startWeekday = firstDay.getDay(); // 0 = Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const cells: (Date | null)[] = Array(startWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(calYear, calMonth, d));
  }

  const skipDateStrings = new Set((sub.skipDates || []).map((s) => toYMD(new Date(s))));
  const pauseRanges = (sub.pauses || []).map((p) => ({
    from: new Date(p.from),
    to: new Date(p.to),
  }));

  const subStart = new Date(sub.startDate);
  subStart.setHours(0, 0, 0, 0);
  const subEnd = new Date(sub.endDate);
  subEnd.setHours(23, 59, 59, 999);

  function getCellState(d: Date) {
    const s = toYMD(d);
    if (d < subStart || d > subEnd) return 'out-of-range';
    if (skipDateStrings.has(s)) return 'skipped';
    if (pauseRanges.some((r) => d >= r.from && d <= r.to)) return 'paused';
    return 'active';
  }

  const monthName = firstDay.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <View>
      {/* Month navigation */}
      <View style={styles.calNav}>
        <TouchableOpacity
          style={styles.calNavBtn}
          onPress={() => {
            if (calMonth === 0) {
              setCalYear((y) => y - 1);
              setCalMonth(11);
            } else {
              setCalMonth((m) => m - 1);
            }
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.calTitle}>{monthName}</Text>
        <TouchableOpacity
          style={styles.calNavBtn}
          onPress={() => {
            if (calMonth === 11) {
              setCalYear((y) => y + 1);
              setCalMonth(0);
            } else {
              setCalMonth((m) => m + 1);
            }
          }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Day labels */}
      <View style={styles.calDayLabels}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <Text key={i} style={styles.calDayLabel}>{d}</Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.calGrid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`empty-${i}`} style={styles.calCell} />;
          const state = getCellState(d);
          const dateStr = toYMD(d);
          const isToday = dateStr === toYMD(today);
          const isPast = d < today;

          const canClick =
            sub.status !== 'cancelled' &&
            !isPast &&
            (state === 'active' || state === 'skipped');

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.calCell,
                styles.calDayCell,
                state === 'skipped' && styles.calCellSkipped,
                state === 'paused' && styles.calCellPaused,
                state === 'out-of-range' && styles.calCellOutRange,
                isToday && styles.calCellToday,
              ]}
              onPress={() => canClick && onDateClick(dateStr, state as 'active' | 'skipped')}
              disabled={!canClick}
            >
              <Text
                style={[
                  styles.calDayNum,
                  state === 'skipped' && { color: '#ef4444', fontWeight: '800' },
                  state === 'paused' && { color: '#d97706', fontWeight: '700' },
                  state === 'out-of-range' && { color: '#d1d5db' },
                  isToday && { color: colors.primary, fontWeight: '900' },
                ]}
              >
                {d.getDate()}
              </Text>
              {state === 'skipped' && <Text style={styles.calDotSkip}>✕</Text>}
              {state === 'paused' && <Text style={styles.calDotPause}>⏸</Text>}
              {state === 'active' && !isPast && <View style={styles.calDotActive} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.calLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Scheduled</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Skipped</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Paused</Text>
        </View>
      </View>
    </View>
  );
}

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Pause modal
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseFrom, setPauseFrom] = useState('');
  const [pauseTo, setPauseTo] = useState('');
  const [pauseLoading, setPauseLoading] = useState(false);

  // Delete Pause modal
  const [deletePauseTarget, setDeletePauseTarget] = useState<{ from: string; to: string } | null>(null);
  const [deletePauseLoading, setDeletePauseLoading] = useState(false);

  // Cancel Subscription modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Skipped Dates modal
  const [showSkipModal, setShowSkipModal] = useState(false);

  // Completed Delivery details modal
  const [deliveryDetails, setDeliveryDetails] = useState<{
    visible: boolean;
    loading: boolean;
    data: any;
    dateStr?: string;
  }>({ visible: false, loading: false, data: null });

  // Address modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState<DeliveryAddress>({
    fullName: '', phone: '', address1: '', city: '', state: '', pin: '', country: 'India',
  });
  const [addressLoading, setAddressLoading] = useState(false);

  // Bill payment loading
  const [payBillLoading, setPayBillLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchMySubscriptions();
      const found = list.find((s) => s._id === id);
      if (found) {
        setSub(found);
        setNewAddress(found.deliveryAddress || newAddress);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { void load(); }, [id]));

  const handleDateClick = async (dateStr: string, currentState: string, deliveryId?: string) => {
    if (deliveryId || currentState === 'delivered') {
      setDeliveryDetails({ visible: true, loading: true, data: null, dateStr });
      try {
        if (deliveryId) {
          const detail = await fetchDeliveryDetails(deliveryId);
          setDeliveryDetails({ visible: true, loading: false, data: detail, dateStr });
        } else {
          setDeliveryDetails({
            visible: true,
            loading: false,
            data: {
              documentNumberDelivery: `DEL-${dateStr}`,
              deliveryDate: dateStr,
              deliveryStatus: 'delivered',
              items: [{ itemName: sub?.itemName, quantity: sub?.quantityPerDelivery, totalAmount: sub?.pricePerDelivery }],
              proofPhoto: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80',
              deliveryNotes: 'Delivered at doorstep',
            },
            dateStr,
          });
        }
      } catch {
        setDeliveryDetails((prev) => ({ ...prev, loading: false }));
      }
      return;
    }

    const isSkipped = currentState === 'skipped';
    try {
      const action = isSkipped ? 'unskip' : 'skip';
      const result = await skipSubscriptionDate(id!, dateStr, action);
      setSub(result.subscription);
      Toast.show({
        type: 'success',
        text1: isSkipped ? 'Delivery Resumed' : 'Delivery Skipped',
        text2: `Delivery on ${dateStr} updated.`,
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handleToggleSkip = async (dateStr: string, action: 'skip' | 'unskip') => {
    try {
      const result = await skipSubscriptionDate(id!, dateStr, action);
      setSub(result.subscription);
      Toast.show({
        type: 'success',
        text1: action === 'unskip' ? 'Delivery Resumed' : 'Delivery Skipped',
        text2: `Delivery on ${dateStr} updated.`,
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handlePause = async () => {
    if (!pauseFrom || !pauseTo) {
      Alert.alert('Error', 'Both start and resume dates are required');
      return;
    }
    setPauseLoading(true);
    try {
      const result = await pauseSubscription(id!, pauseFrom, pauseTo);
      setSub(result.subscription);
      setShowPauseModal(false);
      Toast.show({
        type: 'success',
        text1: 'Pause Scheduled',
        text2: `End date extended to ${formatDate(result.subscription.endDate)}`,
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setPauseLoading(false);
    }
  };

  const confirmDeletePause = async () => {
    if (!deletePauseTarget) return;
    setDeletePauseLoading(true);
    try {
      const result = await removeSubscriptionPause(id!, deletePauseTarget.from, deletePauseTarget.to);
      setSub(result.subscription);
      setDeletePauseTarget(null);
      Toast.show({ type: 'success', text1: 'Pause period removed successfully' });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setDeletePauseLoading(false);
    }
  };

  const confirmCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const result = await cancelSubscription(id!);
      setSub(result.subscription);
      setShowCancelModal(false);
      Toast.show({ type: 'info', text1: 'Subscription Cancelled' });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setCancelLoading(false);
    }
  };

  const handleResumeNow = async () => {
    try {
      const result = await resumeSubscription(id!);
      setSub(result.subscription);
      Toast.show({ type: 'success', text1: 'Subscription resumed to Active status' });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    }
  };

  const handlePayBill = async () => {
    setPayBillLoading(true);
    try {
      const result = await paySubscriptionBill(id!, 'online');
      setSub(result.subscription);
      Toast.show({
        type: 'success',
        text1: '🎉 Bill Paid Successfully!',
        text2: 'Next delivery cycle activated.',
      });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setPayBillLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!newAddress.pin || !newAddress.address1) {
      Alert.alert('Error', 'Address line 1 and pincode are required');
      return;
    }
    setAddressLoading(true);
    try {
      const result = await updateSubscriptionAddress(id!, newAddress);
      setSub(result.subscription);
      setShowAddressModal(false);
      Toast.show({ type: 'success', text1: 'Delivery address updated' });
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setAddressLoading(false);
    }
  };

  const setPresetPauseDays = (days: number) => {
    const from = new Date();
    from.setDate(from.getDate() + 1);
    const to = new Date(from);
    to.setDate(to.getDate() + days - 1);
    setPauseFrom(toYMD(from));
    setPauseTo(toYMD(to));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!sub) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}><Text style={styles.errorText}>Subscription not found</Text></View>
      </SafeAreaView>
    );
  }

  const isActive = sub.status === 'active' || sub.status === 'paused';
  const isBillDue = sub.billingStatus === 'due' || sub.billingStatus === 'overdue';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{sub.itemName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Bill Due Loss Prevention Card */}
        {isBillDue && (
          <View style={styles.billDueCard}>
            <View style={styles.billDueHeader}>
              <Ionicons name="card" size={24} color="#991b1b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.billDueTitle}>30-Day Billing Cycle Due</Text>
                <Text style={styles.billDueSubtitle}>
                  Bill Amount: ₹{(sub.cycleTotalAmount || sub.totalAmount).toFixed(2)}
                </Text>
              </View>
            </View>
            <Text style={styles.billDueDesc}>
              Deliveries are temporarily paused until payment is completed to avoid disruption of your service.
            </Text>
            <TouchableOpacity
              style={[styles.payBillBtn, payBillLoading && { opacity: 0.6 }]}
              onPress={handlePayBill}
              disabled={payBillLoading}
            >
              {payBillLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.payBillBtnText}>
                    Pay ₹{(sub.cycleTotalAmount || sub.totalAmount).toFixed(2)} Now
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Status banner */}
        <View style={[styles.statusBanner, {
          backgroundColor: sub.status === 'active' ? '#dcfce7' : sub.status === 'paused' ? '#fef9c3' : sub.status === 'completed' ? '#dbeafe' : '#fee2e2'
        }]}>
          <Text style={[styles.statusBannerText, {
            color: sub.status === 'active' ? '#166534' : sub.status === 'paused' ? '#854d0e' : sub.status === 'completed' ? '#1e40af' : '#991b1b'
          }]}>
            {sub.status.toUpperCase()} · {sub.deliveriesCompleted}/{sub.totalDeliveries} deliveries completed
          </Text>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Row label="Item" value={`${sub.quantityPerDelivery} ${sub.unit} / delivery`} />
          <Row label="Plan" value={`${sub.planType.charAt(0).toUpperCase() + sub.planType.slice(1)} — ${sub.totalDeliveries} deliveries`} />
          <Row label="Frequency" value={sub.frequency === 'daily' ? 'Daily' : sub.frequency === 'alternate_days' ? 'Alternate Days' : 'Custom Days'} />
          <Row label="Start" value={formatDate(sub.startDate)} />
          <Row label="End" value={formatDate(sub.endDate)} />
          <Row label="Total Amount" value={`₹${sub.totalAmount.toFixed(2)}`} />
          <Row label="Payment" value={
            sub.paymentMethod === 'cod' ? 'Cash on Delivery' :
            sub.paymentStatus === 'paid' ? 'Online (Paid)' :
            sub.paymentStatus === 'cod_pending' ? 'Cash on Delivery' :
            'Pending'
          } />
          <Row label="Delivery Window" value="3:00–7:00 AM daily" last />
        </View>

        {/* Calendar — multi-month interactive calendar */}
        {sub.status !== 'cancelled' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Calendar</Text>
            <Text style={styles.sectionSubtitle}>Tap a scheduled date to skip, or a skipped date to resume</Text>
            <DeliveryCalendar sub={sub} onDateClick={handleDateClick} />
          </View>
        )}

        {/* Skipped Dates Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skipped Delivery Dates</Text>
            <Text style={styles.emptyText}>({sub.skipDates?.length || 0} dates skipped)</Text>
          </View>
          {(!sub.skipDates || sub.skipDates.length === 0) ? (
            <Text style={styles.emptyText}>No delivery dates currently skipped</Text>
          ) : (
            sub.skipDates.map((s, i) => {
              const dateStr = toYMD(new Date(s));
              return (
                <View key={i} style={styles.pauseRowCard}>
                  <View style={styles.pauseRowLeft}>
                    <Ionicons name="close-circle" size={18} color="#ef4444" />
                    <Text style={styles.pauseText}>{formatDate(s)}</Text>
                  </View>
                  {isActive && (
                    <TouchableOpacity
                      style={styles.removePauseBtn}
                      onPress={() => void handleToggleSkip(dateStr, 'unskip')}
                    >
                      <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '800' }}>Resume</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Pause ranges */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pause Periods</Text>
            {isActive && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowPauseModal(true)}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.addBtnText}>Add Pause</Text>
              </TouchableOpacity>
            )}
          </View>

          {sub.status === 'paused' && (
            <TouchableOpacity style={styles.resumeNowBtn} onPress={handleResumeNow}>
              <Ionicons name="play-circle-outline" size={18} color="#166534" />
              <Text style={styles.resumeNowText}>Resume Deliveries Immediately</Text>
            </TouchableOpacity>
          )}

          {(!sub.pauses || sub.pauses.length === 0) ? (
            <Text style={styles.emptyText}>No pauses scheduled</Text>
          ) : (
            sub.pauses.map((p, i) => (
              <View key={i} style={styles.pauseRowCard}>
                <View style={styles.pauseRowLeft}>
                  <Ionicons name="pause-circle" size={18} color="#f59e0b" />
                  <Text style={styles.pauseText}>{formatDate(p.from)} → {formatDate(p.to)}</Text>
                </View>
                {isActive && (
                  <TouchableOpacity
                    style={styles.removePauseBtn}
                    onPress={() => setDeletePauseTarget({ from: p.from, to: p.to })}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Delivery address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            {isActive && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddressModal(true)}>
                <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                <Text style={styles.addBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {sub.deliveryAddress ? (
            <Text style={styles.addressText}>
              {sub.deliveryAddress.fullName}{'\n'}
              {sub.deliveryAddress.address1}
              {sub.deliveryAddress.address2 ? ', ' + sub.deliveryAddress.address2 : ''}{'\n'}
              {sub.deliveryAddress.city}, {sub.deliveryAddress.state} - {sub.deliveryAddress.pin}
            </Text>
          ) : (
            <Text style={styles.emptyText}>No address on file</Text>
          )}
        </View>

        {/* Cancel button */}
        {isActive && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCancelModal(true)}>
            <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
            <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Delete Pause Modal */}
      <Modal visible={!!deletePauseTarget} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Pause Period?</Text>
            <Text style={styles.modalNote}>
              Remove pause range ({formatDate(deletePauseTarget?.from || '')} → {formatDate(deletePauseTarget?.to || '')})? End date will be recalculated.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeletePauseTarget(null)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#ef4444' }, deletePauseLoading && { opacity: 0.6 }]}
                onPress={confirmDeletePause}
                disabled={deletePauseLoading}
              >
                {deletePauseLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmBtnText}>Delete Pause</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Subscription Modal */}
      <Modal visible={showCancelModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Subscription?</Text>
            <Text style={styles.modalNote}>
              Are you sure you want to cancel this subscription? Scheduled future deliveries will be cancelled. This action cannot be undone.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowCancelModal(false)}>
                <Text style={styles.modalCancelBtnText}>Keep Subscription</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#ef4444' }, cancelLoading && { opacity: 0.6 }]}
                onPress={confirmCancelSubscription}
                disabled={cancelLoading}
              >
                {cancelLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalConfirmBtnText}>Confirm Cancel</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completed Delivery Details Modal with Proof Photo */}
      <Modal visible={deliveryDetails.visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.modalTitle}>Delivery Details</Text>
              <TouchableOpacity onPress={() => setDeliveryDetails((p) => ({ ...p, visible: false }))}>
                <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {deliveryDetails.loading ? (
              <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 20 }} />
            ) : deliveryDetails.data ? (
              <ScrollView style={{ maxHeight: 400 }}>
                <View style={[styles.statusBanner, { backgroundColor: '#dcfce7', marginBottom: 12 }]}>
                  <Text style={[styles.statusBannerText, { color: '#166534' }]}>
                    {deliveryDetails.data.deliveryStatus?.toUpperCase() || 'DELIVERED'}
                  </Text>
                </View>

                <Row label="Order #" value={deliveryDetails.data.documentNumberDelivery || `DEL-${deliveryDetails.dateStr}`} />
                <Row label="Delivery Date" value={formatDate(deliveryDetails.data.deliveryDate || deliveryDetails.dateStr)} />
                {deliveryDetails.data.deliveredAt && (
                  <Row label="Delivered At" value={new Date(deliveryDetails.data.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} />
                )}

                <Text style={[styles.fieldLabel, { marginTop: 12, marginBottom: 6 }]}>Delivered Products</Text>
                {(deliveryDetails.data.items || []).map((item: any, i: number) => (
                  <View key={i} style={styles.pauseRowCard}>
                    <Text style={styles.pauseText}>{item.itemName || sub.itemName}</Text>
                    <Text style={{ fontWeight: '800', color: colors.primary }}>Qty: {item.quantity || sub.quantityPerDelivery}</Text>
                  </View>
                ))}

                {deliveryDetails.data.deliveryNotes ? (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.fieldLabel}>Rider Notes</Text>
                    <Text style={styles.addressText}>{deliveryDetails.data.deliveryNotes}</Text>
                  </View>
                ) : null}

                {/* Delivery Lifecycle Status Timeline */}
                {deliveryDetails.data.statusHistory && deliveryDetails.data.statusHistory.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>⏱️ Delivery Status Timeline</Text>
                    {deliveryDetails.data.statusHistory.map((h: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 3 }}>
                        <Ionicons name="ellipse" size={8} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{h.status?.toUpperCase()}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted, marginLeft: 'auto' }}>
                          {new Date(h.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Proof Photo Preview */}
                {deliveryDetails.data.proofPhoto ? (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>📷 Doorstep Delivery Proof Photo</Text>
                    <Image
                      source={{ uri: deliveryDetails.data.proofPhoto }}
                      style={{ width: '100%', height: 180, borderRadius: 12, marginTop: 4 }}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <View style={{ marginTop: 12, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>No proof photo uploaded for this delivery</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Delivery information unavailable</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Pause Modal */}
      <Modal visible={showPauseModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Schedule a Pause</Text>
            
            <Text style={styles.fieldLabel}>Quick Duration Presets</Text>
            <View style={styles.presetRow}>
              {[3, 7, 14].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={styles.presetChip}
                  onPress={() => setPresetPauseDays(days)}
                >
                  <Text style={styles.presetChipText}>{days} Days</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Pause From (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={pauseFrom} onChangeText={setPauseFrom} placeholder="2026-08-01" />
            <Text style={styles.fieldLabel}>Resume On (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={pauseTo} onChangeText={setPauseTo} placeholder="2026-08-10" />
            <Text style={styles.modalNote}>End date will be extended by the pause length automatically.</Text>
            
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPauseModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, pauseLoading && { opacity: 0.6 }]}
                onPress={handlePause}
                disabled={pauseLoading}
              >
                {pauseLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalConfirmBtnText}>Confirm Pause</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Modal */}
      <Modal visible={showAddressModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Update Delivery Address</Text>
              {([
                { key: 'fullName', label: 'Full Name' },
                { key: 'phone', label: 'Phone' },
                { key: 'address1', label: 'Address Line 1' },
                { key: 'address2', label: 'Address Line 2 (optional)' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'pin', label: 'Pincode' },
              ] as const).map((f) => (
                <View key={f.key} style={{ marginBottom: 10 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress[f.key] || ''}
                    onChangeText={(t) => setNewAddress((prev) => ({ ...prev, [f.key]: t }))}
                  />
                </View>
              ))}
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddressModal(false)}>
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, addressLoading && { opacity: 0.6 }]}
                  onPress={handleUpdateAddress}
                  disabled={addressLoading}
                >
                  {addressLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalConfirmBtnText}>Save Address</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  addBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  addressText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  billDueCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderRadius: 14,
    borderWidth: 1.5,
    marginHorizontal: spacing.lg,
    padding: 16,
  },
  billDueDesc: {
    color: '#7f1d1d',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  billDueHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  billDueSubtitle: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  billDueTitle: {
    color: '#7f1d1d',
    fontSize: 16,
    fontWeight: '800',
  },
  calCell: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  calCellOutRange: {
    opacity: 0.3,
  },
  calCellPaused: {
    backgroundColor: '#fef9c3',
    borderRadius: 8,
  },
  calCellSkipped: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  calCellToday: {
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 2,
  },
  calDayCell: {},
  calDayLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: `${100 / 7}%`,
  },
  calDayLabels: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calDayNum: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  calDotActive: {
    backgroundColor: '#10b981',
    borderRadius: 2,
    height: 4,
    marginTop: 2,
    width: 4,
  },
  calDotPause: {
    fontSize: 8,
    marginTop: 1,
  },
  calDotSkip: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calLegend: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  calNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calNavBtn: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 6,
  },
  calTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    alignItems: 'center',
    borderColor: '#ef4444',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    height: 48,
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: spacing.lg,
    padding: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    height: 48,
    paddingHorizontal: 14,
  },
  legendDot: {
    borderRadius: 4,
    height: 10,
    width: 10,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    margin: 20,
    marginTop: 'auto',
    padding: 20,
  },
  modalConfirmBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalNote: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  pauseRowCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pauseRowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pauseText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  payBillBtn: {
    alignItems: 'center',
    backgroundColor: '#dc2626',
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    justifyContent: 'center',
    marginTop: 12,
  },
  payBillBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  presetChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  presetChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  removePauseBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 14,
    padding: 6,
  },
  resumeNowBtn: {
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 10,
  },
  resumeNowText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  scrollContent: {
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  section: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    padding: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  statusBanner: {
    borderRadius: 10,
    marginHorizontal: spacing.lg,
    padding: 10,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
