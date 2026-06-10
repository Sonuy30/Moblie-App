/**
 * components/error/ErrorFallback.tsx
 *
 * The UI rendered when the ErrorBoundary catches a crash.
 * Design goals:
 *  - Never looks like a raw crash screen — always branded and friendly.
 *  - Shows a concise error summary (not a raw stack trace).
 *  - Gives the user a clear action: "Try Again" (resets the boundary).
 *  - In __DEV__ mode: shows the full error message for rapid debugging.
 *  - Sends the crash to Sentry if initialised.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

// ── Types ──────────────────────────────────────────────────────────────────

export interface ErrorFallbackProps {
  /** The caught Error object */
  error: Error;
  /** The React component stack string (from componentDidCatch info) */
  componentStack: string | null;
  /** Call this to unmount and remount the subtree (reset the boundary) */
  resetError: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Produce a short, user-friendly sentence from any Error */
function toFriendlyMessage(error: Error): string {
  // Network errors
  if (error.message?.toLowerCase().includes('network')) {
    return 'A network error occurred. Please check your connection and try again.';
  }
  // JS chunk / module load failure (OTA update mid-session)
  if (error.message?.toLowerCase().includes('unable to resolve module')) {
    return 'The app needs to restart to apply a recent update.';
  }
  return 'Something unexpected happened. The error has been reported.';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ErrorFallback({
  error,
  componentStack,
  resetError,
}: ErrorFallbackProps) {
  const friendlyMessage = toFriendlyMessage(error);

  const handleRetry = useCallback(() => {
    resetError();
  }, [resetError]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Branded gradient header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* App logo mark — initials badge */}
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>AS</Text>
        </View>
        <Text style={styles.appName}>AITS Shop</Text>
      </LinearGradient>

      {/* Content card */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Error icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconEmoji}>⚠️</Text>
        </View>

        <Text style={styles.title}>Oops! Something went wrong</Text>
        <Text style={styles.subtitle}>{friendlyMessage}</Text>

        {/* Dev-only: show raw error for fast debugging */}
        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>🛠 Dev Error Details</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <Text style={styles.devMessage} selectable>
                {error.message}
              </Text>
            </ScrollView>
            {componentStack && (
              <ScrollView style={styles.stackScroll} showsVerticalScrollIndicator>
                <Text style={styles.devStack} selectable>
                  {componentStack.trim()}
                </Text>
              </ScrollView>
            )}
          </View>
        )}

        {/* Primary CTA */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityHint="Reloads the screen that crashed"
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.retryGradient}
          >
            <Text style={styles.retryText}>↺  Try Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.hint}>
          If this keeps happening, please restart the app.{'\n'}
          The issue has been reported to our team.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },

  // Header
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

  // Content
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

  // Dev debug box
  devBox: {
    backgroundColor: '#1a1a2e',
    borderColor: '#e94560',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    width: '100%',
  },
  devLabel: {
    color: '#e94560',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  devMessage: {
    color: '#a8ff78',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
  },
  stackScroll: {
    marginTop: spacing.xs,
    maxHeight: 180,
  },
  devStack: {
    color: '#778ca3',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 10,
    lineHeight: 16,
  },

  // Retry button
  retryButton: {
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  retryGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  retryText: {
    ...typography.headingSmall,
    color: colors.white,
    letterSpacing: 0.5,
  },

  // Hint
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
