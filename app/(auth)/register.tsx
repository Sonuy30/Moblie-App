import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterForm } from '@/utils/validation';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function RegisterScreen() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', phone: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setApiError('');
    const result = await registerUser({ fullName: data.fullName, email: data.email, phone: data.phone, password: data.password });
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setApiError(result.error || 'Registration failed');
    }
  };

  const renderField = (name: keyof RegisterForm, label: string, icon: keyof typeof Ionicons.glyphMap, opts: any = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Controller control={control} name={name} render={({ field: { onChange, onBlur, value } }) => (
        <View style={[styles.inputContainer, errors[name] && styles.inputError]}>
          <Ionicons name={icon} size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholderTextColor={colors.textMuted}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value as string}
            {...opts}
          />
          {(name === 'password' || name === 'confirmPassword') && (
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )} />
      {errors[name] && <Text style={styles.fieldError}>{errors[name]?.message}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start shopping today</Text>

        {apiError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorBoxText}>{apiError}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {renderField('fullName', 'Full Name', 'person-outline', { placeholder: 'John Doe', autoCapitalize: 'words' })}
          {renderField('phone', 'Mobile Number', 'call-outline', { placeholder: '9876543210', keyboardType: 'phone-pad', maxLength: 10 })}
          {renderField('email', 'Email Address', 'mail-outline', { placeholder: 'your@email.com', keyboardType: 'email-address', autoCapitalize: 'none' })}
          {renderField('password', 'Password', 'lock-closed-outline', { placeholder: 'Min 8 characters', secureTextEntry: !showPassword })}
          {renderField('confirmPassword', 'Confirm Password', 'lock-closed-outline', { placeholder: 'Re-enter password', secureTextEntry: !showPassword })}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing['2xl'], paddingTop: spacing['5xl'] },
  header: { marginBottom: spacing['2xl'] },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing['2xl'] },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg },
  errorBoxText: { flex: 1, fontSize: 13, color: colors.error, fontWeight: '500' },
  form: { gap: spacing.lg },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, height: 52, gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  inputError: { borderColor: colors.error },
  input: { flex: 1, fontSize: 15, color: colors.text },
  fieldError: { fontSize: 12, color: colors.error, fontWeight: '500' },
  submitBtn: { backgroundColor: colors.primary, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing['2xl'], paddingBottom: spacing['3xl'] },
  footerText: { fontSize: 14, color: colors.textSecondary },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});
