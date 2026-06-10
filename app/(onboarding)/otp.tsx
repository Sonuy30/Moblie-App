import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { verifyOTP, requestOTP } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/api/client';

export default function OTPScreen() {
  const { phone, maskedPhone, companyName, inviteToken, customerId, fromInvite } = useLocalSearchParams<{ 
    phone: string, 
    maskedPhone: string, 
    companyName: string,
    inviteToken?: string,
    customerId?: string,
    fromInvite?: string
  }>();

  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(120); // 120 seconds OTP expiry as specified in ERP specs
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<TextInput>(null);

  // Focus trigger for cells
  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    // Auto-focus input on mount
    setTimeout(() => {
      focusInput();
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { token, user } = await verifyOTP(phone, otp);
      if (!token || !user) {
        throw new Error('Verification failed. Please try again.');
      }

      const authenticatedUser = { 
        ...user, 
        role: (user.role || 'customer')
      };
      
      // Store in secure storage and Zustand store
      await useAuthStore.getState().setSession(token, authenticatedUser);

      Toast.show({
        type: 'success',
        text1: '✅ Verified Successfully',
        text2: `Welcome, ${user.fullName || 'Customer'}!`,
      });

      // Navigate to tabs (home)
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err?.message || getErrorMessage(err) || 'Wrong OTP. Please try again.');
      setOtp('');
      focusInput();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (seconds > 0) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      await requestOTP(phone);
      setSeconds(120);
      setOtp('');
      focusInput();
      
      Toast.show({
        type: 'info',
        text1: 'Code Sent',
        text2: 'A new 6-digit OTP has been sent to your device.',
      });
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render the custom OTP cells
  const renderOTPCells = () => {
    const cells = [];
    for (let i = 0; i < 6; i++) {
      const char = otp[i] || '';
      const isCurrent = i === otp.length;
      const cellStyle = [
        styles.cell,
        isFocused && isCurrent && styles.cellActive,
        char ? styles.cellFilled : null,
        errorMsg ? styles.cellError : null
      ];

      cells.push(
        <View key={i} style={cellStyle}>
          <Text style={styles.cellText}>{char}</Text>
          {isFocused && isCurrent && <View style={styles.cursor} />}
        </View>
      );
    }
    return cells;
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
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
            <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
          </LinearGradient>
          <Text style={styles.title}>Enter security code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code to <Text style={styles.highlight}>{maskedPhone || phone}</Text>
            {companyName ? ` for ${companyName}` : ''}.
          </Text>
        </View>

        {/* Card Body */}
        <View style={styles.card}>
          <Pressable style={styles.cellsRow} onPress={focusInput}>
            {renderOTPCells()}
          </Pressable>

          {/* Hidden Actual TextInput */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            keyboardType="numeric"
            maxLength={6}
            value={otp}
            onChangeText={(val) => {
              const cleaned = val.replace(/[^0-9]/g, '');
              setOtp(cleaned);
              if (errorMsg) setErrorMsg('');
              // Auto-submit on reaching 6 digits
              if (cleaned.length === 6) {
                // Short timeout to let the digit render visually first
                setTimeout(() => {
                  setOtp(cleaned);
                }, 50);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

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
              (isLoading || otp.length !== 6) && styles.buttonDisabled,
              pressed && otp.length === 6 && styles.buttonPressed
            ]} 
            onPress={handleVerify}
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient 
                colors={otp.length === 6 ? ['#185FA5', '#0C447C'] : ['#A6C5E3', '#8CB4D9']} 
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Verify & Proceed</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            )}
          </Pressable>

          {/* Timer and Resend */}
          <View style={styles.resendWrapper}>
            {seconds > 0 ? (
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.timerText}>Resend code in {formatTimer(seconds)}</Text>
              </View>
            ) : (
              <Pressable style={styles.resendBtn} onPress={handleResend}>
                <Text style={styles.resendBtnText}>Resend Verification Code</Text>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.securityText}>
          Didn't receive the SMS? Check your network connection or try scanning the invite QR code again.
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
    marginTop: 24,
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
  cell: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(24, 95, 165, 0.15)',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    width: 44
  },
  cellActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cellError: {
    backgroundColor: '#FCEBEB',
    borderColor: colors.error
  },
  cellFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(24, 95, 165, 0.3)'
  },
  cellText: {
    color: '#1A1A18',
    fontSize: 22,
    fontWeight: '700'
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  container: { 
    backgroundColor: '#FFFFFF', 
    flex: 1 
  },
  cursor: {
    backgroundColor: colors.primary,
    borderRadius: 1,
    height: 20,
    position: 'absolute',
    width: 2
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: 'rgba(163, 45, 45, 0.1)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 12
  },
  errorText: {
    color: colors.error,
    flex: 1,
    fontSize: 13,
    fontWeight: '500'
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
  hiddenInput: {
    height: 1,
    left: -100,
    opacity: 0,
    position: 'absolute',
    width: 1
  },
  highlight: {
    color: '#1A1A18',
    fontWeight: '700'
  },
  resendBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  resendBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700'
  },
  resendWrapper: {
    alignItems: 'center',
    marginTop: 20
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
  timerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  timerText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500'
  },
  title: { 
    color: '#1A1A18', 
    fontSize: 26, 
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center'
  }
});
