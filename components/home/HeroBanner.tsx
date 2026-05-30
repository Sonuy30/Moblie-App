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
  container: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  gradient: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    minHeight: 200,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 1,
  },
  liveBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38ef7d',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 1,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56,239,125,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(56,239,125,0.3)',
  },
  certText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38ef7d',
  },
  content: {
    zIndex: 1,
  },
  brandLine: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    lineHeight: 17,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  primaryCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statNumber: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38ef7d',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  circle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    right: -60,
    top: -60,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
    right: 30,
    bottom: -40,
  },
  circle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: 110,
    top: 20,
  },
  beamH: {
    position: 'absolute',
    height: 2,
    width: '60%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    bottom: 28,
    right: 0,
  },
  beamV: {
    position: 'absolute',
    width: 2,
    height: '70%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: 60,
    bottom: 0,
  },
});

