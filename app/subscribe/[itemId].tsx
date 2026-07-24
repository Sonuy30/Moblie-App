import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import {
  checkoutSubscription,
  verifySubscriptionPayment,
  activateSubscriptionCOD,
} from '@/api/subscriptions';
import { getAddresses } from '@/api/addresses';
import { useProductDetail } from '@/hooks/useProducts';
import { formatINR } from '@/utils/currency';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import type { DeliveryAddress } from '@/types/subscription';
import type { Address } from '@/api/orders';

type Frequency = 'daily' | 'alternate_days' | 'custom_days';
type PlanType = 'day' | 'week' | 'month';
type PaymentMode = 'online' | 'cod';

const DAYS_OF_WEEK = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const PLANS: { type: PlanType; label: string; deliveries: number; badge: string; desc: string }[] = [
  { type: 'day',   label: 'Trial Day',    deliveries: 1,  badge: '1 delivery',    desc: 'Try once before committing' },
  { type: 'week',  label: 'Weekly Plan',  deliveries: 7,  badge: '7 deliveries',  desc: '1 week of fresh deliveries' },
  { type: 'month', label: 'Monthly Plan', deliveries: 30, badge: '30 deliveries', desc: 'Best value — daily for 30 days' },
];

type Step = 'frequency' | 'plan' | 'startDate' | 'address' | 'review' | 'payment';
const STEP_LABELS: Step[] = ['frequency', 'plan', 'startDate', 'address', 'review', 'payment'];
const STEP_NAMES: Record<Step, string> = {
  frequency: 'Frequency',
  plan: 'Plan',
  startDate: 'Start Date',
  address: 'Address',
  review: 'Review',
  payment: 'Payment',
};

