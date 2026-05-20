import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { verifyOTP } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';

export default function OTPScreen() {
  const { phone, maskedPhone, companyName } = useLocalSearchParams<{ phone: string, maskedPhone: string, companyName: string }>();
  const [otp, setOtp] = useState('');
  const [seconds, setSeconds] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const { token, customer } = await verifyOTP(phone!, otp);
      const userRole = customer.role || 'customer';
      const authenticatedUser = { ...customer, role: userRole };
      
      await useAuthStore.getState().setSession(token, authenticatedUser);

      // Role-based routing
      if (userRole === 'customer') {
        router.replace('/(customer)');
      } else {
        router.replace('/(staff)');
      }
    } catch (err) {
      Alert.alert('Error', 'Wrong OTP. Try again.');
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Code sent to {maskedPhone || phone} for {companyName}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        keyboardType="numeric"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <Pressable 
        style={[styles.button, (isLoading || otp.length !== 6) && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={isLoading || otp.length !== 6}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Verifying...' : 'Verify'}</Text>
      </Pressable>

      <View style={styles.resendContainer}>
        {seconds > 0 ? (
          <Text style={styles.timerText}>Resend in 0:{seconds.toString().padStart(2, '0')}</Text>
        ) : (
          <Pressable onPress={() => {/* Resend logic */}}>
            <Text style={styles.resendText}>Resend OTP</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, marginTop: 40 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#185FA5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resendContainer: { alignItems: 'center', marginTop: 24 },
  timerText: { color: '#666' },
  resendText: { color: '#185FA5', fontWeight: 'bold' },
});
