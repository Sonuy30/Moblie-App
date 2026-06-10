import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

const { width } = Dimensions.get('window');

const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

export default function HeroBanner() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F2027', '#203A43', '#2C5364']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top Badge */}
        <View style={styles.topRow}>
          <LinearGradient
            colors={['#FF512F', '#DD2476']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.liveBadgeGradient}
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>⚡ MEGA DEAL</Text>
          </LinearGradient>
          <View style={styles.certBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#38ef7d" />
            <Text style={styles.certText}>ISI Certified</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.brandLine}>🌟 {companyName} SUPER VALUE FEST</Text>
          <Text style={styles.title}>Build Securely{'\n'}Save Up To 20%</Text>
          <Text style={styles.subtitle}>
            Direct-from-mill discounts on premium TMT rebars, rust-proof GI pipes, and binding wire combos.
          </Text>

          {/* CTA & Offer Highlights */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={styles.primaryCta}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.85}
            >
              <Ionicons name="cart-outline" size={15} color="#fff" />
              <Text style={styles.primaryCtaText}>Claim Offers</Text>
            </TouchableOpacity>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>Flat 20%</Text>
              <Text style={styles.statLabel}>Instant Off</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={styles.statNumber}>FREE</Text>
              <Text style={styles.statLabel}>Site Shipping</Text>
            </View>
          </View>
        </View>

        {/* Decorative elements */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />

        {/* Steel beam decoration */}
        <View style={styles.beamH} />
        <View style={styles.beamV} />
      </LinearGradient>
    </View>
  );
}


const styles = StyleSheet.create({
  beamH: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 28,
    height: 2,
    position: 'absolute',
    right: 0,
    width: '60%',
  },
  beamV: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 0,
    height: '70%',
    position: 'absolute',
    right: 60,
    width: 2,
  },
  brandLine: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  certBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(56,239,125,0.15)',
    borderColor: 'rgba(56,239,125,0.3)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  certText: {
    color: '#38ef7d',
    fontSize: 9,
    fontWeight: '700',
  },
  circle1: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 110,
    height: 220,
    position: 'absolute',
    right: -60,
    top: -60,
    width: 220,
  },
  circle2: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 65,
    bottom: -40,
    height: 130,
    position: 'absolute',
    right: 30,
    width: 130,
  },
  circle3: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 30,
    height: 60,
    position: 'absolute',
    right: 110,
    top: 20,
    width: 60,
  },
  container: {
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  content: {
    zIndex: 1,
  },

  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  gradient: {
    justifyContent: 'center',
    minHeight: 200,
    overflow: 'hidden',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  liveBadgeGradient: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: {
    backgroundColor: '#38ef7d',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  liveText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  primaryCta: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  primaryCtaText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
  statNumber: {
    color: '#38ef7d',
    fontSize: 13,
    fontWeight: '900',
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 30,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    zIndex: 1,
  },
});

