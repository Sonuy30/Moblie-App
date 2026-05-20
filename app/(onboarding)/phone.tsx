import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { requestOTP } from '@/api/auth';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

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
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter phone number</Text>
      <Text style={styles.subtitle}>We'll send you an OTP to verify</Text>

      <TextInput
        style={styles.input}
        placeholder="10-digit mobile number"
        keyboardType="numeric"
        maxLength={10}
        value={phone}
        onChangeText={setPhone}
      />

      <Pressable 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={onSubmit}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Get OTP'}</Text>
      </Pressable>
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
    fontSize: 18,
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
});
