import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  TouchableWithoutFeedback,
  Keyboard,
  InteractionManager,
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
import { borderRadius } from '@/constants/config';

export default function OTPScreen() {
  const { phone, devOtp } = useLocalSearchParams<{ phone: string; devOtp?: string }>();

  const [otp, setOtp] = useState('');
  const [shownOtp, setShownOtp] = useState(devOtp || ''); // OTP shown from server in dev mode
  const [seconds, setSeconds] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');


  const inputRef = useRef<TextInput>(null);

  // Robust focus: wait for any running interactions to finish, then focus
  // This fixes Android bug where .focus() is ignored right after keyboard dismiss
  const focusInput = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    });
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(focusInput, 400);
    return () => clearTimeout(timer);
  }, [focusInput]);

  // Re-focus whenever keyboard hides unexpectedly (e.g. back button on Android)
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      // Only re-focus if user hasn't intentionally moved away
      if (isFocused) {
        setIsFocused(false); // reset so tapping cells re-shows keyboard
      }
    });
    return () => sub.remove();
  }, [isFocused]);

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
      if ((status as string) !== 'granted') return;
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
      const { authToken, user } = await verifyRegisterOTP(phone, otp);

      if (!user) throw new Error('Verification failed. Please try again.');

      const authenticatedUser = {
        ...user,
        _id: user._id || '',
        fullName: user.fullName || '',
        phone: user.phone || phone,
        role: (user.role || 'customer'),
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
      void setupPushNotifications();

      // Check pending action from authModalStore
      const pendingAction = useAuthModalStore.getState().pendingAction;
      const pendingData = useAuthModalStore.getState().pendingData;

      if (pendingAction === 'cart' && pendingData) {
        useCartStore.getState().addItem(pendingData as any);
      }

      useAuthModalStore.getState().hide();

      if (pendingAction === 'checkout') {
        if (pendingData) {
          useCartStore.getState().addItem(pendingData as any);
        }
        router.replace('/checkout');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      setErrorMsg((err as Error)?.message || getErrorMessage(err) || 'Wrong OTP. Please try again.');
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
    // Don't clear shownOtp yet — keep old one visible until new one arrives

    try {
      const result = await resendRegisterOTP(phone);
      // Update displayed OTP (mock always returns devOtp; real SMS doesn't)
      const newOtp = (result as { devOtp?: string }).devOtp;
      if (newOtp) setShownOtp(newOtp);
      setSeconds(60);
      setOtp('');
      focusInput();

      Toast.show({
        type: 'info',
        text1: 'New OTP Sent',
        text2: newOtp
          ? `Your new OTP is shown in the blue box above.`
          : 'A new 6-digit OTP code has been sent.',
        position: 'bottom',
      });
    } catch (err) {
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
      {/* TouchableWithoutFeedback: tapping anywhere re-shows keyboard if dismissed */}
      <TouchableWithoutFeedback onPress={focusInput} accessible={false}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
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
            Enter the 6-digit code sent to{' '}
            <Text style={styles.highlight}>+91 {phone}</Text>
          </Text>
        </View>

        {/* OTP Display Box — always visible since SMS is not live */}
        <View style={styles.devOtpBox}>
          <Ionicons name="information-circle" size={20} color="#0C447C" />
          <View style={{ flex: 1 }}>
            <Text style={styles.devOtpLabel}>
              {shownOtp ? 'Your OTP Code' : 'Your OTP Code (Demo Mode)'}
            </Text>
            <Text style={styles.devOtpCode}>{shownOtp || '123456'}</Text>
            <Text style={styles.devOtpNote}>
              {shownOtp
                ? 'SMS not configured. Use this code to verify.'
                : 'Live SMS not configured. Use this code to verify.'}
            </Text>
          </View>
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
            onPress={() => { void handleVerify(); }}
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
              <Pressable style={styles.resendBtn} onPress={() => { void handleResend(); }}>
                <Text style={styles.resendBtnText}>Resend OTP</Text>
                <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.securityText}>
          {"Didn't see the OTP? Check the blue box above or use Resend OTP after the timer ends."}
        </Text>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 24,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.05)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
    width: 44,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
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
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 72,
  },
  title: {
    color: '#1A1A18',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5F5E5A',
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  highlight: {
    color: '#1A1A18',
    fontWeight: '700',
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
    shadowOpacity: 0.04,
    shadowRadius: 20,
  },
  cellsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    width: 40,
  },
  cellActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cellFilled: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(24, 95, 165, 0.3)',
  },
  cellError: {
    backgroundColor: '#FCEBEB',
    borderColor: colors.error,
  },
  cellText: {
    color: '#1A1A18',
    fontSize: 20,
    fontWeight: '700',
  },
  cursor: {
    backgroundColor: colors.primary,
    borderRadius: 1,
    height: 20,
    position: 'absolute',
    width: 2,
  },
  hiddenInput: {
    height: 1,
    left: -100,
    opacity: 0,
    position: 'absolute',
    width: 1,
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
    padding: 12,
  },
  errorText: {
    color: colors.error,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  button: {
    borderRadius: borderRadius.lg,
    height: 56,
    justifyContent: 'center',
    marginTop: 24,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.95,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  gradientBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: '100%',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendWrapper: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  timerText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  resendBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resendBtnText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  securityText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 'auto',
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  // ── Dev Mode OTP Display ─────────────────────────────
  devOtpBox: {
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    borderColor: '#185FA5',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 16,
  },
  devOtpLabel: {
    color: '#0C447C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  devOtpCode: {
    color: '#0C447C',
    fontSize: 36,
    fontWeight: '900',
    includeFontPadding: false,
    letterSpacing: 6,
    marginBottom: 4,
  },
  devOtpNote: {
    color: '#185FA5',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
});
