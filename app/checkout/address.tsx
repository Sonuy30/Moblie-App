import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getAddresses, addAddress } from '@/api/addresses';
import { type Address } from '@/api/orders';
import { useCheckoutStore } from '@/stores/checkoutStore';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { getErrorMessage } from '@/api/client';

export default function CheckoutAddressScreen() {
  const selectedAddress = useCheckoutStore((s) => s.selectedAddress);
  const setSelectedAddress = useCheckoutStore((s) => s.setSelectedAddress);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [addrForm, setAddrForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  });

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
      // Pre-select default address if none is selected
      if (!selectedAddress) {
        const def = data.find((a) => a.isDefault);
        if (def) {
          setSelectedAddress(def);
        } else if (data.length > 0) {
          setSelectedAddress(data[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load addresses:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveAddress = async () => {
    const { fullName, phone, addressLine1, city, state, pincode } = addrForm;
    if (!fullName.trim()) {
      Alert.alert('Validation', 'Full name is required');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Validation', 'Enter a valid 10-digit mobile number');
      return;
    }
    if (!addressLine1.trim()) {
      Alert.alert('Validation', 'Address line 1 is required');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Validation', 'City is required');
      return;
    }
    if (!state.trim()) {
      Alert.alert('Validation', 'State is required');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      Alert.alert('Validation', 'Enter a valid 6-digit pincode');
      return;
    }

    try {
      setLoading(true);
      const newAddr = (await addAddress(addrForm)) as { address?: Address } & Record<string, unknown>;
      await loadAddresses();
      setShowAddForm(false);
      setAddrForm({
        fullName: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
      });
      // Automatically select the newly saved address
      if (newAddr && newAddr.address) {
        setSelectedAddress(newAddr.address);
      } else {
        // Fallback: match from the updated list
        const updatedList = await getAddresses();
        const added = updatedList.find(
          (a) => a.addressLine1 === addressLine1 && a.fullName === fullName
        );
        if (added) setSelectedAddress(added);
      }
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      Alert.alert('Validation', 'Please select a delivery address');
      return;
    }
    router.push('/checkout/delivery');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      <CheckoutProgress currentStep={1} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Select Delivery Address</Text>

          {addresses.map((addr) => {
            const isSelected = selectedAddress?._id === addr._id;
            return (
              <TouchableOpacity
                key={addr._id || `addr-${addr.addressLine1}`}
                style={[styles.addrCard, isSelected && styles.addrCardActive]}
                activeOpacity={0.9}
                onPress={() => setSelectedAddress(addr)}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.addrInfo}>
                  <Text style={styles.addrName}>{addr.fullName}</Text>
                  <Text style={styles.addrLine}>
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                  </Text>
                  <Text style={styles.addrLine}>
                    {addr.city}, {addr.state} - {addr.pincode}
                  </Text>
                  <Text style={styles.addrPhone}>Mobile: {addr.phone}</Text>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultText}>Default</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {showAddForm ? (
            <View style={styles.addrForm}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Add New Address</Text>
                <TouchableOpacity onPress={() => setShowAddForm(false)}>
                  <Ionicons name="close-circle-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.formInput}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
                value={addrForm.fullName}
                onChangeText={(v) => setAddrForm({ ...addrForm, fullName: v })}
              />
              <TextInput
                style={styles.formInput}
                placeholder="10-Digit Mobile Number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={10}
                value={addrForm.phone}
                onChangeText={(v) => setAddrForm({ ...addrForm, phone: v })}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Address Line 1"
                placeholderTextColor={colors.textMuted}
                value={addrForm.addressLine1}
                onChangeText={(v) => setAddrForm({ ...addrForm, addressLine1: v })}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Address Line 2 (Optional)"
                placeholderTextColor={colors.textMuted}
                value={addrForm.addressLine2}
                onChangeText={(v) => setAddrForm({ ...addrForm, addressLine2: v })}
              />
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.formInput, styles.formInputHalf]}
                  placeholder="City"
                  placeholderTextColor={colors.textMuted}
                  value={addrForm.city}
                  onChangeText={(v) => setAddrForm({ ...addrForm, city: v })}
                />
                <TextInput
                  style={[styles.formInput, styles.formInputHalf]}
                  placeholder="State"
                  placeholderTextColor={colors.textMuted}
                  value={addrForm.state}
                  onChangeText={(v) => setAddrForm({ ...addrForm, state: v })}
                />
              </View>
              <TextInput
                style={styles.formInput}
                placeholder="Pincode (6 digits)"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={addrForm.pincode}
                onChangeText={(v) => setAddrForm({ ...addrForm, pincode: v })}
              />

              <Button title="Save Address" onPress={() => { void handleSaveAddress(); }} loading={loading} fullWidth />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddrBtn}
              activeOpacity={0.7}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.addAddrText}>Add new address</Text>
            </TouchableOpacity>
          )}

          <Button
            title="Continue to Delivery"
            onPress={handleContinue}
            disabled={!selectedAddress}
            fullWidth
            style={{ marginTop: spacing.xl }}
          />
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addAddrBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  addAddrText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addrCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  addrCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  addrForm: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  addrInfo: {
    flex: 1,
    gap: 2,
  },
  addrLine: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  addrName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  addrPhone: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  body: {
    flex: 1,
  },
  bottomSpacer: {
    height: 60,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  defaultBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.full,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  defaultText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
  },
  formHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: 14,
    height: 48,
    paddingHorizontal: 14,
  },
  formInputHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  formTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    width: 22,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
