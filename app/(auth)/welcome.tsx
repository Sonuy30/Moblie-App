import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

const { width, height } = Dimensions.get('window');
const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

const slides = [
  {
    id: '1',
    icon: 'cube-outline' as const,
    title: 'Premium Steel Products',
    desc: 'Browse TMT bars, MS angles, GI pipes, channels, sheets and more — all at factory-direct B2B prices.',
    color: '#E6F1FB',
    iconColor: colors.primary,
  },
  {
    id: '2',
    icon: 'pricetags-outline' as const,
    title: 'Wholesale Pricing',
    desc: 'Exclusive business prices, bulk order discounts up to 10%, and direct mill-rate offers on every order.',
    color: '#EAF3DE',
    iconColor: '#3B6D11',
  },
  {
    id: '3',
    icon: 'cube-sharp' as const,
    title: 'Track Every Order',
    desc: 'Real-time order status from warehouse dispatch to your doorstep delivery — always know where your steel is.',
    color: '#FAEEDA',
    iconColor: '#854F0B',
  },
  {
    id: '4',
    icon: 'shield-checkmark-outline' as const,
    title: 'ISI Certified Quality',
    desc: 'Every product meets BIS standards. Backed by 25+ years of trusted quality assurance.',

    color: '#F3E8FB',
    iconColor: '#6B3FA0',
  },
];

export default function WelcomeScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isLast = activeIndex === slides.length - 1;

  const animateProgress = (index: number) => {
    Animated.timing(progressAnim, {
      toValue: (index + 1) / slides.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const goNext = () => {
    if (isLast) {
      router.replace('/(auth)/register');
      return;
    }
    const next = activeIndex + 1;
    flatListRef.current?.scrollToIndex({ index: next, animated: true });
    setActiveIndex(next);
    animateProgress(next);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Bar: Logo + Skip */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <View style={styles.miniLogo}>
            <Ionicons name="cube" size={20} color={colors.primary} />
          </View>
          <Text style={styles.logoText}>{companyName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['25%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
          animateProgress(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={72} color={item.iconColor} />
            </View>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideDesc}>{item.desc}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity activeOpacity={0.85} onPress={goNext} style={styles.nextBtnWrapper}>
          <LinearGradient
            colors={['#185FA5', '#0C447C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
            <Ionicons name={isLast ? 'checkmark-circle-outline' : 'arrow-forward'} size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {isLast && (
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Text style={styles.loginLinkBold}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 56,
    paddingBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  skipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 32,
  },
  slideDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.border,
  },
  buttons: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    gap: 14,
  },
  nextBtnWrapper: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  nextBtn: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loginLinkBold: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '800',
  },
});
