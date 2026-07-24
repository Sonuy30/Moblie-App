/**
 * app/_layout.tsx — Root layout
 *
 * Initialisation order (matters — do not reorder):
 *  1. Sentry.init()          — must run before ANY React render
 *  2. ErrorBoundary          — catches crashes in the entire subtree
 *  3. SafeAreaProvider       — required by all safe-area consumers
 *  4. QueryClientProvider    — TanStack Query cache
 *  5. StatusBar              — global status bar style
 *  6. Stack navigator        — all routes
 *  7. Toast                  — global toast overlay
 */

import { Stack, router } from 'expo-router';
import { useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus, View, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '@/stores/authStore';
import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { initialiseSentry, setSentryUser, clearSentryUser } from '@/utils/sentry';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { clearBadge } from '@/services/notifications';
import { NetworkStatusProvider } from '@/hooks/useNetworkStatus';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { MISSING_ENV_VARS, Config } from '@/utils/config';
import { MissingEnvScreen } from '@/components/error/MissingEnvScreen';

// ── 1. Sentry: initialise before any render ────────────────────────────────
// Called at module evaluation time (outside component) so it captures
// errors that occur before the first React render cycle.
initialiseSentry();

// ── TanStack Query client ──────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 10,  // 10 min
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000,
});

// ── Root layout ────────────────────────────────────────────────────────────
export default function RootLayout() {
  const restoreSession      = useAuthStore((s) => s.restoreSession);
  const isAuthenticated     = useAuthStore((s) => s.isAuthenticated);
  const user                = useAuthStore((s) => s.user);
  const loadPreferences     = useNotificationStore((s) => s.loadPreferences);
  const { setup, setupHandlers } = usePushNotifications();
  const sessionRestored     = useRef(false);

  // ── Load notification preferences from AsyncStorage on startup ───────
  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  // ── Restore persisted auth session on app start ──────────────────────
  useEffect(() => {
    if (!sessionRestored.current) {
      sessionRestored.current = true;
      void restoreSession();
    }
  }, [restoreSession]);

  // ── Sync Sentry user context with auth state ─────────────────────────
  // Attaches phone/role to all Sentry events after login; clears on logout.
  useEffect(() => {
    if (isAuthenticated && user) {
      setSentryUser({
        id: user._id,
        phone: user.phone,
        companyId: user.companyId,
        role: user.role,
      });
    } else {
      clearSentryUser();
    }
  }, [isAuthenticated, user]);

  // ── Set up push notifications once authenticated ─────────────────────
  // setupHandlers() returns a cleanup function — honour it.
  useEffect(() => {
    if (isAuthenticated) {
      void setup();
      const unsubscribe = setupHandlers();
      return unsubscribe;
    }
    return undefined;
  }, [isAuthenticated, setup, setupHandlers]);

  // ── Clear badge when app comes back to foreground ────────────────────
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void clearBadge();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  // ── Sync wishlist once authenticated ─────────────────────────────────
  const syncWishlist = useWishlistStore((s) => s.syncWishlist);
  useEffect(() => {
    if (isAuthenticated) {
      void syncWishlist().catch((err: unknown) => {
        console.warn('Wishlist sync failed:', err);
      });
    }
  }, [isAuthenticated, syncWishlist]);

  // ── Deep link handler: aitsshop://invite/TOKEN ───────────────────────
  const handleDeepLink = useCallback(({ url }: { url: string }) => {
    if (!url) return;
    if (url.includes('/invite/')) {
      const token = url.split('/invite/')[1]?.split('?')[0];
      if (token) {
        router.push({
          pathname: '/(onboarding)/otp',
          params: { inviteToken: token, fromDeepLink: 'true' },
        });
      }
    } else if (url.includes('/product/')) {
      const productId = url.split('/product/')[1]?.split('?')[0];
      if (productId) {
        router.push(`/product/${productId}`);
      }
    }
  }, []);

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [handleDeepLink]);

  // ── Push notification tap → order / screen deep link ─────────────────
  // Fires when user taps a notification while the app is in background/killed.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as Record<string, unknown>;
      if (data?.orderId && typeof data.orderId === 'string') {
        router.push(`/order/${data.orderId}`);
      } else if (data?.screen && typeof data.screen === 'string') {
        router.push(data.screen);
      }
    });
    return () => sub.remove();
  }, []);

  if (MISSING_ENV_VARS.length > 0) {
    return <MissingEnvScreen missingVars={MISSING_ENV_VARS} />;
  }

  return (
    // ── 2. ErrorBoundary: catches any crash inside the entire app tree ──
    <ErrorBoundary
      onError={(error, info) => {
        // Additional root-level handling beyond Sentry (e.g. analytics)
        if (__DEV__) {
          console.error('[RootLayout] Uncaught render error:', error, info.componentStack);
        }
      }}
    >
      {/* ── 3 & 4. SafeArea + QueryClient ─────────────────────────────── */}
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: asyncStoragePersister,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
          }}
        >
          <NetworkStatusProvider>
            {/* ── 5. StatusBar ──────────────────────────────────────────── */}
            <StatusBar style="dark" />

            {/* Offline banner at the top */}
            <OfflineBanner />

            {/* Mock Mode banner at the top */}
            {Config.USE_MOCK_API && (
              <View style={{ backgroundColor: '#D32F2F', padding: 8, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 }}>
                  MOCK MODE — NOT LIVE DATA
                </Text>
              </View>
            )}

            {/* ── 6. Navigator ──────────────────────────────────────────── */}
            <Stack
              screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(staff)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="product/[id]" />
              <Stack.Screen name="checkout" />
              <Stack.Screen name="order/[id]" />
              <Stack.Screen name="order/[id]/track" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="order/[id]/invoice" options={{ headerShown: false }} />
              <Stack.Screen name="category/[category]" />
              <Stack.Screen name="addresses" />
              <Stack.Screen name="wishlist" options={{ headerShown: false }} />
              <Stack.Screen name="support" options={{ headerShown: false }} />
              <Stack.Screen name="terms" options={{ headerShown: false }} />
              {/* Subscription routes */}
              <Stack.Screen name="subscribe/[itemId]" options={{ presentation: 'modal' }} />
              <Stack.Screen name="subscription/[id]" />
            </Stack>

            {/* ── 7. Global Toast overlay ───────────────────────────────── */}
            <Toast />
          </NetworkStatusProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
