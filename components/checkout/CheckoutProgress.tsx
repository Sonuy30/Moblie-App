import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/config';

interface CheckoutProgressProps {
  currentStep: number; // 1, 2, 3, or 4
}

const STEPS = [
  { id: 1, label: 'Address' },
  { id: 2, label: 'Delivery' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Summary' },
];

export default function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <View style={styles.container}>
      {/* Dots and lines */}
      <View style={styles.row}>
        {STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <View
              style={[
                styles.dot,
                currentStep >= step.id && styles.dotActive,
                currentStep === step.id && styles.dotCurrent,
              ]}
            >
              <Text
                style={[
                  styles.number,
                  currentStep >= step.id && styles.numberActive,
                ]}
              >
                {step.id}
              </Text>
            </View>
            {idx < STEPS.length - 1 && (
              <View
                style={[
                  styles.line,
                  currentStep > step.id && styles.lineActive,
                ]}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Labels */}
      <View style={styles.labelsRow}>
        {STEPS.map((step) => (
          <Text
            key={step.id}
            style={[
              styles.label,
              currentStep >= step.id && styles.labelActive,
              currentStep === step.id && styles.labelCurrent,
            ]}
          >
            {step.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  dot: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    width: 64,
  },
  labelActive: {
    color: colors.primary,
  },
  labelCurrent: {
    fontWeight: '700',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: spacing.sm,
  },
  line: {
    backgroundColor: colors.border,
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  lineActive: {
    backgroundColor: colors.primary,
  },
  number: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  numberActive: {
    color: colors.white,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
});
