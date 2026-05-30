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
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { loginUser, updateProfile } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useCartStore } from '@/stores/cartStore';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

const loginSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });


  const setupPushNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      // Expo Go SDK 53+ removed native push — use a mock token to prevent crash
      const isExpoGo = Constants.executionEnvironment === 'storeClient';
      if (isExpoGo) return; // skip — no native push service in Expo Go
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await updateProfile({ pushToken: token });
    } catch (e) {
      console.warn('Push notification setup error:', e);
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setApiError('');
    try {
      const { authToken, user } = await loginUser({
        phone: data.phone,
        password: data.password,
      });

      await useAuthStore.getState().setSession(authToken, user);

      Toast.show({
        type: 'success',
        text1: `Welcome back, ${user.fullName.split(' ')[0]}!`,
        text2: `Signed in to ${companyName}`,
        position: 'bottom',
      });

      setupPushNotifications();

      const pendingAction = useAuthModalStore.getState().pendingAction;
      const pendingData = useAuthModalStore.getState().pendingData;

      if (pendingAction === 'cart' && pendingData) {
        useCartStore.getState().addItem(pendingData);
      }
      useAuthModalStore.getState().hide();

      if (pendingAction === 'checkout') {
        if (pendingData) useCartStore.getState().addItem(pendingData);
        router.replace('/checkout');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setLoading(false);
      setApiError(getErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        {/* Company Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="cube" size={40} color={colors.primary} />
          </View>
          <Text style={styles.companyLabel}>{companyName}</Text>
          <Text style={styles.companySubLabel}>PRIVATE LIMITED</Text>
        </View>

        {/* Header Text */}
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account to continue shopping</Text>

        {/* Error Banner */}
        {apiError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorBoxText}>{apiError}</Text>
          </View>
        ) : null}

        {/* Demo Credentials Hint */}
        <View style={styles.demoBox}>
          <Ionicons name="flask-outline" size={16} color="#0C447C" />
          <View style={{ flex: 1 }}>
            <Text style={styles.demoTitle}>Demo / Offline Mode Credentials</Text>
            <Text style={styles.demoLine}>📱 Phone: <Text style={styles.demoBold}>9876543210</Text></Text>
            <Text style={styles.demoLine}>🔑 Password: <Text style={styles.demoBold}>Demo@123</Text></Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} activeOpacity={0.7}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
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

          {/* Sign In Button */}
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
                  <Text style={styles.submitText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>


        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to {companyName}? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/register')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>Create Account</Text>
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
    marginBottom: spacing.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
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
    fontSize: 22,
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
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { fontSize: 12, color: colors.primary, fontWeight: '700' },
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
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtn: {
    height: 54, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '800' },

  // Demo credentials box
  demoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E8F4FD',
    borderWidth: 1.5,
    borderColor: '#185FA5',
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: spacing.lg,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0C447C',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  demoLine: {
    fontSize: 13,
    color: '#185FA5',
    marginTop: 2,
  },
  demoBold: {
    fontWeight: '800',
    color: '#0C447C',
  },
});
