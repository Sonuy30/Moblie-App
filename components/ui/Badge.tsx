import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantColors = {
  primary: { bg: colors.primaryLight, text: colors.primary },
  success: { bg: colors.successLight, text: colors.success },
  warning: { bg: colors.warningLight, text: colors.warning },
  error: { bg: colors.errorLight, text: colors.error },
  neutral: { bg: colors.surface, text: colors.textSecondary },
};

export default function Badge({ text, variant = 'primary', size = 'sm', style }: BadgeProps) {
  const c = variantColors[variant];

  return (
    <View style={[styles.base, { backgroundColor: c.bg }, size === 'md' && styles.md, style]}>
      <Text style={[styles.text, { color: c.text }, size === 'md' && styles.textMd]}>
        {text}
      </Text>
    </View>
  );
}

// Small dot badge for tab bar
export function DotBadge({ count, style }: { count: number; style?: ViewStyle }) {
  if (count <= 0) return null;
  return (
    <View style={[styles.dot, style]}>
      <Text style={styles.dotText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textMd: {
    fontSize: 12,
  },
  dot: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 999,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
