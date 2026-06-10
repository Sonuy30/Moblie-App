import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '@/api/addresses';
import { type Address } from '@/api/orders';
import { getErrorMessage } from '@/api/client';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonRect } from '@/components/skeletons/SkeletonBase';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function AddressScreen() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await addAddress(form);
      setShowForm(false);
      setForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' });
      await load();
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAddress(id)
            .then(() => {
              void load();
            })
            .catch(() => {});
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await load();
    } catch {
      /* ignore */
    }
  };

  const AddressSkeleton = () => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <SkeletonRect width="40%" height={16} radius={4} style={{ marginBottom: 4 }} />
        <SkeletonRect width="75%" height={14} radius={3} style={{ marginBottom: 4 }} />
        <SkeletonRect width="60%" height={14} radius={3} style={{ marginBottom: 4 }} />
        <SkeletonRect width="30%" height={14} radius={3} />
      </View>
      <View style={styles.cardActions}>
        <SkeletonRect width="25%" height={14} radius={3} />
        <SkeletonRect width={18} height={18} radius={9} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Saved Addresses</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.form}>
          {(['fullName','phone','addressLine1','addressLine2','city','state','pincode'] as const).map((field) => (
            <TextInput key={field} style={styles.formInput} placeholder={field.replace(/([A-Z])/g, ' $1').trim()}
              placeholderTextColor={colors.textMuted} value={form[field]}
              onChangeText={(v) => setForm({...form, [field]: v})}
              keyboardType={field === 'phone' || field === 'pincode' ? 'number-pad' : 'default'} />
          ))}
          <View style={styles.formBtns}>
            <Button title="Cancel" onPress={() => setShowForm(false)} variant="ghost" size="sm" />
            <Button title="Save" onPress={() => { void handleSave(); }} loading={saving} size="sm" />
          </View>
        </View>
      )}

      {loading ? (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((i) => (
            <AddressSkeleton key={i} />
          ))}
        </ScrollView>
      ) : addresses.length === 0 ? (
        <EmptyState icon="location-outline" title="No saved addresses" subtitle="Add an address for faster checkout" actionLabel="Add Address" onAction={() => setShowForm(true)} />
      ) : (
        <FlatList data={addresses} keyExtractor={(item) => item._id || ''} contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.addrName}>{item.fullName}</Text>
                <Text style={styles.addrLine}>{item.addressLine1}</Text>
                <Text style={styles.addrLine}>{item.city}, {item.state} - {item.pincode}</Text>
                <Text style={styles.addrPhone}>{item.phone}</Text>
                {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
              </View>
              <View style={styles.cardActions}>
                {!item.isDefault && (
                  <TouchableOpacity onPress={() => { void handleSetDefault(item._id || ''); }}>
                    <Text style={styles.actionLink}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => { void handleDelete(item._id || ''); }}>
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  addrLine: { color: colors.textSecondary, fontSize: 13 },
  addrName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  addrPhone: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  backBtn: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, elevation: 2, marginBottom: spacing.md, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  cardActions: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.lg, justifyContent: 'flex-end', marginTop: spacing.md, paddingTop: spacing.md },
  cardContent: { gap: 2 },
  defaultBadge: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: borderRadius.full, marginTop: 6, paddingHorizontal: 8, paddingVertical: 2 },
  defaultText: { color: colors.primary, fontSize: 10, fontWeight: '600' },
  form: { backgroundColor: colors.white, borderRadius: borderRadius.lg, elevation: 3, gap: spacing.md, marginBottom: spacing.lg, marginHorizontal: spacing.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  formBtns: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  formInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, color: colors.text, fontSize: 14, height: 48, paddingHorizontal: 14 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  list: { paddingBottom: 100, paddingHorizontal: spacing.lg },
  safe: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 18, fontWeight: '700' },
});
