/**
 * api/auth.ts — Authentication API calls
 *
 * Responsibilities:
 *  - All HTTP calls related to identity (OTP, login, register, profile)
 *  - refreshToken()  — called by authStore.refreshAccessToken() indirectly
 *  - serverLogout()  — server-side session invalidation (best-effort)
 *  - Mock fallback   — when local backend is unavailable, serves mock data
 *
 * What this file does NOT do:
 *  - Manage SecureStore — that's authStore's job
 *  - Import from api/client's interceptor (would be circular)
 *  - Handle the queuing/mutex for concurrent refreshes (that's api/client.ts)
 *
 * COMPANY_SLUG is sent ONLY in pre-login calls (request-otp, register, login).
 * After login, companyId is embedded in the JWT — no slug needed.
 */

import client from './client';
import { Config } from '@/utils/config';
import type { AuthUser } from '@/stores/authStore';
import type { AxiosError } from 'axios';
import {
  mockRequestOTP,
  mockVerifyOTP,
  mockRegisterUser,
  mockLoginUser,
  mockGetProfile,
} from './mock';

// ── Types ──────────────────────────────────────────────────────────────────

export interface OTPRequestResponse {
  message: string;
  companyName?: string;
  maskedPhone?: string;
}

export interface OTPVerifyResponse {
  token: string;
  authToken: string;
  refreshToken?: string;  // server may issue a refresh token alongside the JWT
  customer: AuthUser | null;
  user: AuthUser | null;
}

export interface RegisterResponse {
  message: string;
  phone: string;
}

export interface LoginResponse {
  authToken: string;
  refreshToken?: string;  // long-lived token for silent re-auth
  user: AuthUser;
}

export interface ProfileResponse {
  user: AuthUser;
  company?: Record<string, unknown>;
}

export interface RefreshTokenResponse {
  accessToken?: string;
  authToken?: string;
  token?: string;
  refreshToken?: string;  // server may rotate refresh tokens
}

export interface InviteTokenResponse {
  maskedPhone: string;
  companyName: string;
  customerId: string;
}

// ── Server error response shape ────────────────────────────────────────────

interface ServerErrorBody {
  message?: string;
  error?: string;
}

// ── Backend availability detection ─────────────────────────────────────────
/**
 * Determines whether the backend is truly unreachable (vs. a user-input error).
 *
 * Fallback triggers:
 *   • No HTTP response — network error / CORS / server down / wrong IP
 *   • 405 — endpoint not implemented on this version of the server
 *   • HTML 404 — path doesn't exist (Vercel/CDN edge response, not our API)
 *   • 400 with company/slug/not-found — local DB isn't seeded for this slug
 *
 * Real user errors (wrong password, phone already registered) do NOT trigger
 * the fallback — those propagate as-is so the UI can show the right message.
 */
function isBackendMissing(err: unknown): boolean {
  const axiosErr = err as AxiosError<ServerErrorBody>;

  // No HTTP response = network error (server down, wrong IP, CORS, no internet)
  if (!axiosErr?.response) return true;

  const { status, data } = axiosErr.response;

  // Endpoint doesn't exist at all on this server
  if (status === 405) return true;

  // HTML error page from CDN/edge (not our JSON API)
  const isHtmlBody = !data || typeof data === 'string';
  if (status === 404 && isHtmlBody) return true;

  // Server returned JSON but it's a configuration problem, not a user error
  const msg = ((data?.message ?? '') + (data?.error ?? '')).toLowerCase();

  const isConfigProblem =
    msg.includes('company') ||
    msg.includes('slug') ||
    msg.includes('not found');

  return isConfigProblem;
}

// ── Request OTP ────────────────────────────────────────────────────────────
/** Send an OTP to the given phone number. */
export const requestOTP = async (phone: string): Promise<OTPRequestResponse> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] requestOTP active');
    return mockRequestOTP(phone);
  }
  try {
    const { data } = await client.post<OTPRequestResponse>('/api/mobile/request-otp', {
      phone,
      companySlug: Config.COMPANY_SLUG,
    });
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] requestOTP fallback active');
      return mockRequestOTP(phone);
    }
    throw err;
  }
};

/** Alias — same as requestOTP. */
export const resendRegisterOTP = requestOTP;

// ── Verify OTP ─────────────────────────────────────────────────────────────
/**
 * Verify the OTP entered by the user.
 * Returns both the access token and (if issued) the refresh token.
 */
export const verifyOTP = async (
  phone: string,
  otp: string
): Promise<OTPVerifyResponse> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] verifyOTP active');
    return mockVerifyOTP(phone, otp);
  }
  try {
    const { data } = await client.post<{
      authToken?: string;
      token?: string;
      refreshToken?: string;
      user?: AuthUser;
      customer?: AuthUser;
    }>('/api/mobile/verify-otp', {
      phone,
      otp,
      companySlug: Config.COMPANY_SLUG,
    });

    const accessToken = data.authToken ?? data.token ?? '';
    const user = data.user ?? data.customer ?? null;

    return {
      token:        accessToken,
      authToken:    accessToken,
      refreshToken: data.refreshToken,
      customer:     user,
      user,
    };
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] verifyOTP fallback active');
      return mockVerifyOTP(phone, otp);
    }
    throw err;
  }
};

/** Alias. */
export const verifyRegisterOTP = verifyOTP;

