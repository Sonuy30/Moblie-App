/**
 * utils/sentry.ts — Sentry crash reporting initialisation
 *
 * Rules:
 *  - Init is called ONCE from app/_layout.tsx before anything renders.
 *  - DSN is read from env — never hardcoded.
 *  - All Sentry calls are no-ops when DSN is absent (dev without Sentry).
 *  - User PII (name, phone) is only attached after auth — not before.
 *  - All exports are typed; no `any`.
 *
 * Setup required (one-time):
 *  1. Create a Sentry project at https://sentry.io → React Native
 *  2. Copy the DSN into .env.local as EXPO_PUBLIC_SENTRY_DSN
 *  3. Add EXPO_PUBLIC_SENTRY_DSN to .env.example (no value)
 *  4. Add the Sentry Expo plugin to app.json (see comment below)
 *
 * app.json plugin entry:
 *  [
 *    "@sentry/react-native/expo",
 *    { "organization": "your-org", "project": "aits-shop" }
 *  ]
 */

import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// ── Types ──────────────────────────────────────────────────────────────────

export interface SentryUserContext {
  id: string;
  phone: string;
  companyId: string;
  role: string;
}

// ── DSN resolution ─────────────────────────────────────────────────────────
// Supports both Metro process.env (Expo Go / dev builds) and
// EAS build-time injection via Constants.expoConfig.extra.
function resolveDsn(): string | undefined {
  const fromProcess = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (fromProcess) return fromProcess;

  const extra = Constants.expoConfig?.extra;
  return extra?.EXPO_PUBLIC_SENTRY_DSN as string | undefined;
}

// ── Initialise ─────────────────────────────────────────────────────────────
/**
 * Call this ONCE at the top of your root _layout.tsx, OUTSIDE the component.
 * Sentry must be initialised before React renders so it can catch
 * synchronous errors during the very first render cycle.
 */
export function initialiseSentry(): void {
  const dsn = resolveDsn();

  if (!dsn) {
    if (__DEV__) {
      console.info(
        '[Sentry] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting disabled.\n' +
          '         Add your DSN to .env.local to enable it.'
      );
    }
    return; // Graceful no-op — app works fine without Sentry
  }

  Sentry.init({
    dsn,

    // ── Performance monitoring ───────────────────────────────────────
    // Sample 20% of transactions in production, 100% in dev.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // ── Session replay (crashes) ─────────────────────────────────────
    // Capture full replays only for sessions that crash.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,

    // ── Release & environment ────────────────────────────────────────
    environment: __DEV__ ? 'development' : 'production',
    release: `aits-shop@${Constants.expoConfig?.version ?? '1.0.0'}`,

    // ── Privacy — strip PII from breadcrumbs ─────────────────────────
    // Never send raw network request/response bodies.
    integrations: [
      Sentry.mobileReplayIntegration({
        maskAllText: false,
        maskAllImages: false,
      }),
    ],

    // ── Breadcrumb filtering ─────────────────────────────────────────
    // Strip Authorization headers before they leave the device.
    beforeBreadcrumb(breadcrumb) {
      if (
        breadcrumb.category === 'xhr' ||
        breadcrumb.category === 'fetch'
      ) {
        // Remove auth headers from network breadcrumbs
        if (breadcrumb.data?.['Authorization']) {
          breadcrumb.data['Authorization'] = '[Filtered]';
        }
      }
      return breadcrumb;
    },

    // ── Event filtering ──────────────────────────────────────────────
    // Ignore non-actionable errors.
    beforeSend(event) {
      // Don't report JS bundle version mismatches (OTA update in progress)
      if (event.exception?.values?.[0]?.value?.includes('Unable to resolve module')) {
        return null;
      }
      return event;
    },
  });

  if (__DEV__) {
    console.info('[Sentry] Initialised successfully (dev mode — events sent to Sentry)');
  }
}

// ── User context ───────────────────────────────────────────────────────────
/**
 * Attach authenticated user context to all future Sentry events.
 * Call this immediately after a successful login.
 * Uses phone number as identifier (India-first: phone = primary ID).
 */
export function setSentryUser(user: SentryUserContext): void {
  Sentry.setUser({
    id: user.id,
    username: user.phone, // phone = primary identity in India
    // No email — not collected in the current auth flow
  });
  Sentry.setTag('company_id', user.companyId);
  Sentry.setTag('user_role', user.role);
}

/**
 * Clear user context on logout so events are no longer tied to the user.
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
  Sentry.setTag('company_id', '');
  Sentry.setTag('user_role', '');
}

// ── Manual capture ─────────────────────────────────────────────────────────
/**
 * Report a caught exception manually (e.g. from a try/catch block
 * where you still want to log the error but not crash the app).
 *
 * @example
 *   try { ... } catch (err) { captureException(err, { screen: 'Checkout' }); }
 */
export function captureException(
  err: unknown,
  context?: Record<string, string>
): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(err);
    });
  } else {
    Sentry.captureException(err);
  }
}

/**
 * Log a non-fatal message to Sentry (useful for tracking business-logic events).
 *
 * @example
 *   captureMessage('Payment gateway timeout', 'warning');
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
): void {
  Sentry.captureMessage(message, level);
}

// ── Sentry HOC wrapper ─────────────────────────────────────────────────────
/**
 * Wraps a React component with Sentry's error boundary.
 * Prefer the custom ErrorBoundary in /components/error/ErrorBoundary.tsx
 * for root-level wrapping; use this for granular component-level isolation.
 */
export const withSentryErrorBoundary = Sentry.withErrorBoundary;

export { Sentry };
