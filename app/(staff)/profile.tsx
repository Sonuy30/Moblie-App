import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '@/components/ui/Avatar';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const settingsItems = [
  { icon: 'notifications-outline' as const, label: 'Notifications', value: 'On' },
  { icon: 'location-outline' as const, label: 'Location Sharing', value: 'Active' },
  { icon: 'moon-outline' as const, label: 'Dark Mode', value: 'Off' },
];

const supportItems = [
  { icon: 'help-circle-outline' as const, label: 'Help & Support' },
  { icon: 'document-text-outline' as const, label: 'Terms & Conditions' },
  { icon: 'shield-checkmark-outline' as const, label: 'Privacy Policy' },
];

export default function StaffProfile() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(onboarding)/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={user?.fullName || 'Staff'} size={72} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.fullName || 'Staff User'}</Text>
            <Text style={styles.profileRole}>
              {user?.role === 'delivery_staff' ? '🚚 Delivery Agent' :
               user?.role === 'warehouse_staff' ? '📦 Warehouse Staff' :
               user?.role === 'admin' ? '⚙️ Admin' : user?.role}
            </Text>
            <Text style={styles.profilePhone}>{user?.phone}</Text>
          </View>
        </View>

        {/* Company Info */}
        <View style={styles.companyCard}>
          <Ionicons name="business-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName}>{user?.companyName || 'Company'}</Text>
            <Text style={styles.companyId}>ID: {user?.companyId?.slice(-8) || '—'}</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuGroup}>
            {settingsItems.map((item, i) => (
              <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.6}>
                <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuValue}>{item.value}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuGroup}>
            {supportItems.map((item, i) => (
              <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.6}>
                <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01'} Pvt Ltd · v1.0.0 · Staff Portal</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: spacing.lg, borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.text },
  profileRole: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  profilePhone: { fontSize: 13, color: colors.textSecondary },
  companyCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primaryLight, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: borderRadius.lg, padding: spacing.lg },
  companyName: { fontSize: 15, fontWeight: '600', color: colors.primaryDark },
  companyId: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { marginTop: spacing['2xl'] },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  menuGroup: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: borderRadius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.lg, gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  menuValue: { fontSize: 13, color: colors.textMuted, marginRight: 4 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing['3xl'], paddingVertical: spacing.lg },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
  version: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: spacing.lg },
});
