import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore, NOTIFICATION_CATEGORY_META } from '@/stores/notificationStore';
import { useBiometrics } from '@/hooks/useBiometrics';
import { deleteAccount } from '@/api/auth';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';


export default function AccountScreen() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { preferences, toggleCategory } = useNotificationStore();
  const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'DailyNest';

  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const { isSupported, isEnrolled, authenticate } = useBiometrics();


  useEffect(() => {
    const loadBiometricsPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem('aits_biometrics_preference');
        setBiometricsEnabled(stored === 'true');
      } catch (e) {
        console.warn('Failed to load biometric preference', e);
      }
    };
    if (isAuthenticated) {
      void loadBiometricsPreference();
    }
  }, [isAuthenticated]);

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      if (!isSupported || !isEnrolled) {
        Alert.alert(
          'Biometrics Not Available',
          'Please ensure that fingerprint or Face ID is enabled and registered on your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }
      const success = await authenticate();
      if (success) {
        setBiometricsEnabled(true);
        await AsyncStorage.setItem('aits_biometrics_preference', 'true');
        Toast.show({
          type: 'success',
          text1: 'Biometric Login Enabled',
          text2: 'You can now sign in using your fingerprint or Face ID.',
          position: 'bottom',
        });
      }
    } else {
      setBiometricsEnabled(false);
      await AsyncStorage.setItem('aits_biometrics_preference', 'false');
      Toast.show({
        type: 'info',
        text1: 'Biometric Login Disabled',
        text2: 'Biometric authentication has been turned off.',
        position: 'bottom',
      });
    }
  };

  const menuItems = [
    { icon: 'cube-outline' as const, label: 'My orders', route: '/(tabs)/orders' as const },
    { icon: 'location-outline' as const, label: 'Saved addresses', route: '/addresses' as const },
    ...(user && (user.role === 'admin' || user.role === 'delivery_staff' || user.role === 'warehouse_staff')
      ? [{ icon: 'calculator-outline' as const, label: 'Staff Portal', route: '/(staff)' as const }]
      : []
    ),
    { icon: 'notifications-outline' as const, label: 'Notifications', route: null },
    { icon: 'lock-closed-outline' as const, label: 'Change password', route: '/(auth)/change-password' as const },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', route: '/support' as const },
    { icon: 'document-text-outline' as const, label: 'Terms & Privacy', route: '/terms' as const },
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
    const doLogout = async () => {
      await logout();
      Toast.show({
        type: 'info',
        text1: 'Signed Out',
        text2: 'You have been signed out successfully.',
        position: 'bottom',
      });
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      const confirmLogout = typeof window !== 'undefined' ? window.confirm('Are you sure you want to sign out?') : true;
      if (confirmLogout) {
        void doLogout();
      }
      return;
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            void doLogout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and all associated data (orders, addresses, subscriptions). This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All your personal data will be permanently erased from our servers.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: () => void doDeleteAccount(),
                },
              ]
            );
          },
        },
      ]
    );
  };

  const doDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      await logout();
      await AsyncStorage.clear();
      Toast.show({
        type: 'info',
        text1: 'Account Deleted',
        text2: 'Your account and all data have been permanently removed.',
        position: 'bottom',
      });
      router.replace('/(onboarding)/welcome');
    } catch (e: unknown) {
      setIsDeletingAccount(false);
      const msg = e instanceof Error ? e.message : 'Failed to delete account. Please try again.';
      Alert.alert('Error', msg, [{ text: 'OK' }]);
    }
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
              accessibilityLabel="Sign in to your account"
              accessibilityRole="button"
            >
              <Text style={styles.guestPrimaryBtnText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestSecondaryBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
              accessibilityLabel="Create a new account"
              accessibilityRole="button"
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
              onPress={() => {
                if (item.route) {
                  router.push(item.route);
                } else {
                  Alert.alert('Coming Soon', 'This feature is being built. Available in the next update.', [{ text: 'OK' }]);
                }
              }}
              activeOpacity={0.6}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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

        {/* ── Security Settings ───────────────────────────────────── */}
        {isAuthenticated && isSupported && isEnrolled && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderText}>Security Settings</Text>
            </View>
            <View style={styles.menu}>
              <View style={[styles.prefRow, { borderBottomWidth: 0 }]}>
                <View style={styles.prefIcon}>
                  <Ionicons
                    name="finger-print-outline"
                    size={20}
                    color={biometricsEnabled ? colors.primary : colors.textMuted}
                  />
                </View>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>Biometric Sign-In</Text>
                  <Text style={styles.prefDesc}>Use fingerprint or Face ID for fast and secure access</Text>
                </View>
                <Switch
                  value={biometricsEnabled}
                  onValueChange={(val) => { void handleToggleBiometrics(val); }}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={
                    biometricsEnabled
                      ? colors.primary
                      : Platform.OS === 'android'
                        ? colors.textMuted
                        : '#fff'
                  }
                  ios_backgroundColor={colors.border}
                />
              </View>
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
          accessibilityLabel="Sign out of your account"
          accessibilityRole="button"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
          disabled={isDeletingAccount}
          accessibilityLabel="Permanently delete your account"
          accessibilityRole="button"
        >
          {isDeletingAccount ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          )}
          <Text style={styles.deleteAccountText}>
            {isDeletingAccount ? 'Deleting…' : 'Delete My Account'}
          </Text>
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
    borderColor: colors.primaryLight,
    borderRadius: 36,
    borderWidth: 3,
    elevation: 6,
    height: 72,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: 72,
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
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
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    elevation: 2,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  prefDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
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
  prefRow: {
    alignItems: 'center',
    borderBottomColor: colors.surface,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
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
  version: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  deleteAccountBtn: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.errorLight,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: 12,
    paddingVertical: 12,
  },
  deleteAccountText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
  },
});
