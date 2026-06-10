import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, type FlatList, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'storefront-outline' as const,
    title: 'Order from\nyour supplier',
    subtitle: 'Browse products from your trusted supplier. Fast ordering, easy delivery.',
    gradient: ['#185FA5', '#0C447C'] as const,
  },
  {
    icon: 'qr-code-outline' as const,
    title: 'Scan & Start\nin seconds',
    subtitle: 'Your supplier gives you a QR code. Scan it once and you\'re ready to order.',
    gradient: ['#2E7D32', '#1B5E20'] as const,
  },
  {
    icon: 'cube-outline' as const,
    title: 'Track your\ndeliveries live',
    subtitle: 'Real-time updates from packing to delivery. Know exactly when your order arrives.',
    gradient: ['#854F0B', '#6D3F09'] as const,
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [scrollX] = useState(() => new Animated.Value(0));

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <LinearGradient colors={item.gradient} style={styles.iconCircle}>
              <Ionicons name={item.icon} size={56} color="#fff" />
            </LinearGradient>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 28, 8],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View
              key={i}
              style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: colors.primary }]}
            />
          );
        })}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.buttonPrimary, pressed && styles.buttonPressed]}
          onPress={() => router.push('/(onboarding)/scan')}
        >
          <LinearGradient colors={['#185FA5', '#0C447C']} style={styles.gradientBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="qr-code-outline" size={20} color="#fff" />
            <Text style={styles.buttonPrimaryText}>Scan QR Code</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.buttonSecondary, pressed && styles.buttonSecondaryPressed]}
          onPress={() => router.push('/(onboarding)/phone')}
        >
          <Ionicons name="call-outline" size={18} color={colors.primary} />
          <Text style={styles.buttonSecondaryText}>Enter Phone Number</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        By continuing, you agree to our Terms & Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    paddingHorizontal: 24,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonPrimary: {
    borderRadius: borderRadius.lg,
    elevation: 6,
    overflow: 'hidden',
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: 'rgba(24, 95, 165, 0.15)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonSecondaryPressed: {
    backgroundColor: 'rgba(24, 95, 165, 0.12)',
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  dot: {
    borderRadius: 4,
    height: 8,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 32,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 40,
    paddingVertical: 20,
    textAlign: 'center',
  },
  gradientBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: 60,
    elevation: 8,
    height: 120,
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#185FA5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    width: 120,
  },
  slide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    width,
  },
  slideSubtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 280,
    textAlign: 'center',
  },
  slideTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: 16,
    textAlign: 'center',
  },
});
