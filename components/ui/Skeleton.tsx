import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, StyleSheet, type ViewStyle } from 'react-native';
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Image Carousel skeleton */}
      <Skeleton width="100%" height={320} radius={0} />

      <View style={{ padding: 16, gap: 16 }}>
        {/* Category & Title */}
        <Skeleton width="30%" height={14} />
        <Skeleton width="90%" height={26} />
        <Skeleton width="50%" height={16} />

        {/* Pricing */}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton width="40%" height={28} />
          <Skeleton width="20%" height={18} />
        </View>

        {/* Stock status badge */}
        <Skeleton width="35%" height={20} radius={4} />

        {/* Variant Selectors */}
        <View style={{ gap: 8, marginTop: 8 }}>
          <Skeleton width="25%" height={14} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton width={60} height={36} radius={8} />
            <Skeleton width={60} height={36} radius={8} />
            <Skeleton width={60} height={36} radius={8} />
            <Skeleton width={60} height={36} radius={8} />
          </View>
        </View>

        {/* Pincode delivery estimator card */}
        <View style={{ padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, gap: 8 }}>
          <Skeleton width="40%" height={14} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Skeleton width="70%" height={40} radius={8} />
            <Skeleton width="25%" height={40} radius={8} />
          </View>
        </View>

        {/* Seller Info Card */}
        <View style={{ padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.lg, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>

        {/* Description section */}
        <View style={{ gap: 8 }}>
          <Skeleton width="40%" height={16} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="100%" height={12} />
          <Skeleton width="80%" height={12} />
        </View>

        {/* Star breakdown rating summary */}
        <View style={{ gap: 8, marginTop: 8 }}>
          <Skeleton width="50%" height={16} />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Skeleton width="30%" height={48} />
            <View style={{ flex: 1, gap: 4 }}>
              <Skeleton width="100%" height={8} radius={4} />
              <Skeleton width="90%" height={8} radius={4} />
              <Skeleton width="80%" height={8} radius={4} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
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
