import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

const { width } = Dimensions.get('window');

export default function HeroBanner() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.badge}>🔥 SHOP NOW</Text>
          <Text style={styles.title}>Premium Quality{'\n'}Products</Text>
          <Text style={styles.subtitle}>
            Discover the best deals on industrial & consumer products
          </Text>
          <View style={styles.offerPill}>
            <Text style={styles.offerText}>Up to 30% OFF on first order</Text>
          </View>
        </View>
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  gradient: {
    padding: spacing['2xl'],
    minHeight: 180,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    lineHeight: 18,
  },
  offerPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  offerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -40,
    top: -40,
  },
  circle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: 40,
    bottom: -30,
  },
});
