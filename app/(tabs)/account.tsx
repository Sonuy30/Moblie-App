import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore, NOTIFICATION_CATEGORY_META } from '@/stores/notificationStore';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function AccountScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { preferences, toggleCategory } = useNotificationStore();
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
            router.replace('/(tabs)');
          },
        },
      ]
    );
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
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, item === menuItems[menuItems.length - 1] && { borderBottomWidth: 0 }]}
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={item.route ? 0.6 : 0.9}
              disabled={!item.route}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color={item.route ? colors.textSecondary : colors.textMuted} />
                <Text style={[styles.menuLabel, !item.route && { color: colors.textMuted }]}>{item.label}</Text>
              </View>
              {item.route && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
              {!item.route && <Text style={styles.comingSoon}>Soon</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Notification Preferences ─────────────────────────────── */}
        {isAuthenticated && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderText}>Notification Preferences</Text>
            </View>
            <View style={styles.menu}>
              {NOTIFICATION_CATEGORY_META.map((meta, index) => (
                <View
                  key={meta.category}
                  style={[
                    styles.prefRow,
                    index === NOTIFICATION_CATEGORY_META.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.prefIcon}>
                    <Ionicons
                      name={meta.icon as React.ComponentProps<typeof Ionicons>['name']}
                      size={20}
                      color={preferences[meta.category] ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.prefInfo}>
                    <Text style={styles.prefLabel}>{meta.label}</Text>
                    <Text style={styles.prefDesc}>{meta.description}</Text>
                  </View>
                  <Switch
                    value={preferences[meta.category]}
                    onValueChange={() => { void toggleCategory(meta.category); }}
                    trackColor={{ false: colors.border, true: colors.primaryLight }}
                    thumbColor={
                      preferences[meta.category]
                        ? colors.primary
                        : Platform.OS === 'android'
                          ? colors.textMuted
                          : '#fff'
                    }
                    ios_backgroundColor={colors.border}
                  />
                </View>
              ))}
            </View>
          </>
        )}

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
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  comingSoon: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  companyBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  companyBadgeText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
  },
  guestActionContainer: {
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  guestContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  guestIcon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 48,
    height: 96,
    justifyContent: 'center',
    marginBottom: 24,
    width: 96,
  },
  guestLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 10,
  },
  guestLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  guestPrimaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    elevation: 4,
    height: 52,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  guestPrimaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSecondaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
  },
  guestSecondaryBtnText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  guestSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  guestTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  header: {
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  logoutBtn: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: 32,
    paddingVertical: 14,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '700',
  },
  menu: {
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 3,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
  },
  menuItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  menuLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: spacing.lg,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  profilePhone: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  version: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  // ── Notification preferences ─────────────────────────────────────────────
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl + 4,
  },
  sectionHeaderText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  prefRow: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  prefIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  prefInfo: {
    flex: 1,
    gap: 2,
  },
  prefLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  prefDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
});
