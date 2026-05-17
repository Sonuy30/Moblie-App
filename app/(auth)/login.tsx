import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginForm } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function LoginScreen() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setApiError('');
    const result = await login(data.email, data.password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setApiError(result.error || 'Login failed');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue shopping</Text>

        {apiError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorBoxText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )} />
            {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            )} />
            {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing['2xl'], paddingTop: spacing['5xl'] },
  header: { marginBottom: spacing['3xl'] },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing['3xl'] },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  errorBoxText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '500' },
  form: { gap: spacing.xl },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, height: 52, gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  inputError: { borderColor: colors.error },
  input: { flex: 1, fontSize: 15, color: colors.text },
  fieldError: { fontSize: 12, color: colors.error, fontWeight: '500' },
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  submitBtn: { backgroundColor: colors.primary, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing['3xl'] },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
