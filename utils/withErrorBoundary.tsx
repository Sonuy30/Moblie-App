/**
 * utils/withErrorBoundary.tsx
 *
 * Higher-Order Component (HOC) that wraps any screen or component
 * with an ErrorBoundary, isolating crashes to that subtree.
 *
 * Usage — wrap an individual screen:
 *
 *   // app/(tabs)/index.tsx
 *   import { withErrorBoundary } from '@/utils/withErrorBoundary';
 *   export default withErrorBoundary(HomeScreen);
 *
 *   // With options:
 *   export default withErrorBoundary(HomeScreen, {
 *     onError: (err) => captureException(err, { screen: 'Home' }),
 *   });
 *
 * Why use this instead of wrapping every screen manually?
 *  - DRY: one call vs. 3 lines of JSX every time.
 *  - Consistent: every wrapped screen gets the same fallback UI.
 *  - Flexible: pass options to override fallback or add logging.
 *  - The displayName is set correctly so React DevTools shows the right name.
 */

import React, { type ComponentType, type ErrorInfo } from 'react';
import { ErrorBoundary, type ErrorBoundaryProps } from '@/components/error/ErrorBoundary';

// ── Types ──────────────────────────────────────────────────────────────────

/** Options accepted by the HOC (subset of ErrorBoundaryProps, no `children`) */
export type WithErrorBoundaryOptions = Omit<ErrorBoundaryProps, 'children'>;

// ── HOC ────────────────────────────────────────────────────────────────────

/**
 * Wraps `WrappedComponent` in an ErrorBoundary.
 *
 * @param WrappedComponent - Any React component (screen, section, etc.)
 * @param options          - Optional ErrorBoundary configuration
 * @returns A new component with the same props, crash-protected
 *
 * @template P - Props of the wrapped component
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): ComponentType<P> {
  const { fallback, onError, resetKey } = options;

  // Default onError: always log in dev — consumers can add their own on top
  const defaultOnError = (error: Error, info: ErrorInfo): void => {
    if (__DEV__) {
      console.error(
        `[withErrorBoundary] Crash in <${WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component'}>\n`,
        error,
        info.componentStack
      );
    }
    // Fire the consumer-supplied callback if provided
    onError?.(error, info);
  };

  function WithErrorBoundaryWrapper(props: P): React.ReactElement {
    return (
      <ErrorBoundary
        fallback={fallback}
        onError={defaultOnError}
        resetKey={resetKey}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  // Preserve the display name for React DevTools + error stack traces
  const wrappedName =
    WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';
  WithErrorBoundaryWrapper.displayName = `withErrorBoundary(${wrappedName})`;

  return WithErrorBoundaryWrapper;
}

export default withErrorBoundary;
