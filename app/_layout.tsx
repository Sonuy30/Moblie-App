import { Stack, router } from 'expo-router';
import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import Toast from 'react-native-toast-message';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { setup, setupHandlers } = usePushNotifications();

  useEffect(() => {
    if (isAuthenticated) {
      setup();
      setupHandlers();
    }
  }, [isAuthenticated]);

  // Handle deep links: aitsshop://invite/INV_TOKEN
  // or: https://aitsshop.app/invite/INV_TOKEN
  const handleDeepLink = useCallback(({ url }: { url: string }) => {
    if (!url) return;

    // From URL: https://aitsshop.app/invite/INV_83HD92KS
    if (url.includes('/invite/')) {
      const token = url.split('/invite/')[1]?.split('?')[0];
      if (token) {
        router.push({
          pathname: '/(onboarding)/otp',
          params: { inviteToken: token, fromDeepLink: 'true' },
        });
      }
    }
  }, []);

  useEffect(() => {
    // Handle app opened from link (cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    // Handle link while app is open
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, [handleDeepLink]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(staff)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="product/[slug]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order-success" options={{ gestureEnabled: false }} />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="wishlist" />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="category/[category]" />
          <Stack.Screen name="addresses" />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

