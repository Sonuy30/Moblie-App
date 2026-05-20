import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { validateInviteToken } from '@/api/auth';
import { router } from 'expo-router';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);

    const token = data.includes('/invite/')
      ? data.split('/invite/')[1]?.split('?')[0]
      : data;

    if (!token) {
      Alert.alert('Invalid QR Code', 'Could not find a valid invite token.');
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    try {
      const result = await validateInviteToken(token);
      router.push({
        pathname: '/(onboarding)/otp',
        params: {
          phone: result.maskedPhone,
          companyName: result.companyName,
          customerId: result.customerId,
          fromInvite: 'true',
        },
      });
    } catch (error) {
      Alert.alert('Invalid QR Code', 'Ask your supplier for a new one.');
      setTimeout(() => setScanned(false), 2000);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.permissionText}>We need camera permission to scan QR codes</Text>
        <Pressable onPress={requestPermission} style={styles.grantBtn}>
          <Text style={styles.grantBtnText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.textBtn} onPress={() => router.push('/(onboarding)/phone')}>
          <Text style={styles.textBtnText}>Or enter phone instead</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanFrame} />
        <Text style={styles.instruction}>Point at QR code from your supplier</Text>
      </View>
      <Pressable style={styles.fallback} onPress={() => router.push('/(onboarding)/phone')}>
        <Text style={styles.fallbackText}>No QR? Enter phone instead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#fff', fontSize: 16 },
  permissionText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  grantBtn: { backgroundColor: '#185FA5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  grantBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  textBtn: { marginTop: 16 },
  textBtnText: { color: '#185FA5', fontWeight: '600', fontSize: 14 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    marginBottom: 40,
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  fallback: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 8,
  },
  fallbackText: { color: '#333', fontWeight: 'bold' },
});
