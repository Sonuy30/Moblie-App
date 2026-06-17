import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';
import { typography } from '@/constants/typography';

interface MissingEnvScreenProps {
  missingVars: string[];
}

export function MissingEnvScreen({ missingVars }: MissingEnvScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.error} />

      {/* Branded gradient header */}
      <LinearGradient
        colors={[colors.error, '#D32F2F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>AS</Text>
        </View>
        <Text style={styles.appName}>Sudama Enterprises</Text>
      </LinearGradient>

      {/* Content card */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Error icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>⚙️</Text>
        </View>

        <Text style={styles.title}>Configuration Error</Text>
        <Text style={styles.subtitle}>
          The application is missing required environment variables to run.
        </Text>

        {/* List of missing variables */}
        <View style={styles.missingBox}>
          <Text style={styles.boxTitle}>⚠️ Missing Variables:</Text>
          {missingVars.map((v) => (
            <View key={v} style={styles.varRow}>
              <Text style={styles.bullet}>✗</Text>
              <Text style={styles.varName}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>How to resolve this:</Text>
          
          <Text style={styles.stepNum}>For Local Development:</Text>
          <Text style={styles.stepText}>
            1. Copy <Text style={styles.bold}>.env.example</Text> to <Text style={styles.bold}>.env.local</Text>{'\n'}
            2. Fill in the missing variables.{'\n'}
            3. Restart the Expo server using:{'\n'}
            <Text style={styles.code}>npx expo start --clear</Text>
          </Text>

          <Text style={styles.stepNum}>For EAS Builds / Standalone APKs:</Text>
          <Text style={styles.stepText}>
            Ensure the missing environment variables are added under the <Text style={styles.bold}>env</Text> block of the corresponding build profile in your <Text style={styles.bold}>eas.json</Text> file, or configured in the Expo Dashboard Secrets.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  logoBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: borderRadius.full,
    borderWidth: 2,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  logoText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appName: {
    ...typography.headingMedium,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: borderRadius.full,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  missingBox: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
  },
  boxTitle: {
    ...typography.bodyMedium,
    color: colors.error,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  varRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bullet: {
    color: colors.error,
    fontWeight: 'bold',
  },
  varName: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.sm,
  },
  instructionsTitle: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '700',
  },
  stepNum: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  stepText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: colors.text,
  },
  code: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    backgroundColor: '#E0E0E0',
    color: colors.black,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
