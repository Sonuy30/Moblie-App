import { useAuthStore } from '@/stores/authStore';
import { useCallback } from 'react';
import { getErrorMessage } from '@/api/client';
import { verifyOTP } from '@/api/auth';

/**
 * Legacy auth hook used by (auth)/login.tsx and (auth)/register.tsx.
 * The primary auth flow now uses (onboarding) screens with OTP.
 * This hook provides backward-compatible login/register wrappers.
 */
export const useAuth = () => {
  const store = useAuthStore();

  // Legacy login — treats email as phone and password as OTP
  const login = useCallback(async (email: string, password: string) => {
    try {
      const phone = email; // In legacy flow, email field holds phone
      const otp = password; // In legacy flow, password field holds OTP
      const { token, customer } = await verifyOTP(phone, otp);
      const userRole = customer.role || 'customer';
      const authenticatedUser = { ...customer, role: userRole };
      await store.setSession(token, authenticatedUser);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, []);

  // Legacy register — not supported in OTP-only flow
  const register = useCallback(async (_data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    return {
      success: false,
      error: 'Registration is done via invite QR code. Please scan the QR from your supplier.',
    };
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
