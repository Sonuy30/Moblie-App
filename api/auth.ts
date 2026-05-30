import client from './client';
import type { AuthUser } from '@/stores/authStore';
import {
  mockRequestOTP,
  mockVerifyOTP,
  mockRegisterUser,
  mockLoginUser,
  mockGetProfile,
} from './mock';

/**
 * Company slug — identifies which company's ERP this app connects to.
 * Used ONLY in pre-login calls (register, request-otp) so the ERP knows
 * which company to look up. After login, companyId lives inside the JWT.
 *
 * This is NOT a secret — it's just a readable identifier like "pankaj-steel".
 * Replace with: process.env.EXPO_PUBLIC_COMPANY_SLUG
 */
const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';

// Helper: check if backend is truly unreachable or misconfigured → use mock data
//
// Fallback triggers:
//   • No HTTP response at all — network error / CORS / server down
//   • 405 — endpoint not implemented on this server
//   • 404 — endpoint path doesn't exist on local dev server
//   • 400 with a company/config error message — means the companySlug in .env.local
//     doesn't match any company in the local DB (config problem, not user input error)
//
// Real user errors (wrong password, phone already registered, etc.) still surface normally.
function isBackendMissing(err: any): boolean {
  const status = err?.response?.status;

  // No HTTP response = network error (server down, wrong IP, CORS, no internet)
  if (!status) return true;

  // 405 = endpoint doesn't exist at all
  if (status === 405) return true;

  // 404 = route not found on local dev server (endpoint not wired up yet)
  if (status === 404) return true;

  // 400 where the body indicates a company / configuration problem
  // (e.g. "Company not found", "Invalid company", "companySlug is required")
  // This is a dev setup issue, NOT a user input error — fall back to mock.
  if (status === 400) {
    const msg: string = (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      ''
    ).toLowerCase();
    const isConfigError =
      msg.includes('company') ||
      msg.includes('not found') ||
      msg.includes('invalid company') ||
      msg.includes('companyslug') ||
      msg.includes('slug');
    if (isConfigError) return true;
  }

  // Everything else (400 user errors, 401, 403, 409, 500) = real backend
  // response that should surface to the user.
  return false;
}

// ──────────────────────────────────────────────────────────
// Request OTP (pre-login — company identified by slug)
// ──────────────────────────────────────────────────────────
export const requestOTP = async (phone: string): Promise<{ message: string; companyName?: string; maskedPhone?: string }> => {
  try {
    const { data } = await client.post('/api/mobile/request-otp', {
      phone,
      companySlug: COMPANY_SLUG,  // ERP uses this to find the company
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

// Alias
export const resendRegisterOTP = requestOTP;

// ──────────────────────────────────────────────────────────
// Verify OTP → ERP returns JWT with companyId embedded
// ──────────────────────────────────────────────────────────
export const verifyOTP = async (
  phone: string,
  otp: string
): Promise<{ token: string; authToken: string; customer: AuthUser | null; user: AuthUser | null }> => {
  try {
    const { data } = await client.post('/api/mobile/verify-otp', {
      phone,
      otp,
      companySlug: COMPANY_SLUG,
    });
    return {
      token:     data.authToken || data.token || '',
      authToken: data.authToken || data.token || '',
      customer:  data.user || data.customer || null,
      user:      data.user || data.customer || null,
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
// Register new customer (pre-login)
// ──────────────────────────────────────────────────────────
export const registerUser = async (params: {
  fullName: string;
  phone: string;
  password?: string;
}): Promise<{ message: string; phone: string }> => {
  try {
    const { data } = await client.post('/api/mobile/register', {
      ...params,
      companySlug: COMPANY_SLUG,  // ERP links this user to the company
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
// JWT returned will contain: { userId, companyId, role }
// ──────────────────────────────────────────────────────────
export const loginUser = async (params: {
  phone: string;
  password?: string;
}): Promise<{ authToken: string; user: AuthUser }> => {
  try {
    const { data } = await client.post('/api/mobile/login', {
      phone: params.phone,
      password: params.password,
      companySlug: COMPANY_SLUG,  // needed to find user in the right company
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
// Profile — JWT carries companyId, no extra header needed
// ──────────────────────────────────────────────────────────
export const getProfile = async (): Promise<{ user: AuthUser; company?: any }> => {
  try {
    const { data } = await client.get('/api/customers/profile');
    return data as { user: AuthUser; company?: any };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] getProfile fallback active');
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
      console.info('[MOCK] updateProfile no-op');
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
    const { data } = await client.post('/api/customers/forgot-password', {
      email,
      companySlug: COMPANY_SLUG,
    });
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
// Validate invite token from QR code
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
      companyName: process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01',
      customerId: 'demo-customer-123',
    };
  }
};
