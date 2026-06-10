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
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });


  const setupPushNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if ((status as string) !== 'granted') return;
      // Expo Go SDK 53+ removed native push — use a mock token to prevent crash
      const isExpoGo = (Constants.executionEnvironment as string) === 'storeClient';
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

      void setupPushNotifications();

      const pendingAction = useAuthModalStore.getState().pendingAction;
      const pendingData = useAuthModalStore.getState().pendingData;

      if (pendingAction === 'cart' && pendingData) {
        useCartStore.getState().addItem(pendingData as any);
      }
      useAuthModalStore.getState().hide();

      if (pendingAction === 'checkout') {
        if (pendingData) useCartStore.getState().addItem(pendingData as any);
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
            onPress={() => { void handleSubmit(onSubmit)(); }}
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
  backBtn: {
    alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22,
    height: 44,
    justifyContent: 'center', marginBottom: spacing.xl,
    width: 44,
  },
  companyLabel: {
    color: colors.primary,
    fontSize: 22,
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
  forgotLink: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  form: { gap: spacing.lg },
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
  labelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  logoCircle: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 44,
    elevation: 6,
    height: 88,
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    width: 88,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  scroll: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: spacing.xl, paddingTop: 52 },
  submitBtn: {
    alignItems: 'center', flexDirection: 'row',
    gap: 10, height: 54, justifyContent: 'center',
  },
  submitBtnWrapper: {
    borderRadius: borderRadius.lg,
    elevation: 6,
    marginTop: spacing.sm,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },

  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: spacing.xl, textAlign: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },


});
