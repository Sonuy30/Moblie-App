/**
 * hooks/usePushNotifications.ts
 *
 * Composable hook that wraps the notification service for use inside
 * React components / the root layout.
 *
 * Responsibilities:
 *  • Calls registerForPushNotifications() and stores the token in authStore
 *  • Returns stable callbacks (useCallback) for the root _layout.tsx to wire
 *    up addNotificationReceivedListener / addNotificationResponseReceivedListener
 *  • Respects per-category preferences from notificationStore
 *
 * Usage (in app/_layout.tsx):
 *  const { setup, setupHandlers } = usePushNotifications();
 *  useEffect(() => { if (isAuthenticated) { void setup(); } }, [isAuthenticated]);
 *  useEffect(() => { const unsub = setupHandlers(); return unsub; }, [setupHandlers]);
 */

import { useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import {
  registerForPushNotifications,
  handleNotificationReceived,
  handleNotificationResponse,
  type NotificationPayloadType,
} from '@/services/notifications';

// ── Hook ──────────────────────────────────────────────────────────────────────

export const usePushNotifications = () => {
  const updatePushToken    = useAuthStore(s => s.updatePushToken);
  const isCategoryEnabled  = useNotificationStore(s => s.isCategoryEnabled);

  // ── Register & obtain push token ────────────────────────────────────────
  /**
   * Call once, after the user is authenticated.
   * Requests OS permission, gets the Expo push token, updates authStore,
   * and saves the token to the backend.
   */
  const setup = useCallback(async (): Promise<void> => {
    try {
      await registerForPushNotifications((token) => {
        updatePushToken(token);
      });
    } catch (e) {
      console.warn('[usePushNotifications] setup failed:', e);
    }
  }, [updatePushToken]);

  // ── Wire up notification listeners ──────────────────────────────────────
  /**
   * Adds two listeners:
   *  1. Foreground — when a notification arrives while app is open
   *  2. Response   — when the user taps a notification
   *
   * Returns an unsubscribe function for useEffect cleanup.
   */
  const setupHandlers = useCallback((): (() => void) => {
    const categoryCheck = (type: NotificationPayloadType): boolean =>
      isCategoryEnabled(type);

    // Foreground handler
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => {
        handleNotificationReceived(notification, categoryCheck);
      }
    );

    // Tap / response handler
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response, categoryCheck);
      }
    );

    // Return cleanup function
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isCategoryEnabled]);

  return { setup, setupHandlers };
};
