import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { requestOTP, verifyOTP } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import Toast from 'react-native-toast-message';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<TextInput>(null);

  // Safe delayed focus after transition completes to prevent immediate keyboard close
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const isValidPhone = /^[6-9]\d{9}$/.test(phone);

  const onSubmit = async () => {
    if (!isValidPhone) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              ref={inputRef}
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

          {/* Manual Submit Button */}
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
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
    width: 44
  },
  badgeGradient: {
    alignItems: 'center',
    borderRadius: 36,
    elevation: 3,
    height: 72,
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    width: 72
  },
  button: {
    borderRadius: borderRadius.lg,
    height: 56,
    justifyContent: 'center',
    marginTop: 20,
    overflow: 'hidden'
  },
  buttonDisabled: {
    opacity: 0.95
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }]
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(24, 95, 165, 0.05)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    elevation: 5,
    marginBottom: 40,
    padding: 20,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20
  },
  code: {
    color: '#1A1A18',
    fontSize: 16,
    fontWeight: '600'
  },
  container: { 
    backgroundColor: '#FFFFFF', 
    flex: 1 
  },
  countryCode: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  divider: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    height: 24,
    marginHorizontal: 12,
    width: 1
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(163, 45, 45, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    padding: 12
  },
  errorText: {
    color: colors.error,
    flex: 1,
    fontSize: 13,
    fontWeight: '500'
  },
  flag: {
    fontSize: 18,
    marginRight: 6
  },
  gradientBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: '100%',
    justifyContent: 'center'
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10
  },
  input: {
    color: '#1A1A18',
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1
  },
  inputLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(24, 95, 165, 0.15)',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 58,
    paddingHorizontal: 16
  },
  inputWrapperError: {
    borderColor: colors.error
  },
  inputWrapperFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'space-between', 
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40
  },
  securityText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 'auto',
    paddingHorizontal: 20,
    textAlign: 'center'
  },
  subtitle: { 
    color: '#5F5E5A', 
    fontSize: 14, 
    lineHeight: 21, 
    paddingHorizontal: 12,
    textAlign: 'center'
  },
  successIcon: {
    marginLeft: 8
  },
  title: { 
    color: '#1A1A18', 
    fontSize: 26, 
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center'
  }
});

