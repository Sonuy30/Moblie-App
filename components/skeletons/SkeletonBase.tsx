import React, { useEffect, useRef, useState } from 'react';
import { Animated, type ViewStyle, AccessibilityInfo } from 'react-native';

interface SkeletonBaseProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function SkeletonBase({ width = '100%', height = 20, radius = 4, style }: SkeletonBaseProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    let isMounted = true;
    
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (isMounted) {
          setReduceMotion(enabled);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(0.65);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: '#E0E0E0',
          borderRadius: radius,
          height,
          opacity,
          width: width as any,
        },
        style,
      ]}
    />
  );
}

export function SkeletonRect({ width = '100%', height = 20, radius = 4, style }: SkeletonBaseProps) {
  return <SkeletonBase width={width} height={height} radius={radius} style={style} />;
}

export function SkeletonCircle({ size = 40, style }: { size?: number; style?: ViewStyle }) {
  return <SkeletonBase width={size} height={size} radius={size / 2} style={style} />;
}
