/**
 * services/notifications.ts — AITS Shop Notification Service
 *
 * Single source of truth for all push-notification logic.
 * The hook (hooks/usePushNotifications.ts) composes from here;
 * the _layout.tsx wires up listeners using the returned subscription handles.
 *
 * ── Notification types handled ───────────────────────────────────────────────
 *  ORDER_UPDATE  → navigate to /order/[id]
 *  PRICE_DROP    → navigate to /product/[id]
 *  FLASH_SALE    → navigate to /sale/[id]
 *  PROMO         → navigate to /promo/[id]
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 *  • registerForPushNotifications() is called ONCE after auth (in _layout.tsx)
 *  • handleNotificationReceived()   is the foreground handler (addNotificationReceivedListener)
 *  • handleNotificationResponse()   handles tap-to-open routing  (addNotificationResponseReceivedListener)
 *  • scheduleLocalNotification()    sends a local trigger (no server needed)
 *  • All routing goes through expo-router; never import navigation imperatively
 *    from outside this module.
 *
 * ── Data contract (notification.request.content.data) ────────────────────────
 *  {
 *    type:    NotificationPayloadType  // required
 *    id:      string                   // entity ID (orderId / productId / saleId / promoId)
 *    title?:  string
 *    body?:   string
 *  }
 */

import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { updateProfile } from '@/api/auth';

// ── Notification payload types ────────────────────────────────────────────────

export type NotificationPayloadType =
  | 'ORDER_UPDATE'
  | 'PRICE_DROP'
  | 'FLASH_SALE'
  | 'PROMO';

/** Typed shape of notification.request.content.data */
export interface NotificationPayload {
  type: NotificationPayloadType;
  /** Entity ID: orderId / productId / saleId / promoId */
  id: string;
  title?: string;
  body?: string;
}

// ── Configure foreground notification behaviour ───────────────────────────────
// Called at module-level so it's set before any notification can arrive.
Notifications.setNotificationHandler({
  handleNotification: async () => {
    await Promise.resolve();
    return {
      shouldShowBanner: true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowList:   true,
    };
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Narrow an untyped data blob into a typed NotificationPayload (or null). */
function parsePayload(
  data: Record<string, unknown>
): NotificationPayload | null {
  const type = data.type;
  const id   = data.id ?? data.orderId ?? data.productId ?? data.saleId ?? data.promoId;

  const validTypes: NotificationPayloadType[] = [
    'ORDER_UPDATE',
    'PRICE_DROP',
    'FLASH_SALE',
    'PROMO',
  ];

  if (
    typeof type !== 'string' ||
    !validTypes.includes(type as NotificationPayloadType) ||
    typeof id !== 'string'
  ) {
    return null;
  }

  return {
    type:  type as NotificationPayloadType,
    id,
    title: typeof data.title === 'string' ? data.title : undefined,
    body:  typeof data.body  === 'string' ? data.body  : undefined,
  };
}

/** Map a notification type to its deep-link route. */
function resolveRoute(
  type: NotificationPayloadType,
  id: string
): Parameters<typeof router.push>[0] {
  switch (type) {
    case 'ORDER_UPDATE':
      return `/order/${id}` as const;
    case 'PRICE_DROP':
      return `/product/${id}` as const;
    case 'FLASH_SALE':
      return `/sale/${id}` as const;
    case 'PROMO':
      return `/promo/${id}` as const;
  }
}

// ── Register for push notifications ──────────────────────────────────────────

/**
 * Request permission and obtain the Expo Push Token.
 * Saves the token to the server via updateProfile().
 * Safe to call multiple times — idempotent.
 *
 * @param onTokenReceived  Optional callback with the token string.
 * @returns The Expo push token, or null if permission denied / unavailable.
 */
export async function registerForPushNotifications(
  onTokenReceived?: (token: string) => void
): Promise<string | null> {
  // Android requires an explicit notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#185FA5',
    });

    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100],
      lightColor:       '#185FA5',
    });

    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions & Offers',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if ((existingStatus as string) !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if ((finalStatus as string) !== 'granted') {
    if (__DEV__) {
      console.warn('[Notifications] Permission not granted — push disabled.');
    }
    return null;
  }

  // Expo Go / simulator: use mock token to avoid native push-service crash
  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  let token: string;

  if (isExpoGo || __DEV__) {
    token = 'ExponentPushToken[mock-dev-token-aits-shop]';
    if (__DEV__) {
      console.info('[Notifications] Dev/Expo Go mode — using mock push token.');
    }
  } else {
    const result = await Notifications.getExpoPushTokenAsync({
      projectId: (Constants.expoConfig?.extra as { eas?: { projectId?: string } })?.eas?.projectId,
    });
    token = result.data;
  }

  // Fire optional callback (store update, etc.)
  onTokenReceived?.(token);

  // Persist to backend — best effort
  try {
    await updateProfile({ pushToken: token });
  } catch (e) {
    console.warn('[Notifications] Failed to save push token to backend:', e);
  }

  return token;
}

