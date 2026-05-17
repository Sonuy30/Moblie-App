import React, { useState, useRef } from 'react';
import { View, Text, FlatList, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const { width, height } = Dimensions.get('window');

const slides = [
  { id: '1', icon: 'grid-outline' as const, title: 'Discover Our Products', desc: 'Browse through our wide range of premium quality products' },
  { id: '2', icon: 'card-outline' as const, title: 'Fast & Secure Checkout', desc: 'Pay safely with multiple payment options available' },
  { id: '3', icon: 'cube-outline' as const, title: 'Track Every Order', desc: 'Real-time order tracking from confirmation to delivery' },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isLast = activeIndex === slides.length - 1;

  const goNext = () => {
    if (isLast) { router.replace('/(auth)/register'); return; }
    flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={64} color={colors.primary} />
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.desc}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.activeDot]} />
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
        {isLast && (
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>I have an account</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { position: 'absolute', top: 56, right: 20, zIndex: 10 },
  skipText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '500' },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8,
  },
  slideTitle: { fontSize: 28, fontWeight: '800', color: colors.white, textAlign: 'center', marginBottom: 12 },
  slideDesc: { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  activeDot: { backgroundColor: colors.white, width: 24 },
  buttons: { paddingHorizontal: 24, paddingBottom: 48, gap: 16 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, paddingVertical: 16, borderRadius: borderRadius.lg, gap: 8,
  },
  nextText: { fontSize: 17, fontWeight: '700', color: colors.primary },
  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '500' },
});
