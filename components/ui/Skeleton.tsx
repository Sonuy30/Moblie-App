import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

interface SkeletonProps {
  width: number | string;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width, height, radius = borderRadius.md, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: colors.shimmer,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Pre-built skeleton layouts
export function ProductCardSkeleton() {
  return (
    <View style={skeletonStyles.productCard}>
      <Skeleton width="100%" height={160} radius={borderRadius.md} />
      <View style={{ padding: 12, gap: 8 }}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="50%" height={16} />
        <Skeleton width="30%" height={12} />
      </View>
    </View>
  );
}

export function ProductDetailSkeleton() {
  return (
    <View style={{ gap: 16, padding: 16 }}>
      <Skeleton width="100%" height={300} radius={borderRadius.lg} />
      <Skeleton width="40%" height={14} />
      <Skeleton width="90%" height={22} />
      <Skeleton width="60%" height={20} />
      <Skeleton width="100%" height={48} radius={borderRadius.md} />
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  productCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    width: '100%',
  },
});
