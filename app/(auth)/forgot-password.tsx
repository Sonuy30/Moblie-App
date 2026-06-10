import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordForm } from '@/utils/validation';
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
        <Text style={styles.subtitle}>{"Enter your email and we'll send you a reset link"}</Text>

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

        <TouchableOpacity style={styles.submitBtn} onPress={() => { void handleSubmit(onSubmit)(); }} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, height: 40, justifyContent: 'center', marginBottom: spacing['3xl'], width: 40 },
  field: { gap: 6, marginBottom: spacing.xl },
  fieldError: { color: colors.error, fontSize: 12, fontWeight: '500' },
  flex: { backgroundColor: colors.background, flex: 1 },
  iconCircle: { alignItems: 'center', alignSelf: 'center', backgroundColor: colors.primaryLight, borderRadius: 40, height: 80, justifyContent: 'center', marginBottom: spacing['2xl'], width: 80 },
  input: { color: colors.text, flex: 1, fontSize: 15 },
  inputContainer: { alignItems: 'center', backgroundColor: colors.surface, borderColor: 'transparent', borderRadius: borderRadius.md, borderWidth: 1.5, flexDirection: 'row', gap: 10, height: 52, paddingHorizontal: spacing.lg },
  inputError: { borderColor: colors.error },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  scroll: { flexGrow: 1, padding: spacing['2xl'], paddingTop: spacing['5xl'] },
  submitBtn: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: borderRadius.md, height: 52, justifyContent: 'center' },
  submitText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: spacing['3xl'], textAlign: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
});
