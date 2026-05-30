import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

export default function SplashScreen() {
  const { isLoading, restoreSession } = useAuthStore();

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.3)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    restoreSession();

    // Sequence: ring expands → logo fades in → text fades in → tagline
    Animated.sequence([
      // Ring pulse
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.3,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      // Logo appears
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Company name
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Tagline
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Add a small delay so the animation plays before navigating
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2200);
    }
  }, [isLoading]);

  return (
    <LinearGradient
      colors={['#0d2744', '#185FA5', '#1e7fcb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background decorative rings */}
      <View style={styles.bgRing1} />
      <View style={styles.bgRing2} />

      {/* Pulse ring animation */}
      <Animated.View
        style={[
          styles.pulseRing,
          { transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />

      {/* Logo Container */}
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <View style={styles.logoInner}>
          <Ionicons name="cube" size={56} color="#185FA5" />
        </View>
        <View style={styles.logoShine} />
      </Animated.View>

      {/* Company Name */}
      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.companyName}>{companyName}</Text>
        <View style={styles.pvtBadge}>
          <Text style={styles.pvtText}>PRIVATE LIMITED</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your Trusted B2B Steel Partner
      </Animated.Text>

      {/* Bottom strip */}
      <View style={styles.bottomStrip}>
        <View style={styles.stripDot} />
        <View style={[styles.stripDot, styles.stripDotActive]} />
        <View style={styles.stripDot} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgRing1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -100,
  },
  bgRing2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -80,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  logoInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  companyName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  pvtBadge: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pvtText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 3,
  },
  tagline: {
    marginTop: 16,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  bottomStrip: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  stripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  stripDotActive: {
    width: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 3,
  },
});
