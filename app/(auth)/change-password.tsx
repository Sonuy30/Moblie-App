import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Toast from 'react-native-toast-message';
import { changePassword } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

// ── Zod Schema ────────────────────────────────────────────────────────────────

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(64, 'Password cannot exceed 64 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must differ from your current password',
    path: ['newPassword'],
  });

type FormData = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChangePasswordScreen() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Password Changed',
        text2: result.message || 'Your password has been updated successfully.',
        position: 'bottom',
      });
      reset();
      router.back();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: getErrorMessage(err),
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Icon hero */}
          <View style={styles.iconHero}>
            <View style={styles.iconBg}>
              <Ionicons name="lock-closed-outline" size={36} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Secure your account</Text>
            <Text style={styles.heroSub}>
              Choose a strong password that you don't use anywhere else.
            </Text>
          </View>

          {/* Current Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Current Password</Text>
            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.currentPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showCurrent}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrent((v) => !v)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={showCurrent ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.currentPassword && (
              <Text style={styles.fieldError}>{errors.currentPassword.message}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New Password</Text>
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.newPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Min 8 characters"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showNew}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNew((v) => !v)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={showNew ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showNew ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.newPassword && (
              <Text style={styles.fieldError}>{errors.newPassword.message}</Text>
            )}
          </View>

          {/* Confirm New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <View
                  style={[
                    styles.inputWrapper,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showConfirm}
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => { void handleSubmit(onSubmit)(); }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm((v) => !v)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>
            )}
          </View>

          {/* Strength tip */}
          <View style={styles.tipBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.tipText}>
              Use 8+ characters with a mix of uppercase, lowercase, numbers, and symbols.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={() => { void handleSubmit(onSubmit)(); }}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityLabel="Update password"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.white} />
                <Text style={styles.submitBtnText}>Update Password</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  fieldError: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: { width: 40 },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  iconBg: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 80,
  },
  iconHero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 10,
    height: 52,
    paddingHorizontal: spacing.md,
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    elevation: 5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  tipBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  tipText: {
    color: colors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
});
