import client from './client';
import type { AuthUser } from '@/stores/authStore';

// Validate invite token from QR scan
export const validateInviteToken = async (inviteToken: string) => {
  const { data } = await client.post('/api/store/auth/invite', { inviteToken });
  return data as {
    customerId: string;
    maskedPhone: string;
    companyName: string;
  };
};

// Request OTP for phone login/register
export const requestOTP = async (phone: string) => {
  const { data } = await client.post('/api/store/auth/send-otp', { phone });
  return data as { maskedPhone?: string; companyName?: string; success?: boolean };
};

// Verify OTP and get auth token
export const verifyOTP = async (phone: string, otp: string) => {
  const { data } = await client.post('/api/store/auth/register', { phone, otp });
  return data as { token: string; customer: AuthUser; isNewUser?: boolean };
};

// Get current user profile (used to restore session)
export const getProfile = async () => {
  const { data } = await client.get('/api/store/auth/profile');
  return data as { user: AuthUser };
};

// Save push token to backend
export const savePushToken = async (pushToken: string) => {
  await client.put('/api/store/auth/profile', { pushToken });
};

// Forgot password API (legacy/fallback)
export const forgotPasswordAPI = async (email: string) => {
  const { data } = await client.post('/api/store/auth/forgot-password', { email });
  return data;
};
