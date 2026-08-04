/**
 * utils/sentry.ts — Safe Crash Reporting Stub
 *
 * Provides a clean interface for crash reporting without requiring
 * native Sentry CLI hooks during Gradle builds when Sentry DSN / token is unset.
 */

export interface SentryUserContext {
  id: string;
  phone: string;
  companyId: string;
  role: string;
}

export function initialiseSentry(): void {
  if (__DEV__) {
    console.info('[Sentry Stub] Crash reporting initialised (local stub mode)');
  }
}

export function setSentryUser(user: SentryUserContext): void {
  if (__DEV__) {
    console.info('[Sentry Stub] User set:', user.id);
  }
}

export function clearSentryUser(): void {
  if (__DEV__) {
    console.info('[Sentry Stub] User cleared');
  }
}

export function captureException(
  err: unknown,
  context?: Record<string, string>
): void {
  console.error('[Sentry Captured Exception]', err, context);
}

export function captureMessage(
  message: string,
  level: string = 'info'
): void {
  console.log(`[Sentry Captured Message - ${level}]`, message);
}

export const withSentryErrorBoundary = (component: any) => component;
