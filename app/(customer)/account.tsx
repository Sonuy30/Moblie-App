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
  { icon: 'cube-outline' as const, label: 'My Orders', route: '/(customer)/orders' },
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
          <Button title="Sign In" onPress={() => router.push('/(onboarding)/phone')} fullWidth style={{ marginTop: spacing.xl }} />
          <Button title="Create Account" onPress={() => router.push('/(onboarding)/phone')} variant="outline" fullWidth style={{ marginTop: spacing.md }} />
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
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={0.6}>
              <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={async () => { await logout(); router.replace('/(onboarding)/welcome'); }}>
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
  editBtn: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  guestContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: spacing['3xl'] },
  guestIcon: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 50, height: 100, justifyContent: 'center', marginBottom: spacing['2xl'], width: 100 },
  guestSub: { color: colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center' },
  guestTitle: { color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  logoutBtn: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: spacing['2xl'], paddingVertical: spacing.lg },
  logoutText: { color: colors.error, fontSize: 15, fontWeight: '600' },
  menu: { backgroundColor: colors.white, borderRadius: borderRadius.xl, elevation: 3, marginHorizontal: spacing.lg, marginTop: spacing['2xl'], overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  menuItem: { alignItems: 'center', borderBottomColor: colors.surface, borderBottomWidth: 1, flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 16 },
  menuLabel: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '500' },
  profileCard: { alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.xl, elevation: 3, flexDirection: 'row', gap: spacing.lg, marginHorizontal: spacing.lg, padding: spacing.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  profileEmail: { color: colors.textSecondary, fontSize: 13 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  profilePhone: { color: colors.textSecondary, fontSize: 13 },
  safe: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', paddingBottom: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  version: { color: colors.textMuted, fontSize: 12, marginTop: spacing.lg, textAlign: 'center' },
});