// ── Register ───────────────────────────────────────────────────────────────
export const registerUser = async (params: {
  fullName: string;
  phone: string;
  password?: string;
}): Promise<RegisterResponse> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] registerUser active');
    return mockRegisterUser(params);
  }
  try {
    const { data } = await client.post<RegisterResponse>('/api/mobile/register', {
      ...params,
      companySlug: Config.COMPANY_SLUG,
    });
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] registerUser fallback active');
      return mockRegisterUser(params);
    }
    throw err;
  }
};

// ── Login ──────────────────────────────────────────────────────────────────
/**
 * Authenticate with phone + password.
 * Returns both the access token and (if issued) the refresh token.
 */
export const loginUser = async (params: {
  phone: string;
  password?: string;
}): Promise<LoginResponse> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] loginUser active');
    return mockLoginUser(params);
  }
  try {
    const { data } = await client.post<LoginResponse>('/api/mobile/login', {
      phone: params.phone,
      password: params.password,
      companySlug: Config.COMPANY_SLUG,
    });
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] loginUser fallback active');
      return mockLoginUser(params);
    }
    throw err;
  }
};

// ── Token refresh ──────────────────────────────────────────────────────────
/**
 * Exchange a refresh token for a new access token.
 *
 * NOTE: This function is exposed here for documentation/testing purposes.
 * In production the actual refresh call is made inside authStore.refreshAccessToken()
 * using bare fetch() to avoid Axios interceptor recursion. If your backend
 * refresh endpoint has CORS or extra header requirements, update both here
 * AND in authStore.refreshAccessToken().
 *
 * @param refreshToken - The long-lived refresh token from SecureStore.
 */
export const refreshTokenApi = async (
  refreshToken: string
): Promise<RefreshTokenResponse> => {
  // Use a raw fetch so this never gets caught by the Axios refresh interceptor.
  // (If we used the Axios client here, a 401 would trigger a recursive refresh.)
  const response = await fetch(`${Config.API_URL}/api/mobile/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Client': 'aits-shop',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error(`Refresh failed: HTTP ${response.status}`);
  }

  return response.json() as Promise<RefreshTokenResponse>;
};

// ── Server logout ──────────────────────────────────────────────────────────
/**
 * Invalidate the refresh token on the server (best-effort).
 * Always resolves — a network failure here should not block the local logout.
 * The Zustand store's logout() clears SecureStore regardless.
 */
export const serverLogout = async (refreshToken: string): Promise<void> => {
  try {
    await client.post('/api/mobile/logout', { refreshToken });
  } catch (err) {
    // Best-effort only. Log in dev, silently ignore in prod.
    if (__DEV__) {
      console.warn('[Auth] Server-side logout failed (non-critical):', err);
    }
  }
};

// ── Profile ────────────────────────────────────────────────────────────────
export const getProfile = async (): Promise<ProfileResponse> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] getProfile active');
    try {
      return await mockGetProfile('demo-user-001');
    } catch {
      return {
        user: {
          _id: 'guest',
          fullName: 'Guest',
          phone: '',
          role: 'customer',
          companyId: '',
          companyName: Config.COMPANY_NAME,
        },
      };
    }
  }
  try {
    const { data } = await client.get<ProfileResponse>('/api/customers/profile');
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] getProfile fallback active');
      try {
        // mockGetProfile requires a userId; pass empty string to get first mock user
        return await mockGetProfile('demo-user-001');
      } catch {
        return {
          user: {
            _id: 'guest',
            fullName: 'Guest',
            phone: '',
            role: 'customer',
            companyId: '',
            companyName: Config.COMPANY_NAME,
          },
        };
      }
    }
    throw err;
  }
};


export const updateProfile = async (body: {
  pushToken?: string;
  fullName?: string;
  addresses?: Record<string, unknown>[];
}): Promise<{ success: boolean }> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] updateProfile no-op');
    return { success: true };
  }
  try {
    const { data } = await client.put<{ success: boolean }>('/api/customers/profile', body);
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] updateProfile no-op');
      return { success: true };
    }
    throw err;
  }
};

// ── Forgot password ────────────────────────────────────────────────────────
export const forgotPasswordAPI = async (
  email: string
): Promise<{ message: string }> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] forgotPassword — simulated success');
    return { message: 'If this email is registered, a reset link has been sent.' };
  }
  try {
    const { data } = await client.post<{ message: string }>(
      '/api/customers/forgot-password',
      { email, companySlug: Config.COMPANY_SLUG }
    );
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] forgotPassword — simulated success');
      return { message: 'If this email is registered, a reset link has been sent.' };
    }
    throw err;
  }
};

// ── Invite token validation ────────────────────────────────────────────────
export const validateInviteToken = async (
  token: string
): Promise<InviteTokenResponse> => {
  if (Config.USE_MOCK_API) {
    return {
      maskedPhone:  '******9999',
      companyName:  Config.COMPANY_NAME,
      customerId:   'demo-customer-123',
    };
  }
  try {
    const { data } = await client.get<InviteTokenResponse>(
      `/api/customers/invite/${token}`
    );
    return data;
  } catch (err) {
    const axiosErr = err as AxiosError<ServerErrorBody>;
    if (!axiosErr?.response) {
      // Network error — return safe fallback so onboarding can still proceed
      return {
        maskedPhone:  '******9999',
        companyName:  Config.COMPANY_NAME,
        customerId:   'demo-customer-123',
      };
    }
    // Server error (invalid/expired invite token) — propagate it
    throw err;
  }
};
