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
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerUser } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', password: '', confirmPassword: '' },
  });


  const [isMockMode, setIsMockMode] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setApiError('');
    setIsMockMode(false);
    try {
      const result = await registerUser({
        fullName: data.fullName,
        phone: data.phone,
        password: data.password,
      });
      setLoading(false);
      // Check if server returned a devOtp (dev mode)
      const isMock = (result as any).isMock === true || !(result as any).companyName;
      if (isMock) setIsMockMode(true);
      // Pass devOtp (if returned by server in dev mode) to OTP screen
      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: data.phone,
          fullName: data.fullName,
          devOtp: (result as any).devOtp || '',
        },
      });
    } catch (err: any) {
      setLoading(false);
      setApiError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Company Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="cube" size={40} color={colors.primary} />
          </View>
          <Text style={styles.companyLabel}>{companyName}</Text>
          <Text style={styles.companySubLabel}>PRIVATE LIMITED</Text>
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Join thousands of businesses buying steel directly
        </Text>

        {/* Error Banner */}
        {apiError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorBoxText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Full Name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
                  <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
            {errors.fullName && <Text style={styles.fieldError}>{errors.fullName.message}</Text>}
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
                  <View style={styles.inputPrefix}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              )}
            />
            {errors.phone && <Text style={styles.fieldError}>{errors.phone.message}</Text>}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor={colors.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7} style={styles.eyeBtn}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor={colors.textMuted}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} activeOpacity={0.7} style={styles.eyeBtn}>
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

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={['#185FA5', '#0C447C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.submitText}>Send OTP & Verify</Text>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>



          {/* OTP Hint */}
          <View style={styles.hintBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primaryDark} />
            <Text style={styles.hintText}>
              Your OTP will be displayed on the next screen (SMS not yet configured)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22,
    height: 44,
    justifyContent: 'center', marginBottom: spacing.lg,
    width: 44,
  },
  companyLabel: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  companySubLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 2,
  },
  countryCode: { color: colors.text, fontSize: 14, fontWeight: '700' },
  divider: { backgroundColor: colors.border, height: '60%', width: 1 },
  errorBox: {
    alignItems: 'center', backgroundColor: colors.errorLight, borderColor: 'rgba(163,45,45,0.1)',
    borderRadius: borderRadius.md, borderWidth: 1,
    flexDirection: 'row', gap: 8,
    marginBottom: spacing.lg, padding: spacing.md,
  },
  errorBoxText: { color: colors.error, flex: 1, fontSize: 13, fontWeight: '600' },
  eyeBtn: { height: '100%', justifyContent: 'center', paddingHorizontal: 14 },
  field: { gap: 6 },
  fieldError: { color: colors.error, fontSize: 12, fontWeight: '600', marginTop: 2 },
  flex: { backgroundColor: '#FFFFFF', flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerLink: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  footerText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  form: { gap: spacing.lg },
  hintBox: {
    alignItems: 'center', backgroundColor: '#F0F7FF', borderColor: 'rgba(24,95,165,0.12)',
    borderRadius: borderRadius.md, borderWidth: 1, flexDirection: 'row',
    gap: 6, padding: 10,
  },
  hintText: { color: colors.primaryDark, flex: 1, fontSize: 12, fontWeight: '500' },
  input: { color: colors.text, flex: 1, fontSize: 15, fontWeight: '500', height: '100%', paddingHorizontal: 12 },
  inputContainer: {
    alignItems: 'center', backgroundColor: colors.surface,
    borderColor: colors.border, borderRadius: borderRadius.lg,
    borderWidth: 1.5, flexDirection: 'row', height: 52,
    overflow: 'hidden',
  },
  inputError: { backgroundColor: colors.errorLight, borderColor: colors.error },
  inputIcon: { marginLeft: 14 },
  inputPrefix: {
    backgroundColor: '#F0F4F8',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  label: { color: colors.text, fontSize: 13, fontWeight: '700' },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 40,
    elevation: 6,
    height: 80,
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    width: 80,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scroll: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: spacing.xl, paddingTop: 52 },

  submitBtn: { alignItems: 'center', flexDirection: 'row', gap: 10, height: 54, justifyContent: 'center' },
  submitBtnWrapper: {
    borderRadius: borderRadius.lg, elevation: 6, marginTop: spacing.sm,
    overflow: 'hidden', shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: spacing.xl, textAlign: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
});
