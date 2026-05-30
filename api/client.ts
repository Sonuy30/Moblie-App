import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * API Client — JWT-only authentication (no hardcoded store token).
 *
 * Architecture:
 *  - BEFORE login: company is identified via `companySlug` sent in request body
 *  - AFTER login:  JWT payload contains `companyId`, so no extra header needed
 *  - ERP reads companyId from the decoded JWT for every authenticated request
 */
const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://aitserp-30072025.vercel.app',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor ──────────────────────────────────────────
// Attach JWT on every request (when user is logged in).
// The ERP decodes this token to get userId + companyId — no store token needed.
client.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('aits_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    console.warn('[API] SecureStore read failed:', e);
  }
  return config;
});

// ── Response Interceptor ─────────────────────────────────────────
// On 401: clear saved credentials (token expired / revoked).
// Do NOT redirect here — screens handle their own navigation.
// Redirecting from the interceptor caused product pages to jump to home
// whenever the ERP returned 401 for unauthenticated browsing requests.
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('aits_auth_token');
        await SecureStore.deleteItemAsync('aits_auth_user');
        console.info('[API] 401 received — credentials cleared');
      } catch (e) {
        console.warn('[API] SecureStore delete failed:', e);
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// ── Error Utility ────────────────────────────────────────────────
// Extracts a user-friendly message from Axios errors
export const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as any;
    if (e.response?.data?.message) return e.response.data.message;
    if (e.response?.data?.error)   return e.response.data.error;
    if (e.message)                 return e.message;
  }
  return 'Something went wrong. Please try again.';
};
