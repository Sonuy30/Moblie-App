import { useAuthStore } from '@/stores/authStore';
import type { AuthUser } from '@/stores/authStore';
import { useCallback } from 'react';
import { getErrorMessage } from '@/api/client';
import { verifyRegisterOTP } from '@/api/auth';

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
      const { authToken: token, user } = await verifyRegisterOTP(phone, otp);
      if (!user) throw new Error('Verification failed');
      const authenticatedUser: AuthUser = {
        ...user,
        _id: user._id || '',
        fullName: user.fullName || '',
        phone: user.phone || phone,
        role: (user.role || 'customer'),
        companyId: user.companyId || '',
        companyName: user.companyName || '',
      };
      await store.setSession(token, authenticatedUser);
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: getErrorMessage(err) };
    }
  }, [store]);

  // Legacy register — not supported in OTP-only flow
  const register = useCallback(async (_data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    await Promise.resolve();
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
