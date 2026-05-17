import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAddresses, addAddress, deleteAddress, setDefaultAddress } from '@/api/addresses';
import { Address } from '@/api/orders';
import { getErrorMessage } from '@/api/client';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
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
    try { const data = await getAddresses(); setAddresses(data); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await addAddress(form); setShowForm(false); setForm({ fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '' }); await load(); }
    catch (err) { Alert.alert('Error', getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteAddress(id); await load(); } catch {} } },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try { await setDefaultAddress(id); await load(); } catch {}
  };

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
            <Button title="Save" onPress={handleSave} loading={saving} size="sm" />
          </View>
        </View>
      )}

      {addresses.length === 0 && !loading ? (
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
                  <TouchableOpacity onPress={() => handleSetDefault(item._id || '')}>
                    <Text style={styles.actionLink}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleDelete(item._id || '')}>
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
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  form: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, gap: spacing.md, marginBottom: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  formInput: { backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: 14, height: 48, fontSize: 14, color: colors.text },
  formBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  cardContent: { gap: 2 },
  addrName: { fontSize: 15, fontWeight: '600', color: colors.text },
  addrLine: { fontSize: 13, color: colors.textSecondary },
  addrPhone: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  defaultBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.full, alignSelf: 'flex-start', marginTop: 6 },
  defaultText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.lg, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  actionLink: { fontSize: 13, fontWeight: '600', color: colors.primary },
});