// ── Foreground notification handler ──────────────────────────────────────────

/**
 * Called when a push notification arrives while the app is foregrounded.
 * Respects per-category preferences passed in from the caller.
 *
 * @param notification        The incoming notification.
 * @param isCategoryEnabled   Function to check per-category prefs.
 */
export function handleNotificationReceived(
  notification: Notifications.Notification,
  isCategoryEnabled: (type: NotificationPayloadType) => boolean
): void {
  const raw  = notification.request.content.data as Record<string, unknown>;
  const payload = parsePayload(raw);

  if (!payload) {
    if (__DEV__) {
      console.warn('[Notifications] Received notification with unknown payload:', raw);
    }
    return;
  }

  // Respect user preference — suppress display if category is muted.
  // NOTE: setNotificationHandler above controls whether the banner shows;
  // here we do any in-app-level business logic (e.g. refresh a query).
  if (!isCategoryEnabled(payload.type)) {
    if (__DEV__) {
      console.info(
        `[Notifications] Category "${payload.type}" is muted — skipping foreground action.`
      );
    }
    return;
  }

  if (__DEV__) {
    console.info('[Notifications] Foreground notification:', payload);
  }
}

// ── Notification tap / response handler ──────────────────────────────────────

/**
 * Called when the user taps a notification (foreground or background).
 * Navigates to the correct screen based on payload type + id.
 *
 * @param response            The notification response object.
 * @param isCategoryEnabled   Function to check per-category prefs.
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse,
  isCategoryEnabled: (type: NotificationPayloadType) => boolean
): void {
  const raw     = response.notification.request.content.data as Record<string, unknown>;
  const payload = parsePayload(raw);

  if (!payload) {
    if (__DEV__) {
      console.warn('[Notifications] Tapped notification has unknown payload:', raw);
    }
    return;
  }

  if (!isCategoryEnabled(payload.type)) {
    // Even if the category is muted, we still navigate — the user explicitly tapped.
    // Muting only suppresses foreground-display, not tapped-navigation.
  }

  const route = resolveRoute(payload.type, payload.id);

  // Small delay — ensures the navigator is mounted before we push
  setTimeout(() => {
    try {
      router.push(route);
    } catch (e) {
      console.warn('[Notifications] Failed to navigate from tap:', e);
    }
  }, 300);
}

// ── Schedule a local notification ─────────────────────────────────────────────

export interface LocalNotificationOptions {
  title:   string;
  body:    string;
  data?:   NotificationPayload;
  /** Delay in seconds before showing. Defaults to 1 s. */
  delaySeconds?: number;
  /** Android channel. Defaults to 'default'. */
  channelId?: string;
}

/**
 * Trigger an immediate (or delayed) local notification — no server required.
 * Useful for order confirmations, countdown reminders, etc.
 *
 * @returns The notification identifier string.
 */
export async function scheduleLocalNotification(
  options: LocalNotificationOptions
): Promise<string> {
  const {
    title,
    body,
    data,
    delaySeconds = 1,
    channelId    = 'default',
  } = options;

  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      // expo-notifications requires Record<string, unknown>; our typed payload is compatible
      data:    (data as Record<string, unknown> | undefined) ?? {},
      sound:   true,
    },
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySeconds,
      channelId,
    },
  });
}

// ── Cancel a specific notification ────────────────────────────────────────────

/** Cancel a previously scheduled local notification by its identifier. */
export async function cancelScheduledNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/** Cancel ALL pending scheduled local notifications. */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Badge management ──────────────────────────────────────────────────────────

/** Set the app icon badge count (iOS). No-op on Android. */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/** Clear the app icon badge (set to 0). */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}
