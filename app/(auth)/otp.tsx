import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import { verifyRegisterOTP, resendRegisterOTP, updateProfile } from '@/api/auth';
import { getErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/authStore';
import { useAuthModalStore } from '@/stores/authModalStore';
import { useCartStore } from '@/stores/cartStore';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(60); // Exact 60 seconds countdown as specified
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const inputRef = useRef<TextInput>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    setTimeout(() => {
      focusInput();
    }, 300);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const setupPushNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await updateProfile({ pushToken: token });
    } catch (e) {
      console.warn('Error setting up push notifications:', e);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { authToken, user } = await verifyRegisterOTP(phone!, otp);

      if (!user) throw new Error('Verification failed. Please try again.');

      const authenticatedUser = {
        ...user,
        _id: user._id || '',
        fullName: user.fullName || '',
        phone: user.phone || phone!,
        role: (user.role || 'customer') as 'customer' | 'delivery_staff' | 'warehouse_staff' | 'admin',
        companyId: user.companyId || '',
        companyName: user.companyName || '',
      };

      // Save user session in Zustand & SecureStore
      await useAuthStore.getState().setSession(authToken, authenticatedUser);

      Toast.show({
        type: 'success',
        text1: '✅ Registration Successful',
        text2: `Welcome, ${user.fullName || 'Customer'}! Your account is ready.`,
        position: 'bottom',
      });


      // Setup push notifications
      setupPushNotifications();

      // Check pending action from authModalStore
      const pendingAction = useAuthModalStore.getState().pendingAction;
      const pendingData = useAuthModalStore.getState().pendingData;

      if (pendingAction === 'cart' && pendingData) {
        useCartStore.getState().addItem(pendingData);
      }

      useAuthModalStore.getState().hide();

      if (pendingAction === 'checkout') {
        if (pendingData) {
          useCartStore.getState().addItem(pendingData);
        }
        router.replace('/checkout');
      } else {
        router.replace('/(tabs)');
      }
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
      await resendRegisterOTP(phone!);
      setSeconds(60);
      setOtp('');
      focusInput();

      Toast.show({
        type: 'info',
        text1: 'OTP Sent',
        text2: 'A new 6-digit OTP code has been sent to your phone number.',
        position: 'bottom',
      });
    } catch (err: any) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const renderOTPCells = () => {
    const cells = [];
    for (let i = 0; i < 6; i++) {
      const char = otp[i] || '';
      const isCurrent = i === otp.length;
      const cellStyle = [
        styles.cell,
        isFocused && isCurrent && styles.cellActive,
        char ? styles.cellFilled : null,
        errorMsg ? styles.cellError : null,
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
    const s = secs % 60;
    return `0:${s.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Back navigation */}
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.header}>
          <LinearGradient colors={['#E6F1FB', '#FFFFFF']} style={styles.badgeGradient}>
            <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
          </LinearGradient>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit security code sent to <Text style={styles.highlight}>+91 {phone}</Text>
          </Text>
        </View>

        {/* Input Card Container */}
        <View style={styles.card}>
          <Pressable style={styles.cellsRow} onPress={focusInput}>
            {renderOTPCells()}
          </Pressable>

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
              if (cleaned.length === 6) {
                // Short delay to allow final visual render before submit
                setTimeout(() => {
                  setOtp(cleaned);
                }, 50);
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />

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
              pressed && otp.length === 6 && styles.buttonPressed,
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
                <Text style={styles.buttonText}>Confirm & Verify</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              </LinearGradient>
            )}
          </Pressable>

          {/* Countdown & Resend Option */}
          <View style={styles.resendWrapper}>
            {seconds > 0 ? (
              <View style={styles.timerRow}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={styles.timerText}>Resend code in {formatTimer(seconds)}</Text>
              </View>
            ) : (
              <Pressable style={styles.resendBtn} onPress={handleResend}>
                <Text style={styles.resendBtnText}>Resend OTP</Text>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.securityText}>
          Didn't receive the SMS? Check your network coverage and verify that the mobile number provided is correct.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    justifyContent: 'space-between',
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
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A18',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#5F5E5A',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  highlight: {
    fontWeight: '700',
    color: '#1A1A18',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.xl,
    padding: 20,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(24, 95, 165, 0.05)',
    marginBottom: 40,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cell: {
    width: 40,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(24, 95, 165, 0.15)',
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cellActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cellFilled: {
    borderColor: 'rgba(24, 95, 165, 0.3)',
    backgroundColor: '#FFFFFF',
  },
  cellError: {
    borderColor: colors.error,
    backgroundColor: '#FCEBEB',
  },
  cellText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A18',
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    left: -100,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: borderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(163, 45, 45, 0.1)',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: '600',
  },
  button: {
    height: 56,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: 24,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.95,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  securityText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 'auto',
    paddingHorizontal: 20,
  },
});
