import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { getAddresses, addAddress } from '@/api/addresses';
import { initiateCheckout, demoPay, payWithCreditLimit, payOfflineInvoice } from '@/api/checkout';
import { Address } from '@/api/orders';
import OrderItemRow from '@/components/order/OrderItemRow';
import CartSummary from '@/components/cart/CartSummary';
import Button from '@/components/ui/Button';
import { formatINR } from '@/utils/currency';
import { getErrorMessage } from '@/api/client';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function CheckoutScreen() {
  const { items, subtotal, gst, deliveryCharge, grandTotal } = useCart();
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod' | 'credit' | 'offline_invoice'>('online');

  // Address form
  const [addrForm, setAddrForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    if (!isAuth) { router.replace('/(onboarding)/phone'); return; }
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      const def = data.find((a) => a.isDefault);
      if (def?._id) setSelectedAddr(def._id);
      else if (data.length > 0 && data[0]._id) setSelectedAddr(data[0]._id);
    } catch {}
  };

  const handleSaveAddress = async () => {
    try {
      setLoading(true);
      await addAddress(addrForm);
      await loadAddresses();
      setShowAddForm(false);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally { setLoading(false); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) { Alert.alert('Select Address', 'Please select a delivery address'); return; }
    setLoading(true);
    try {
      const response = await initiateCheckout({
        cartItems: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        addressId: selectedAddr,
      });
      
      // Process payment based on method
      if (paymentMethod === 'online') {
        await demoPay(response.ecomOrderId);
      } else if (paymentMethod === 'credit') {
        await payWithCreditLimit(response.ecomOrderId);
      } else if (paymentMethod === 'offline_invoice') {
        await payOfflineInvoice(response.ecomOrderId);
      } else {
        await demoPay(response.ecomOrderId);
      }
      
      clearCart();
      router.replace({ pathname: '/order-success', params: { orderNumber: response.orderNumber, orderId: response.ecomOrderId } } as any);
    } catch (err) {
      Alert.alert('Payment Failed', getErrorMessage(err));
    } finally { setLoading(false); }
  };

  const selectedAddress = addresses.find((a) => a._id === selectedAddr);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step Indicator */}
      <View style={styles.steps}>
        {[1,2,3].map((s) => (
          <React.Fragment key={s}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </React.Fragment>
        ))}
      </View>
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Address</Text>
        <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Summary</Text>
        <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Payment</Text>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step 1: Address */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Deliver to</Text>
            {addresses.map((addr) => (
              <TouchableOpacity key={addr._id} style={[styles.addrCard, selectedAddr === addr._id && styles.addrCardActive]}
                onPress={() => setSelectedAddr(addr._id || null)}>
                <View style={[styles.radio, selectedAddr === addr._id && styles.radioActive]}>
                  {selectedAddr === addr._id && <View style={styles.radioDot} />}
                </View>
                <View style={styles.addrInfo}>
                  <Text style={styles.addrName}>{addr.fullName}</Text>
                  <Text style={styles.addrLine}>{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</Text>
                  <Text style={styles.addrLine}>{addr.city}, {addr.state} - {addr.pincode}</Text>
                  <Text style={styles.addrPhone}>{addr.phone}</Text>
                  {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                </View>
              </TouchableOpacity>
            ))}

            {showAddForm ? (
              <View style={styles.addrForm}>
                <Text style={styles.formTitle}>Add New Address</Text>
                {(['fullName','phone','addressLine1','addressLine2','city','state','pincode'] as const).map((field) => (
                  <TextInput key={field} style={styles.formInput} placeholder={field.replace(/([A-Z])/g, ' $1').trim()}
                    placeholderTextColor={colors.textMuted} value={addrForm[field]}
                    onChangeText={(v) => setAddrForm({...addrForm, [field]: v})}
                    keyboardType={field === 'phone' || field === 'pincode' ? 'number-pad' : 'default'} />
                ))}
                <Button title="Save Address" onPress={handleSaveAddress} loading={loading} fullWidth />
              </View>
            ) : (
              <TouchableOpacity style={styles.addAddrBtn} onPress={() => setShowAddForm(true)}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addAddrText}>Add new address</Text>
              </TouchableOpacity>
            )}

            <Button title="Continue" onPress={() => setStep(2)} disabled={!selectedAddr} fullWidth style={{ marginTop: spacing.xl }} />
          </View>
        )}

        {/* Step 2: Summary */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            {items.map((item) => <OrderItemRow key={item.productId} name={item.name} image={item.image} quantity={item.quantity} price={item.price} />)}

            {selectedAddress && (
              <View style={styles.addrSummary}>
                <Text style={styles.addrSummaryTitle}>Deliver to</Text>
                <Text style={styles.addrSummaryText}>{selectedAddress.fullName}, {selectedAddress.addressLine1}, {selectedAddress.city} - {selectedAddress.pincode}</Text>
                <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.changeLink}>Change</Text></TouchableOpacity>
              </View>
            )}

            <CartSummary subtotal={subtotal} gst={gst} deliveryCharge={deliveryCharge} grandTotal={grandTotal} />

            <View style={styles.payMethodSection}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              
              {/* Pay Online - available to all */}
              <TouchableOpacity 
                style={[styles.payOption, paymentMethod === 'online' && styles.payOptionActive]} 
                onPress={() => setPaymentMethod('online')}
              >
                <View style={[styles.radio, paymentMethod === 'online' && styles.radioActive]}>
                  {paymentMethod === 'online' && <View style={styles.radioDot} />}
                </View>
                <Ionicons name="card-outline" size={20} color={colors.text} />
                <Text style={styles.payOptionText}>Pay Online (Card / UPI / NetBanking)</Text>
              </TouchableOpacity>

              {/* Premium/Regular Customer payment options */}
              {(user?.tier === 'premium' || user?.tier === 'regular') ? (
                <>
                  {/* Credit Limit payment option */}
                  {(() => {
                    const creditVal = user.creditAvailable !== undefined ? user.creditAvailable : (user.creditLimit || 0);
                    const isCreditDisabled = creditVal < grandTotal;
                    
                    return (
                      <TouchableOpacity 
                        style={[
                          styles.payOption, 
                          paymentMethod === 'credit' && styles.payOptionActive,
                          isCreditDisabled && styles.payOptionDisabled
                        ]} 
                        onPress={() => !isCreditDisabled && setPaymentMethod('credit')}
                        disabled={isCreditDisabled}
                      >
                        <View style={[styles.radio, paymentMethod === 'credit' && styles.radioActive, isCreditDisabled && styles.radioDisabled]}>
                          {paymentMethod === 'credit' && <View style={styles.radioDot} />}
                        </View>
                        <Ionicons name="gift-outline" size={20} color={isCreditDisabled ? colors.textMuted : colors.text} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.payOptionText, isCreditDisabled && styles.payOptionTextDisabled]}>Pay with Credit Limit</Text>
                          <Text style={[styles.payOptionSub, isCreditDisabled && styles.payOptionSubDisabled]}>
                            Available: {formatINR(creditVal)} {isCreditDisabled && '(Insufficient Balance)'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })()}

                  {/* Offline Invoice Terms */}
                  <TouchableOpacity 
                    style={[styles.payOption, paymentMethod === 'offline_invoice' && styles.payOptionActive]} 
                    onPress={() => setPaymentMethod('offline_invoice')}
                  >
                    <View style={[styles.radio, paymentMethod === 'offline_invoice' && styles.radioActive]}>
                      {paymentMethod === 'offline_invoice' && <View style={styles.radioDot} />}
                    </View>
                    <Ionicons name="document-text-outline" size={20} color={colors.text} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.payOptionText}>Offline Invoice Terms (ERP)</Text>
                      <Text style={styles.payOptionSub}>Bill to company account as per terms</Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                /* Cash on Delivery for standard users */
                <TouchableOpacity 
                  style={[styles.payOption, paymentMethod === 'cod' && styles.payOptionActive]} 
                  onPress={() => setPaymentMethod('cod')}
                >
                  <View style={[styles.radio, paymentMethod === 'cod' && styles.radioActive]}>
                    {paymentMethod === 'cod' && <View style={styles.radioDot} />}
                  </View>
                  <Ionicons name="cash-outline" size={20} color={colors.text} />
                  <Text style={styles.payOptionText}>Cash on Delivery</Text>
                </TouchableOpacity>
              )}
            </View>

            <Button title={`Place Order  ${formatINR(grandTotal)}`} onPress={handlePlaceOrder} loading={loading} fullWidth style={{ marginTop: spacing.xl }} />
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  steps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['4xl'], paddingTop: spacing.md },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  stepNumActive: { color: colors.white },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border },
  stepLineActive: { backgroundColor: colors.primary },
  stepLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing['3xl'], marginTop: 6 },
  stepLabel: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  stepLabelActive: { color: colors.primary },
  body: { flex: 1 },
  stepContent: { padding: spacing.lg, gap: spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  addrCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md, borderWidth: 1.5, borderColor: colors.border },
  addrCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  addrInfo: { flex: 1, gap: 2 },
  addrName: { fontSize: 15, fontWeight: '600', color: colors.text },
  addrLine: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  addrPhone: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  defaultBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginTop: 4 },
  defaultText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  addAddrBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: spacing.md },
  addAddrText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  addrForm: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md },
  formTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  formInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: 14, height: 48, fontSize: 14, color: colors.text },
  addrSummary: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.lg, gap: 4 },
  addrSummaryTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  addrSummaryText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  changeLink: { fontSize: 13, fontWeight: '600', color: colors.primary, marginTop: 4 },
  payMethodSection: { gap: spacing.md },
  payOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, borderWidth: 1.5, borderColor: colors.border },
  payOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  payOptionText: { fontSize: 14, fontWeight: '500', color: colors.text },
  payOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#f9f9f9',
    borderColor: '#e2e2e2',
  },
  radioDisabled: {
    borderColor: '#e2e2e2',
  },
  payOptionTextDisabled: {
    color: colors.textMuted,
  },
  payOptionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payOptionSubDisabled: {
    color: '#d9534f',
    fontWeight: '500',
  },
});
