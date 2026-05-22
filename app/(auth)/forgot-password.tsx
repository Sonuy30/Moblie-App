import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordForm } from '@/utils/validation';
import { forgotPasswordAPI } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function ForgotPasswordScreen() {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await forgotPasswordAPI(data.email);
      Alert.alert('Check your email', 'We sent you a password reset link.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <TextInput style={styles.input} placeholder="your@email.com" placeholderTextColor={colors.textMuted}
                keyboardType="email-address" autoCapitalize="none" onBlur={onBlur} onChangeText={onChange} value={value} />
            </View>
          )} />
          {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing['2xl'], paddingTop: spacing['5xl'] },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing['3xl'] },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: spacing['2xl'] },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing['3xl'], lineHeight: 20 },
  field: { gap: 6, marginBottom: spacing.xl },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, height: 52, gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  inputError: { borderColor: colors.error },
  input: { flex: 1, fontSize: 15, color: colors.text },
  fieldError: { fontSize: 12, color: colors.error, fontWeight: '500' },
  submitBtn: { backgroundColor: colors.primary, height: 52, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
