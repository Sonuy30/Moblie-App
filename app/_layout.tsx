import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[slug]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="order-success" options={{ gestureEnabled: false }} />
          <Stack.Screen name="order/[id]" />
          <Stack.Screen name="wishlist" />
          <Stack.Screen name="search" options={{ animation: 'fade' }} />
          <Stack.Screen name="category/[category]" />
          <Stack.Screen name="addresses" />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
