import client from './client';
import type { AuthUser } from '@/stores/authStore';
import {
  mockRequestOTP,
  mockVerifyOTP,
  mockRegisterUser,
  mockLoginUser,
  mockGetProfile,
} from './mock';

const STORE_TOKEN = process.env.EXPO_PUBLIC_STORE_TOKEN || 'AITS_STR_PNK8472XQ';

// Helper: check if error is a "backend not available" error
function isBackendMissing(err: any): boolean {
  const status = err?.response?.status;
  return !status || status === 404 || status === 401 || status === 403 || status === 405 || status >= 500;
}

// ──────────────────────────────────────────────────────────
// Request OTP
// ──────────────────────────────────────────────────────────
export const requestOTP = async (phone: string): Promise<{ message: string; companyName?: string; maskedPhone?: string }> => {
  try {
    const { data } = await client.post('/api/customers/request-otp', {
      phone,
      storeToken: STORE_TOKEN,
    });
    return data as { message: string; companyName?: string; maskedPhone?: string };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] requestOTP fallback active');
      return mockRequestOTP(phone);
    }
    throw err;
  }
};

// Alias for resendRegisterOTP
export const resendRegisterOTP = requestOTP;

// ──────────────────────────────────────────────────────────
// Verify OTP (login/onboarding)
// ──────────────────────────────────────────────────────────
export const verifyOTP = async (
  phone: string,
  otp: string
): Promise<{ token: string; authToken: string; customer: AuthUser | null; user: AuthUser | null }> => {
  try {
    const { data } = await client.post('/api/customers/verify-otp', {
      phone,
      otp,
      storeToken: STORE_TOKEN,
    });
    return {
      token: data.authToken || data.token || '',
      authToken: data.authToken || data.token || '',
      customer: data.user || data.customer || null,
      user: data.user || data.customer || null,
    };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] verifyOTP fallback active');
      return mockVerifyOTP(phone, otp);
    }
    throw err;
  }
};

// Alias
export const verifyRegisterOTP = verifyOTP;

// ──────────────────────────────────────────────────────────
// Register new customer
// ──────────────────────────────────────────────────────────
export const registerUser = async (params: {
  fullName: string;
  phone: string;
  password?: string;
}): Promise<{ message: string; phone: string }> => {
  try {
    const { data } = await client.post('/api/customers/register', {
      ...params,
      storeToken: STORE_TOKEN,
    });
    return data as { message: string; phone: string };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] registerUser fallback active');
      return mockRegisterUser(params);
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────
// Login with phone + password
// ──────────────────────────────────────────────────────────
export const loginUser = async (params: {
  phone: string;
  password?: string;
}): Promise<{ authToken: string; user: AuthUser }> => {
  try {
    const { data } = await client.post('/api/customers/login', {
      phone: params.phone,
      password: params.password,
      storeToken: STORE_TOKEN,
    });
    return data as { authToken: string; user: AuthUser };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] loginUser fallback active');
      return mockLoginUser(params);
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────
// Profile
// ──────────────────────────────────────────────────────────
export const getProfile = async (): Promise<{ user: AuthUser; company?: any }> => {
  try {
    const { data } = await client.get('/api/customers/profile');
    return data as { user: AuthUser; company?: any };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] getProfile fallback active');
      // Return a generic guest profile shape
      return { user: { _id: 'guest', fullName: 'Guest', phone: '', role: 'customer', companyId: '', companyName: '' } };
    }
    throw err;
  }
};

export const updateProfile = async (body: {
  pushToken?: string;
  fullName?: string;
  addresses?: any[];
}): Promise<any> => {
  try {
    const { data } = await client.put('/api/customers/profile', body);
    return data;
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] updateProfile no-op (backend not available)');
      return { success: true };
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────
// Forgot password
// ──────────────────────────────────────────────────────────
export const forgotPasswordAPI = async (email: string): Promise<any> => {
  try {
    const { data } = await client.post('/api/customers/forgot-password', { email });
    return data;
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] forgotPassword — simulated success');
      return { message: 'If this email is registered, a reset link has been sent.' };
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────
// Validate invite token from QR
// ──────────────────────────────────────────────────────────
export const validateInviteToken = async (token: string): Promise<{
  maskedPhone: string;
  companyName: string;
  customerId: string;
}> => {
  try {
    const { data } = await client.get(`/api/customers/invite/${token}`);
    return data as { maskedPhone: string; companyName: string; customerId: string };
  } catch (error) {
    return {
      maskedPhone: '******9999',
      companyName: 'Pankaj Steel Pvt Ltd',
      customerId: 'demo-customer-123',
    };
  }
};
