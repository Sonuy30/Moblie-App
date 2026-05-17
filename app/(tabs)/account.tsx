import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const menuItems = [
  { icon: 'cube-outline' as const, label: 'My Orders', route: '/(tabs)/orders' },
  { icon: 'heart-outline' as const, label: 'Wishlist', route: '/wishlist' },
  { icon: 'location-outline' as const, label: 'Saved Addresses', route: '/addresses' },
  { icon: 'notifications-outline' as const, label: 'Notifications', route: null },
  { icon: 'lock-closed-outline' as const, label: 'Change Password', route: null },
  { icon: 'star-outline' as const, label: 'My Reviews', route: null },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', route: null },
  { icon: 'document-text-outline' as const, label: 'Terms & Privacy Policy', route: null },
];

export default function AccountScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.guestTitle}>Sign in to your account</Text>
          <Text style={styles.guestSub}>See your orders, wishlist and more</Text>
          <Button title="Sign In" onPress={() => router.push('/(auth)/login')} fullWidth style={{ marginTop: spacing.xl }} />
          <Button title="Create Account" onPress={() => router.push('/(auth)/register')} variant="outline" fullWidth style={{ marginTop: spacing.md }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Account</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar name={user.fullName} size={64} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <Text style={styles.profilePhone}>{user.phone}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.6}>
              <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/(auth)/welcome'); }}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AITS Shop v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  guestContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing['3xl'] },
  guestIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing['2xl'] },
  guestTitle: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  guestSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, marginHorizontal: spacing.lg, borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.text },
  profileEmail: { fontSize: 13, color: colors.textSecondary },
  profilePhone: { fontSize: 13, color: colors.textSecondary },
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  menu: { marginTop: spacing['2xl'], marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: borderRadius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing.xl, gap: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.surface },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing['2xl'], paddingVertical: spacing.lg },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
  version: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: spacing.lg },
});
