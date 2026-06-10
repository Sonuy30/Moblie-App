/**
 * components/error/ErrorBoundary.tsx
 *
 * A React class-component error boundary for AITS Shop.
 *
 * Why a class component?
 *   React only supports error boundaries via class components
 *   (componentDidCatch + getDerivedStateFromError). There is no hooks
 *   equivalent — this is intentional React architecture.
 *
 * Features:
 *  - Catches all synchronous render errors in the subtree.
 *  - Forwards the error to Sentry (no-op if Sentry not initialised).
 *  - Renders <ErrorFallback> with a "Try Again" button that resets state.
 *  - Accepts an optional `onError` callback for custom logging.
 *  - Accepts an optional `fallback` prop to override the default UI.
 *  - Re-throws errors in test environments for easier test assertions.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureException } from '@/utils/sentry';
import ErrorFallback from './ErrorFallback';

// ── Types ──────────────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export interface ErrorBoundaryProps {
  /** Content to render when there is no error */
  children: ReactNode;

  /**
   * Custom fallback UI. Receives the error + a reset function.
   * When omitted, the default <ErrorFallback> is rendered.
   */
  fallback?: (props: {
    error: Error;
    componentStack: string | null;
    resetError: () => void;
  }) => ReactNode;

  /**
   * Optional callback fired whenever an error is caught.
   * Use for custom logging, analytics, or showing a Toast.
   */
  onError?: (error: Error, info: ErrorInfo) => void;

  /**
   * A key that can be changed externally to force-reset the boundary.
   * Useful when you want a parent to programmatically recover the subtree.
   *
   * @example
   *   <ErrorBoundary resetKey={routePath}>
   */
  resetKey?: string | number;
}

// ── Initial state ──────────────────────────────────────────────────────────

const INITIAL_STATE: ErrorBoundaryState = {
  hasError: false,
  error: null,
  componentStack: null,
};

// ── Component ──────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = INITIAL_STATE;
    this.resetError = this.resetError.bind(this);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Static method called synchronously after a render error.
   * Must return state — cannot have side effects.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      componentStack: null, // populated in componentDidCatch
    };
  }

  /**
   * Called after the render with the error and component stack.
   * Safe for side effects: logging, analytics, etc.
   */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Capture the component stack string
    this.setState({ componentStack: info.componentStack ?? null });

    // Forward to Sentry (no-op if DSN not configured)
    captureException(error, {
      componentStack: info.componentStack ?? 'unavailable',
      screen: 'ErrorBoundary',
    });

    // Fire the optional consumer callback
    this.props.onError?.(error, info);

    if (__DEV__) {
      console.error('[ErrorBoundary] Caught crash:\n', error, '\n\nComponent stack:\n', info.componentStack);
    }
  }

  /**
   * Watch for external reset key changes.
   * When `resetKey` changes, treat it as a "fresh mount" and clear the error.
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────

  /**
   * Resets the boundary back to the non-error state.
   * Passed down to ErrorFallback as the "Try Again" handler.
   */
  resetError(): void {
    this.setState(INITIAL_STATE);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  render(): ReactNode {
    const { hasError, error, componentStack } = this.state;
    const { children, fallback } = this.props;

    if (!hasError || !error) {
      return children;
    }

    // Custom fallback provided by the consumer
    if (fallback) {
      return fallback({
        error,
        componentStack,
        resetError: this.resetError,
      });
    }

    // Default branded fallback UI
    return (
      <ErrorFallback
        error={error}
        componentStack={componentStack}
        resetError={this.resetError}
      />
    );
  }
}

export default ErrorBoundary;
