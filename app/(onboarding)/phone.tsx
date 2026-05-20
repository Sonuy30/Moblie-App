import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { requestOTP } from '@/api/auth';
import { getErrorMessage } from '@/api/client';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const onSubmit = async () => {
    if (!isValidPhone) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(false);
    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await requestOTP(phone);
      router.push({
        pathname: '/(onboarding)/otp',
        params: { 
          phone, 
          companyName: result.companyName || '', 
          maskedPhone: result.maskedPhone || phone 
        },
      });
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Back Button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.header}>
          <LinearGradient colors={['#E6F1FB', '#FFFFFF']} style={styles.badgeGradient}>
            <Ionicons name="phone-portrait-outline" size={32} color={colors.primary} />
          </LinearGradient>
          <Text style={styles.title}>What's your number?</Text>
          <Text style={styles.subtitle}>Enter your phone number to sign in or create a standard supplier retail account.</Text>
        </View>

        {/* Card Body */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          
          <View style={[
            styles.inputWrapper, 
            isFocused && styles.inputWrapperFocused,
            phone.length === 10 && !isValidPhone && styles.inputWrapperError
          ]}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇮🇳</Text>
              <Text style={styles.code}>+91</Text>
              <View style={styles.divider} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={10}
              value={phone}
              onChangeText={(val) => {
                const cleaned = val.replace(/[^0-9]/g, '');
                setPhone(cleaned);
                if (errorMsg) setErrorMsg('');
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              autoFocus
            />

            {isValidPhone && (
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              </View>
            )}
          </View>

          {/* Inline Error */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              (!isValidPhone || isLoading) && styles.buttonDisabled,
              pressed && isValidPhone && styles.buttonPressed
            ]} 
            onPress={onSubmit}
            disabled={!isValidPhone || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient 
                colors={isValidPhone ? ['#185FA5', '#0C447C'] : ['#A6C5E3', '#8CB4D9']} 
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Verification Code</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            )}
          </Pressable>
        </View>

        <Text style={styles.securityText}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} /> Secure connection powered by AITS ERP Node Server. We never sell your data.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  scrollContainer: { 
    flexGrow: 1, 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    justifyContent: 'space-between'
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10
  },
  badgeGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#1A1A18',
    textAlign: 'center',
    marginBottom: 12
  },
  subtitle: { 
    fontSize: 14, 
    color: '#5F5E5A', 
    textAlign: 'center', 
    lineHeight: 21,
    paddingHorizontal: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: 20,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(24, 95, 165, 0.05)',
    marginBottom: 40
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(24, 95, 165, 0.1)',
    height: 58,
    paddingHorizontal: 16
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  inputWrapperError: {
    borderColor: colors.error
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 18,
    marginRight: 6
  },
  code: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A18'
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 12
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A18',
    letterSpacing: 1
  },
  successIcon: {
    marginLeft: 8
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: borderRadius.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(163, 45, 45, 0.1)'
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: '500'
  },
  button: {
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: 20,
    justifyContent: 'center'
  },
  buttonDisabled: {
    opacity: 0.95
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }]
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 10
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  securityText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 'auto',
    paddingHorizontal: 20
  }
});
