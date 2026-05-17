import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function OrderSuccessScreen() {
  const { orderNumber, orderId } = useLocalSearchParams<{ orderNumber: string; orderId: string }>();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={64} color={colors.white} />
        </Animated.View>

        <Animated.View style={{ opacity, alignItems: 'center' }}>
          <Text style={styles.title}>Order Placed! 🎉</Text>
          {orderNumber && <Text style={styles.orderNum}>Order: {orderNumber}</Text>}
          <Text style={styles.subtitle}>Thank you for your purchase</Text>
          <Text style={styles.delivery}>Estimated delivery: 3–5 business days</Text>
        </Animated.View>

        <View style={styles.buttons}>
          <Button title="Track Order" onPress={() => router.replace(`/order/${orderId}` as any)} fullWidth />
          <Button title="Continue Shopping" onPress={() => router.replace('/(tabs)')} variant="outline" fullWidth />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing['3xl'], gap: spacing['3xl'] },
  checkCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  orderNum: { fontSize: 16, fontWeight: '600', color: colors.primary, marginTop: 8, backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: borderRadius.full },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 8 },
  delivery: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  buttons: { width: '100%', gap: spacing.md },
});