export default function SubscribeScreen() {
  const { itemId, defaultQty } = useLocalSearchParams<{ itemId: string; defaultQty?: string }>();

  // Load product details
  const { data: productData } = useProductDetail(itemId || '');
  const product = productData as unknown as {
    name?: string;
    storePrice?: number;
    mrp?: number;
    unit?: string;
    description?: string;
    minSubscriptionQty?: number;
    maxSubscriptionQty?: number;
    images?: string[];
    gstRate?: number;
  } | null;

  const [step, setStep] = useState<Step>('frequency');
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [planType, setPlanType] = useState<PlanType>('month');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('online');
  const [qty, setQty] = useState(parseFloat(defaultQty || '0.5') || 0.5);

  // Tomorrow as default start date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [startDate, setStartDate] = useState(tomorrow.toISOString().slice(0, 10));

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: '', phone: '', address1: '', address2: '',
    city: '', state: '', pin: '', country: 'India',
  });

  const [checkoutData, setCheckoutData] = useState<{
    razorpayOrder: { id: string; amount: number; currency: string };
    pricePerDelivery: number;
    totalAmount: number;
    totalDeliveries: number;
    gstAmount: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedPlan = PLANS.find((p) => p.type === planType) || PLANS[2];

  // Load saved addresses
  useEffect(() => {
    getAddresses().then((list) => {
      setSavedAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) {
        setSelectedSavedId(def._id || null);
        setAddress({
          fullName: def.fullName,
          phone: def.phone,
          address1: def.addressLine1,
          address2: def.addressLine2 || '',
          city: def.city,
          state: def.state,
          pin: def.pincode,
          country: 'India',
        });
      }
    }).catch(() => {});
  }, []);

  const toggleDay = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Price calculations (local estimate shown before server confirms)
  const unitPrice = product?.storePrice || 0;
  const gstRate = (product?.gstRate || 0) / 100;
  const estPricePerDelivery = unitPrice * qty;
  const estSubtotal = estPricePerDelivery * selectedPlan.deliveries;
  const estGst = Math.round(estSubtotal * gstRate * 100) / 100;
  const estTotal = estSubtotal + estGst;

  const handleCheckout = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      // 1. Check user login
      const user = useAuthStore.getState().user;
      if (!user) {
        setErrorMsg('Please login or register to create a subscription.');
        setLoading(false);
        return;
      }

      // 2. Validate address
      if (!address.fullName || !address.phone || !address.address1 || !address.pin) {
        setErrorMsg('Please complete your delivery address before proceeding.');
        setStep('address');
        setLoading(false);
        return;
      }

      // 3. Create subscription checkout session
      const targetId = product?._id ? String(product._id) : itemId!;
      const result = await checkoutSubscription({
        itemId: targetId,
        quantityPerDelivery: qty,
        planType,
        frequency,
        daysOfWeek: frequency === 'custom_days' ? daysOfWeek : [],
      });
      setCheckoutData(result);

      // 4. Process payment/activation based on payment mode
      if (paymentMode === 'cod') {
        await activateSubscriptionCOD({
          razorpayOrderId: result.razorpayOrder.id,
          startDate,
          deliveryAddress: address,
        });
        Toast.show({ type: 'success', text1: '🎉 Subscription Activated!', text2: 'First delivery scheduled as per plan.' });
        router.replace('/(tabs)/subscriptions');
      } else {
        await triggerRazorpayPayment(result);
      }
    } catch (err: unknown) {
      const errObj = err as any;
      const msg = errObj?.response?.data?.message || errObj?.message || 'Checkout failed. Please try again.';
      setErrorMsg(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  /** Dynamically loads Razorpay JS SDK for web */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof document === 'undefined') return resolve(false);
      if ((globalThis as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /** Trigger Razorpay payment with fallback for test sessions */
  const triggerRazorpayPayment = async (data: typeof checkoutData) => {
    if (!data) return;
    setLoading(true);
    try {
      const isTestSession = data.razorpayOrder.id.startsWith('order_sub_');
      if (isTestSession) {
        await handlePaymentSuccess(
          data.razorpayOrder.id,
          `pay_test_${Date.now()}`,
          'mock_signature'
        );
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setErrorMsg('Failed to load payment SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }
      const rzpInstance = new (globalThis as any).Razorpay({
        key: data.razorpayOrder.key || process.env.EXPO_PUBLIC_RAZORPAY_KEY || '***RAZORPAY_KEY_REDACTED***',
        amount: Math.round(data.totalAmount * 100),
        currency: 'INR',
        order_id: data.razorpayOrder.id,
        name: 'AITS Shop — Subscription',
        description: `Subscription payment`,
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await handlePaymentSuccess(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );
        },
      });
      rzpInstance.open();
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'Payment failed';
      setErrorMsg(msg);
      Alert.alert('Payment Error', msg);
    }
  };

  const openRazorpayForSubscription = async () => {
    if (checkoutData) {
      await triggerRazorpayPayment(checkoutData);
    }
  };

  const handlePaymentSuccess = async (
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  ) => {
    setLoading(true);
    try {
      await verifySubscriptionPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        startDate,
        deliveryAddress: address,
      });
      Toast.show({ type: 'success', text1: '🎉 Subscription Activated!', text2: 'First delivery scheduled as per plan.' });
      router.replace('/(tabs)/subscriptions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment verification failed';
      setErrorMsg(msg);
      Alert.alert('Payment Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCODActivate = async () => {
    if (!checkoutData) return;
    setLoading(true);
    try {
      await activateSubscriptionCOD({
        razorpayOrderId: checkoutData.razorpayOrder.id,
        startDate,
        deliveryAddress: address,
      });
      Toast.show({ type: 'success', text1: '✅ Subscription Activated!', text2: 'Pay cash on each delivery.' });
      router.replace('/(tabs)/subscriptions');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation failed';
      setErrorMsg(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = STEP_LABELS.indexOf(step);

  const renderStep = () => {
    switch (step) {
      case 'frequency':
        return (
          <View style={styles.stepCard}>
            {/* Product Banner */}
            {product && (
              <View style={styles.productBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{formatINR(unitPrice)}</Text>
                    <Text style={styles.productUnit}>/ {product.unit}</Text>
                    {(product.gstRate || 0) > 0 && (
                      <Text style={styles.gstBadge}>+{product.gstRate}% GST</Text>
                    )}
                  </View>
                </View>
                <View style={styles.qtyBox}>
                  <Text style={styles.qtyLabel}>Qty/day</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      onPress={() => setQty((q) => Math.max(product.minSubscriptionQty || 0.25, parseFloat((q - 0.25).toFixed(2))))}
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="remove" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <TouchableOpacity
                      onPress={() => setQty((q) => Math.min(product.maxSubscriptionQty || 10, parseFloat((q + 0.25).toFixed(2))))}
                      style={styles.qtyBtn}
                    >
                      <Ionicons name="add" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.qtyUnit}>{product.unit}</Text>
                </View>
              </View>
            )}

            <Text style={styles.stepTitle}>How often do you want delivery?</Text>
            {[
              { value: 'daily' as Frequency,        label: 'Daily',          icon: 'calendar-outline',  desc: 'Every single day' },
              { value: 'alternate_days' as Frequency, label: 'Alternate Days', icon: 'today-outline',     desc: 'Every other day' },
              { value: 'custom_days' as Frequency,  label: 'Pick Weekdays',  icon: 'options-outline',   desc: 'Select specific days' },
            ].map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[styles.optionCard, frequency === f.value && styles.optionCardActive]}
                onPress={() => setFrequency(f.value)}
              >
                <Ionicons name={f.icon as never} size={22} color={frequency === f.value ? colors.primary : colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, frequency === f.value && styles.optionLabelActive]}>
                    {f.label}
                  </Text>
                  <Text style={styles.optionDesc}>{f.desc}</Text>
                </View>
                {frequency === f.value && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
              </TouchableOpacity>
            ))}

            {frequency === 'custom_days' && (
              <View style={styles.dayGrid}>
                {DAYS_OF_WEEK.map((d) => (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.dayChip, daysOfWeek.includes(d.key) && styles.dayChipActive]}
                    onPress={() => toggleDay(d.key)}
                  >
                    <Text style={[styles.dayChipText, daysOfWeek.includes(d.key) && styles.dayChipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('plan')}>
              <Text style={styles.nextBtnText}>Next: Choose Plan</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );

      case 'plan':
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Choose Your Plan</Text>
            {PLANS.map((p) => {
              const localPrice = unitPrice * qty * p.deliveries;
              const localGst = Math.round(localPrice * gstRate * 100) / 100;
              const localTotal = localPrice + localGst;
              return (
                <TouchableOpacity
                  key={p.type}
                  style={[styles.planCard, planType === p.type && styles.planCardActive]}
                  onPress={() => setPlanType(p.type)}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.planHeader}>
                      <Text style={[styles.planLabel, planType === p.type && { color: colors.primary }]}>
                        {p.label}
                      </Text>
                      <View style={[styles.planBadge, planType === p.type && styles.planBadgeActive]}>
                        <Text style={[styles.planBadgeText, planType === p.type && { color: colors.primary }]}>
                          {p.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.planDesc}>{p.desc}</Text>
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPriceSmall}>{formatINR(unitPrice * qty)}/delivery × {p.deliveries}</Text>
                      <Text style={[styles.planPriceBig, planType === p.type && { color: colors.primary }]}>
                        {formatINR(localTotal)}
                      </Text>
                    </View>
                    {(gstRate > 0) && (
                      <Text style={styles.planGst}>Incl. GST {formatINR(localGst)}</Text>
                    )}
                  </View>
                  {planType === p.type && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>Delivered daily between 3:00–7:00 AM</Text>
            </View>

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('frequency')}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep('startDate')}>
                <Text style={styles.nextBtnText}>Next: Start Date</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'startDate':
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>When should deliveries begin?</Text>

            <Text style={styles.fieldLabel}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              keyboardType="default"
            />

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                {selectedPlan.deliveries === 1
                  ? '1 delivery on your chosen date.'
                  : `${selectedPlan.deliveries} deliveries starting from this date.`}
                {'\n'}Subscription ends: {(() => {
                  try {
                    const end = new Date(startDate);
                    end.setDate(end.getDate() + selectedPlan.deliveries);
                    return end.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                  } catch { return ''; }
                })()}
              </Text>
            </View>

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('plan')}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep('address')}>
                <Text style={styles.nextBtnText}>Next: Address</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'address':
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Delivery Address</Text>

            {savedAddresses.length > 0 && (
              <>
                <Text style={styles.fieldLabel}>Saved Addresses</Text>
                {savedAddresses.map((a) => (
                  <TouchableOpacity
                    key={a._id}
                    style={[styles.savedAddrCard, selectedSavedId === a._id && styles.savedAddrCardActive]}
                    onPress={() => {
                      setSelectedSavedId(a._id || null);
                      setAddress({
                        fullName: a.fullName,
                        phone: a.phone,
                        address1: a.addressLine1,
                        address2: a.addressLine2 || '',
                        city: a.city,
                        state: a.state,
                        pin: a.pincode,
                        country: 'India',
                      });
                    }}
                  >
                    <Ionicons
                      name={selectedSavedId === a._id ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedSavedId === a._id ? colors.primary : colors.textMuted}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.savedAddrName}>{a.fullName}</Text>
                      <Text style={styles.savedAddrText}>{a.addressLine1}, {a.city} - {a.pincode}</Text>
                    </View>
                    {a.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Or enter a new address:</Text>
              </>
            )}

            {([ 
              { key: 'fullName', label: 'Full Name', placeholder: 'John Doe' },
              { key: 'phone', label: 'Phone', placeholder: '9876543210', keyboard: 'phone-pad' },
              { key: 'address1', label: 'Address Line 1', placeholder: 'House No., Street' },
              { key: 'address2', label: 'Landmark (optional)', placeholder: 'Near temple' },
              { key: 'city', label: 'City', placeholder: 'Mumbai' },
              { key: 'state', label: 'State', placeholder: 'Maharashtra' },
              { key: 'pin', label: 'Pincode', placeholder: '400001', keyboard: 'number-pad' },
            ] as const).map((field) => (
              <View key={field.key} style={{ marginBottom: 12 }}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={address[field.key] || ''}
                  onChangeText={(text) => {
                    setSelectedSavedId(null);
                    setAddress((prev) => ({ ...prev, [field.key]: text }));
                  }}
                  placeholder={field.placeholder}
                  keyboardType={(field as { keyboard?: string }).keyboard as never || 'default'}
                />
              </View>
            ))}

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('startDate')}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.nextBtn, { flex: 1 }]} onPress={() => setStep('review')}>
                <Text style={styles.nextBtnText}>Review Order</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'review':
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>Review Your Subscription</Text>

            {/* Product detail */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>PRODUCT</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Item</Text>
                <Text style={styles.reviewValue}>{product?.name || 'Product'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Qty per delivery</Text>
                <Text style={styles.reviewValue}>{qty} {product?.unit}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Price per delivery</Text>
                <Text style={styles.reviewValue}>{formatINR(estPricePerDelivery)}</Text>
              </View>
            </View>

            {/* Plan detail */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>PLAN</Text>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Plan</Text>
                <Text style={styles.reviewValue}>{selectedPlan.label} ({selectedPlan.deliveries} deliveries)</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Frequency</Text>
                <Text style={styles.reviewValue}>
                  {frequency === 'daily' ? 'Daily' : frequency === 'alternate_days' ? 'Alternate Days' : `Custom (${daysOfWeek.join(', ')})`}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Start Date</Text>
                <Text style={styles.reviewValue}>{startDate}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Delivery Window</Text>
                <Text style={styles.reviewValue}>3:00–7:00 AM daily</Text>
              </View>
            </View>

            {/* Address */}
            <View style={styles.reviewSection}>
              <Text style={styles.reviewSectionTitle}>DELIVERY ADDRESS</Text>
              <Text style={styles.addressBlock}>
                {address.fullName}{'\n'}
                {address.address1}{address.address2 ? ', ' + address.address2 : ''}{'\n'}
                {address.city}, {address.state} - {address.pin}
              </Text>
            </View>

            {/* Price summary */}
            <View style={styles.priceCard}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Subtotal ({selectedPlan.deliveries} deliveries)</Text>
                <Text style={styles.reviewValue}>{formatINR(estSubtotal)}</Text>
              </View>
              {estGst > 0 && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>GST ({(gstRate * 100).toFixed(0)}%)</Text>
                  <Text style={styles.reviewValue}>{formatINR(estGst)}</Text>
                </View>
              )}
              <View style={[styles.reviewRow, { borderBottomWidth: 0, marginTop: 4 }]}>
                <Text style={[styles.reviewLabel, { fontWeight: '800', color: colors.text }]}>Total Amount</Text>
                <Text style={[styles.reviewValue, { color: colors.primary, fontSize: 16, fontWeight: '900' }]}>
                  {formatINR(estTotal)}
                </Text>
              </View>
            </View>

            {/* Payment mode selection */}
            <Text style={[styles.fieldLabel, { marginTop: 16, marginBottom: 8 }]}>Choose Payment Method</Text>
            <View style={styles.paymentModeRow}>
              <TouchableOpacity
                style={[styles.paymentModeCard, paymentMode === 'online' && styles.paymentModeCardActive]}
                onPress={() => setPaymentMode('online')}
              >
                <Ionicons
                  name="card-outline"
                  size={22}
                  color={paymentMode === 'online' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.paymentModeLabel, paymentMode === 'online' && { color: colors.primary }]}>
                  Pay Online
                </Text>
                <Text style={styles.paymentModeDesc}>UPI, Card, Net Banking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentModeCard, paymentMode === 'cod' && styles.paymentModeCardActive]}
                onPress={() => setPaymentMode('cod')}
              >
                <Ionicons
                  name="cash-outline"
                  size={22}
                  color={paymentMode === 'cod' ? colors.primary : colors.textSecondary}
                />
                <Text style={[styles.paymentModeLabel, paymentMode === 'cod' && { color: colors.primary }]}>
                  Cash on Delivery
                </Text>
                <Text style={styles.paymentModeDesc}>Pay each delivery</Text>
              </TouchableOpacity>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color="#991b1b" />
                <Text style={styles.errorBoxText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('address')}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1 }, loading && styles.nextBtnDisabled]}
                onPress={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>
                      {paymentMode === 'cod' ? 'Confirm Subscription' : 'Proceed to Pay'}
                    </Text>
                    <Ionicons name={paymentMode === 'cod' ? 'checkmark-circle-outline' : 'card-outline'} size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'payment':
        return (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>
              {paymentMode === 'cod' ? 'Confirm Subscription' : 'Complete Payment'}
            </Text>

            {checkoutData && (
              <>
                <View style={styles.priceCard}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Total Deliveries</Text>
                    <Text style={styles.reviewValue}>{checkoutData.totalDeliveries}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Per Delivery</Text>
                    <Text style={styles.reviewValue}>{formatINR(checkoutData.pricePerDelivery)}</Text>
                  </View>
                  {checkoutData.gstAmount > 0 && (
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>GST</Text>
                      <Text style={styles.reviewValue}>{formatINR(checkoutData.gstAmount)}</Text>
                    </View>
                  )}
                  <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.reviewLabel, { fontWeight: '800', color: colors.text }]}>Total Amount</Text>
                    <Text style={[styles.reviewValue, { color: colors.primary, fontSize: 16, fontWeight: '900' }]}>
                      {formatINR(checkoutData.totalAmount)}
                    </Text>
                  </View>
                </View>

                {paymentMode === 'cod' ? (
                  <>
                    <View style={styles.infoBox}>
                      <Ionicons name="cash-outline" size={16} color="#166534" />
                      <Text style={[styles.infoText, { color: '#166534' }]}>
                        You'll pay {formatINR(checkoutData.pricePerDelivery)} cash to the delivery partner on each visit.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                      onPress={handleCODActivate}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                          <Text style={styles.nextBtnText}>Activate Subscription (COD)</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.infoBox}>
                      <Ionicons name="card-outline" size={16} color={colors.primary} />
                      <Text style={styles.infoText}>Secure payment via Razorpay. Tap below to open payment.</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
                      onPress={() => { void openRazorpayForSubscription(); }}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="card-outline" size={20} color="#fff" />
                          <Text style={styles.nextBtnText}>Pay {formatINR(checkoutData.totalAmount)}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={styles.changePaymentBtn}
                  onPress={() => setStep('review')}
                >
                  <Text style={styles.changePaymentBtnText}>← Change payment method</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscribe &amp; Save</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {STEP_LABELS.map((s, i) => (
          <View key={s} style={styles.stepIndicatorItem}>
            <View style={[
              styles.stepDot,
              i < currentStepIndex && styles.stepDotDone,
              i === currentStepIndex && styles.stepDotActive,
            ]}>
              {i < currentStepIndex ? (
                <Ionicons name="checkmark" size={10} color="#fff" />
              ) : (
                <Text style={[styles.stepDotText, i === currentStepIndex && styles.stepDotTextActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < STEP_LABELS.length - 1 && (
              <View style={[styles.stepLine, i < currentStepIndex && styles.stepLineDone]} />
            )}
          </View>
        ))}
      </View>
      <Text style={styles.stepName}>{STEP_NAMES[step]}</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addressBlock: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 4,
  },
  backBtn: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  changePaymentBtn: {
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
  },
  changePaymentBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  dayChip: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: borderRadius.md,
    height: 40,
    justifyContent: 'center',
    width: 44,
  },
  dayChipActive: {
    backgroundColor: colors.primary,
  },
  dayChipText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  dayChipTextActive: {
    color: '#fff',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginTop: 12,
  },
  defaultBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    padding: 12,
  },
  errorBoxText: {
    color: '#991b1b',
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  gstBadge: {
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    color: '#166534',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerBack: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  infoBox: {
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
    padding: 12,
  },
  infoText: {
    color: colors.primary,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
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
  nextBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 14,
  },
  optionCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabelActive: {
    color: colors.primary,
  },
  paymentModeCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flex: 1,
    gap: 4,
    padding: 14,
  },
  paymentModeCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  paymentModeDesc: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  paymentModeLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  planBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  planCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  planCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  planDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 8,
    marginTop: 2,
  },
  planGst: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  planHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  planLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  planPriceBig: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  planPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  planPriceSmall: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  priceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: 16,
    padding: 14,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginTop: 2,
  },
  productBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    padding: 14,
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  productPrice: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  productUnit: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  qtyBox: {
    alignItems: 'center',
  },
  qtyBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  qtyLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  qtyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  qtyUnit: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  qtyValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 30,
    textAlign: 'center',
  },
  reviewLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  reviewRow: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  reviewSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: 12,
    padding: 14,
  },
  reviewSectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  reviewValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  rowBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  savedAddrCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    padding: 12,
  },
  savedAddrCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  savedAddrName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  savedAddrText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  stepCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  stepDot: {
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotDone: {
    backgroundColor: colors.primary,
  },
  stepDotText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  stepDotTextActive: {
    color: '#fff',
  },
  stepIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  stepIndicatorItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepLine: {
    backgroundColor: colors.border,
    height: 2,
    width: 24,
  },
  stepLineDone: {
    backgroundColor: colors.primary,
  },
  stepName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 6,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
});
