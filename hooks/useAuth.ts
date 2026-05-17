import { useAuthStore } from '@/stores/authStore';
import { useCallback } from 'react';
import { getErrorMessage } from '@/api/client';

export const useAuth = () => {
  const store = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    try {
      await store.login(email, password);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, []);

  const register = useCallback(async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      await store.register(data);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, []);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    login,
    register,
    logout: store.logout,
    restoreSession: store.restoreSession,
  };
};
