import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import type { StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface CountdownTimerProps {
  endTime: Date | string;
  onExpire?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function CountdownTimer({ endTime, onExpire, style, textStyle }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const targetTime = new Date(endTime).getTime();
    return Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
  });
  const [pulseAnim] = useState(() => new Animated.Value(1));

  // Parse end date and calculate time left in seconds
  useEffect(() => {
    const targetTime = new Date(endTime).getTime();

    const calculateTimeLeft = () => {
      const diff = targetTime - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    // Use setTimeout 0 to avoid setState synchronously during effect/mount render warnings
    const initialDiff = calculateTimeLeft();
    const handle = setTimeout(() => {
      setTimeLeft(initialDiff);
    }, 0);

    if (initialDiff <= 0) {
      if (onExpire) onExpire();
      clearTimeout(handle);
      return;
    }

    const intervalId = setInterval(() => {
      const nextDiff = calculateTimeLeft();
      setTimeLeft(nextDiff);

      if (nextDiff <= 0) {
        clearInterval(intervalId);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => {
      clearTimeout(handle);
      clearInterval(intervalId);
    };
  }, [endTime, onExpire]);

  const isUnderFiveMins = timeLeft > 0 && timeLeft <= 300;

  // Under 5 minutes: start subtle scale pulse animation
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isUnderFiveMins) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (anim) {
        anim.stop();
      }
    };
  }, [isUnderFiveMins, pulseAnim]);

  // Format HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'Sale Ended';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const hasEnded = timeLeft <= 0;
  const isUnderOneHour = timeLeft > 0 && timeLeft < 3600;

  // Determine text style dynamically based on time left
  const getTimerTextStyle = () => {
    if (hasEnded) return styles.expiredText;
    if (isUnderOneHour) return styles.urgentText;
    return styles.normalText;
  };

  return (
    <Animated.View style={[styles.container, style, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={[styles.timerText, getTimerTextStyle(), textStyle]}>
        {formatTime(timeLeft)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  normalText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  timerText: {
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  urgentText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
});
