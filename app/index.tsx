import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, user, restoreSession } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => {
      setIsInitializing(false);
    });
  }, []);

  useEffect(() => {
    if (isInitializing || isLoading) return;

    if (!isAuthenticated) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // Route based on role from JWT
    const role = user?.role;
    if (role === 'customer') {
      router.replace('/(customer)');
    } else if (role === 'delivery_staff' || role === 'warehouse_staff' || role === 'admin') {
      router.replace('/(staff)');
    } else {
      router.replace('/(onboarding)/welcome');
    }
  }, [isAuthenticated, isLoading, user, isInitializing]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#185FA5" />
    </View>
  );
}
