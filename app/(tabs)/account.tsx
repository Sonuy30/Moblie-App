import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function AccountScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

  const menuItems = [
    { icon: 'cube-outline' as const, label: 'My orders', route: '/(tabs)/orders' as const },
    { icon: 'location-outline' as const, label: 'Saved addresses', route: '/addresses' as const },
    { icon: 'notifications-outline' as const, label: 'Notifications', route: null },
    { icon: 'lock-closed-outline' as const, label: 'Change password', route: null },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', route: null },
    { icon: 'document-text-outline' as const, label: 'Terms & Privacy', route: null },
  ];

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIcon}>
            <Ionicons name="cart-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to {companyName}</Text>
          <Text style={styles.guestSub}>Sign in to see your orders, addresses, and more</Text>

          <View style={styles.guestActionContainer}>
            <TouchableOpacity
              style={styles.guestPrimaryBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestPrimaryBtnText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.guestSecondaryBtnText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestLink}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.7}
            >
              <Text style={styles.guestLinkText}>Continue Browsing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>My Account</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profilePhone}>+91 {user.phone}</Text>
            <View style={styles.companyBadge}>
              <Ionicons name="business" size={12} color={colors.primary} />
              <Text style={styles.companyBadgeText}>{companyName}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i === menuItems.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.6}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{companyName} · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  guestIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  guestSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  guestActionContainer: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  guestPrimaryBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  guestPrimaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    backgroundColor: colors.primaryLight,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSecondaryBtnText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  guestLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  profilePhone: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
    gap: 4,
  },
  companyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  menu: {
    marginTop: spacing.xl,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    paddingVertical: 14,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.errorLight,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.lg,
    fontWeight: '500',
  },
});
