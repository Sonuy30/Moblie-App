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
  flex: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 52, paddingBottom: 40 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 10,
  },
  companyLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  companySubLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 3,
    marginTop: 2,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl, textAlign: 'center', lineHeight: 19 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.errorLight, padding: spacing.md,
    borderRadius: borderRadius.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(163,45,45,0.1)',
  },
  errorBoxText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '600' },
  form: { gap: spacing.lg },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    height: 52, borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden',
  },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  inputPrefix: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: '#F0F4F8',
  },
  countryCode: { fontSize: 14, fontWeight: '700', color: colors.text },
  divider: { width: 1, height: '60%', backgroundColor: colors.border },
  inputIcon: { marginLeft: 14 },
  input: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500', paddingHorizontal: 12, height: '100%' },
  eyeBtn: { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
  fieldError: { fontSize: 12, color: colors.error, fontWeight: '600', marginTop: 2 },
  submitBtnWrapper: {
    borderRadius: borderRadius.lg, overflow: 'hidden', marginTop: spacing.sm,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 6,
  },
  submitBtn: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  hintBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0F7FF', padding: 10, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: 'rgba(24,95,165,0.12)',
  },
  hintText: { flex: 1, fontSize: 12, color: colors.primaryDark, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '800' },
});
