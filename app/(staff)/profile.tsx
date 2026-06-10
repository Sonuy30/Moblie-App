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
  companyCard: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: borderRadius.lg, flexDirection: 'row', gap: 12, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg },
  companyId: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  companyName: { color: colors.primaryDark, fontSize: 15, fontWeight: '600' },
  logoutBtn: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: spacing['3xl'], paddingVertical: spacing.lg },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  menuGroup: { backgroundColor: colors.white, borderRadius: borderRadius.xl, elevation: 3, marginHorizontal: spacing.lg, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  menuItem: { alignItems: 'center', borderBottomColor: colors.surface, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 14 },
  menuLabel: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '500' },
  menuValue: { color: colors.textMuted, fontSize: 13, marginRight: 4 },
  profileCard: { alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.xl, elevation: 3, flexDirection: 'row', gap: spacing.lg, marginHorizontal: spacing.lg, padding: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { color: colors.text, fontSize: 20, fontWeight: '700' },
  profilePhone: { color: colors.textSecondary, fontSize: 13 },
  profileRole: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  safe: { backgroundColor: colors.background, flex: 1 },
  section: { marginTop: spacing['2xl'] },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: spacing.sm, paddingHorizontal: spacing.lg, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  version: { color: colors.textMuted, fontSize: 12, marginTop: spacing.lg, textAlign: 'center' },
});
