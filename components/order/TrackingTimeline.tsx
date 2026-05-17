import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';
import { formatDate, formatTime } from '@/utils/date';

interface TimelineStep {
  label: string;
  date?: string;
  description?: string;
  completed: boolean;
}

interface TrackingTimelineProps {
  status: string;
  trackingNumber?: string;
  courierName?: string;
  placedAt: string;
  updatedAt: string;
}

const getSteps = (status: string, placedAt: string, updatedAt: string): TimelineStep[] => {
  const statusOrder = ['confirmed', 'packed', 'shipped', 'delivered'];
  const currentIdx = statusOrder.indexOf(status);

  return [
    {
      label: 'Order Confirmed',
      date: placedAt,
      completed: currentIdx >= 0,
    },
    {
      label: 'Packed',
      date: currentIdx >= 1 ? updatedAt : undefined,
      completed: currentIdx >= 1,
    },
    {
      label: 'Shipped',
      date: currentIdx >= 2 ? updatedAt : undefined,
      completed: currentIdx >= 2,
    },
    {
      label: 'Delivered',
      date: currentIdx >= 3 ? updatedAt : undefined,
      completed: currentIdx >= 3,
    },
  ];
};

export default function TrackingTimeline({
  status,
  trackingNumber,
  courierName,
  placedAt,
  updatedAt,
}: TrackingTimelineProps) {
  const steps = getSteps(status, placedAt, updatedAt);

  if (status === 'cancelled') {
    return (
      <View style={styles.cancelled}>
        <Ionicons name="close-circle" size={24} color={colors.error} />
        <Text style={styles.cancelledText}>Order Cancelled</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.indicator}>
            <View
              style={[
                styles.dot,
                step.completed ? styles.dotCompleted : styles.dotPending,
              ]}
            >
              {step.completed && (
                <Ionicons name="checkmark" size={12} color={colors.white} />
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  step.completed ? styles.lineCompleted : styles.linePending,
                ]}
              />
            )}
          </View>
          <View style={styles.content}>
            <Text
              style={[
                styles.label,
                step.completed ? styles.labelCompleted : styles.labelPending,
              ]}
            >
              {step.label}
            </Text>
            {step.date && step.completed && (
              <Text style={styles.date}>
                {formatDate(step.date)}, {formatTime(step.date)}
              </Text>
            )}
            {step.label === 'Shipped' && step.completed && trackingNumber && (
              <Text style={styles.tracking}>
                {courierName || 'Courier'} · {trackingNumber}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  step: {
    flexDirection: 'row',
    minHeight: 60,
  },
  indicator: {
    alignItems: 'center',
    width: 32,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCompleted: {
    backgroundColor: colors.success,
  },
  dotPending: {
    backgroundColor: colors.border,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
  linePending: {
    backgroundColor: colors.border,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelCompleted: {
    color: colors.text,
  },
  labelPending: {
    color: colors.textMuted,
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tracking: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  cancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.lg,
    backgroundColor: colors.errorLight,
    borderRadius: 10,
  },
  cancelledText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});
