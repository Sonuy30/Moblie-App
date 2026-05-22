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

  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Demo account: phone=9876543210, OTP=123456
      const demoPhone = '9876543210';
      
      // 1. Request OTP (triggers mock or real backend)
      await requestOTP(demoPhone);

      // 2. Verify with bypass OTP 123456
      const { token, user } = await verifyOTP(demoPhone, '123456');
      
      if (!token || !user) {
        throw new Error('Demo login failed — could not get user session.');
      }

      const authenticatedUser = { 
        ...user, 
        role: (user.role || 'customer') as 'customer' | 'delivery_staff' | 'warehouse_staff' | 'admin'
      };
      
      // Store JWT session in SecureStore and Zustand
      await useAuthStore.getState().setSession(token, authenticatedUser);

      Toast.show({
        type: 'success',
        text1: '🎉 Demo Login Successful',
        text2: `Welcome, ${user.fullName || 'Demo Customer'}!`,
      });

      // All customers go to tabs (guest-browsing works without auth anyway)
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.message || 'Demo login failed. Please try manually.';
      setErrorMsg(msg);
      Toast.show({
        type: 'error',
        text1: 'Demo Login Failed',
        text2: msg,
      });
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

          {/* Development Demo Helper Tip */}
          <View style={styles.demoTipBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.demoTipText}>
              <Text style={{ fontWeight: 'bold' }}>Demo Mode Active:</Text> Enter any valid 10-digit number & use code <Text style={{ fontWeight: 'bold', color: colors.primary }}>123456</Text> to log in instantly.
            </Text>
          </View>

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

          <View style={styles.orDividerRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          {/* One-Tap Demo Login Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.demoButton,
              isLoading && styles.buttonDisabled,
              pressed && styles.buttonPressed
            ]} 
            onPress={handleDemoLogin}
            disabled={isLoading}
          >
            <LinearGradient 
              colors={['#2E7D32', '#1B5E20']} 
              style={styles.gradientBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="flash" size={18} color="#fff" />
              <Text style={styles.buttonText}>One-Tap Demo Login</Text>
            </LinearGradient>
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
    borderColor: 'rgba(24, 95, 165, 0.15)',
    height: 58,
    paddingHorizontal: 16
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF'
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
  demoTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: borderRadius.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(24, 95, 165, 0.1)'
  },
  demoTipText: {
    flex: 1,
    fontSize: 12,
    color: '#333333',
    lineHeight: 17
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
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 8
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)'
  },
  orText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  demoButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    justifyContent: 'center'
  }
});

