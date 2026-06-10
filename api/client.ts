/**
 * api/client.ts — Axios HTTP Client with JWT Refresh
 *
 * Token refresh architecture:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Request A ──► 401 ──► isRefreshing=false → START refresh        │
 * │  Request B ──► 401 ──► isRefreshing=true  → QUEUE (promise)      │
 * │  Request C ──► 401 ──► isRefreshing=true  → QUEUE (promise)      │
 * │                                                                    │
 * │  Refresh succeeds → processQueue(newToken)                        │
 * │    Request A retried with newToken ──► 200 ✓                      │
 * │    Request B retried with newToken ──► 200 ✓                      │
 * │    Request C retried with newToken ──► 200 ✓                      │
 * │                                                                    │
 * │  Refresh fails   → processQueue(null) → all queued reqs reject    │
 * │                    logout() → navigate to login screen            │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Key design decisions:
 *  - The mutex (isRefreshing flag) guarantees exactly ONE refresh call
 *    regardless of how many requests 401 simultaneously.
 *  - Queued requests are stored as resolve/reject callbacks so they can
 *    be replayed or cancelled without re-running any business logic.
 *  - The refresh itself uses authStore.refreshAccessToken() which uses
 *    bare fetch() — never this Axios instance — to prevent recursion.
 *  - Requests to the refresh endpoint itself bypass the retry logic.
 *  - Non-authenticated 401s (guest on protected endpoint) are handled by
 *    checking whether a token was actually stored before retrying.
 */

import axios, {
  type AxiosError,
  type AxiosResponse,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Config } from '@/utils/config';
import { SECURE_KEYS } from '@/stores/authStore';

// ── Extended request config ────────────────────────────────────────────────
// We mark retried requests so the interceptor doesn't enter an infinite loop.
interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Internal Axios config extended with our retry flag
type InternalRetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// ── Refresh queue types ────────────────────────────────────────────────────

/** Resolver called with the new access token when refresh succeeds. */
type QueueResolve = (newToken: string) => void;

/** Rejecter called when refresh fails — propagates the original 401 error. */
type QueueReject = (error: AxiosError) => void;

interface QueueItem {
  resolve: QueueResolve;
  reject: QueueReject;
}

// ── Module-level refresh state ─────────────────────────────────────────────
// These live outside the Axios instance so they survive interceptor re-runs.

/** True while a refresh request is in-flight. Prevents duplicate refreshes. */
let isRefreshing = false;

/**
 * Queue of { resolve, reject } pairs for requests that 401'd while a
 * refresh was already in-flight. Drained when refresh completes.
 */
let failedQueue: QueueItem[] = [];

/**
 * Drain the queue after a refresh attempt.
 * @param newToken - The refreshed access token, or null if refresh failed.
 * @param error    - The AxiosError to reject with on failure.
 */
function processQueue(newToken: string | null, error: AxiosError | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (newToken) {
      resolve(newToken);
    } else {
      reject(error!);
    }
  });
  failedQueue = [];
}

// ── Refresh endpoint path (never retry this URL itself) ────────────────────
const REFRESH_PATH = '/api/mobile/refresh-token';

// ── Axios instance ─────────────────────────────────────────────────────────
const client = axios.create({
  baseURL: Config.API_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Client': 'aits-shop',
  },
});

// ── Request Interceptor ────────────────────────────────────────────────────
// Reads the latest access token from SecureStore on every request.
// SecureStore is the source of truth — the in-memory store state may be stale
// if the token was just refreshed and the component hasn't re-rendered yet.
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore can fail on old Android devices (<API 23).
      // Proceed without auth — the server will return 401 if needed.
      console.warn('[API] SecureStore read failed — proceeding unauthenticated');
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ── Response Interceptor ───────────────────────────────────────────────────
client.interceptors.response.use(
  // ── Happy path ─────────────────────────────────────────────────────────
  (res: AxiosResponse) => res,

  // ── Error path ─────────────────────────────────────────────────────────
  async (error: AxiosError): Promise<AxiosResponse> => {
    const originalConfig = error.config as InternalRetryableConfig | undefined;

    // ── Not a 401, or no config (edge case) — pass through immediately ──
    if (!originalConfig || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // ── Never retry the refresh endpoint — that would be infinite recursion ──
    if (originalConfig.url?.includes(REFRESH_PATH)) {
      return Promise.reject(error);
    }

    // ── Already retried once — stop here (prevents retry loops) ─────────
    if (originalConfig._retry) {
      return Promise.reject(error);
    }

    // ── Check whether this was an authenticated request ──────────────────
    // If no access token was stored, this is a guest request to a protected
    // endpoint. Don't attempt a refresh — just surface the 401.
    let storedAccessToken: string | null = null;
    try {
      storedAccessToken = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    } catch {
      console.warn('[API] Could not read access token from SecureStore in 401 handler');
    }

    if (!storedAccessToken) {
      // Unauthenticated guest request — don't touch credentials
      return Promise.reject(error);
    }

    // ── A refresh is already in-flight: queue this request ───────────────
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken: string) => {
            // Retry with the freshly obtained token
            originalConfig._retry = true;
            originalConfig.headers = originalConfig.headers ?? {};
            originalConfig.headers.Authorization = `Bearer ${newToken}`;
            resolve(client(originalConfig));
          },
          reject: (queueError: AxiosError) => {
            reject(queueError);
          },
        });
      });
    }

    // ── We are the first 401 — acquire the mutex and start a refresh ─────
    isRefreshing = true;
    originalConfig._retry = true;

    try {
      // Dynamically import to avoid circular dependency at module evaluation time.
      // (authStore imports nothing from api/; this import only runs at runtime.)
      const { useAuthStore } = await import('@/stores/authStore');
      const refreshAccessToken = useAuthStore.getState().refreshAccessToken;

      const newToken = await refreshAccessToken();

      if (!newToken) {
        // Refresh failed — authStore already called logout() internally.
        // Drain the queue with an error so all queued requests reject cleanly.
        processQueue(null, error);

        // Navigate to login. Use replace so back-button doesn't return to
        // whatever screen triggered the 401.
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }

      // ── Refresh succeeded ──────────────────────────────────────────────
      // Update the header on the original (triggering) request and retry it.
      originalConfig.headers = originalConfig.headers ?? {};
      originalConfig.headers.Authorization = `Bearer ${newToken}`;

      // Drain the queue — all waiting requests get the new token and retry
      processQueue(newToken, null);

      return client(originalConfig);
    } catch (refreshError) {
      // Unexpected error during refresh (e.g. network died mid-refresh)
      processQueue(null, error);
      router.replace('/(auth)/login');
      return Promise.reject(refreshError instanceof Error ? refreshError : new Error(String(refreshError)));
    } finally {
      // Always release the mutex so the next genuine 401 can trigger a new refresh
      isRefreshing = false;
    }
  }
);

export default client;

/**
 * Alias — satisfies any import using `axiosInstance`.
 * @example  import axiosInstance from '@/api/client';
 */
export { client as axiosInstance };

// ── Error utilities ────────────────────────────────────────────────────────

/**
 * Extracts a user-friendly error message from any thrown value.
 * Never exposes raw stack traces or internal server error details.
 */
export const getErrorMessage = (err: unknown): string => {
  if (typeof err === 'string') return err;

  if (err && typeof err === 'object') {
    // If it's a standard Error (from a mock function throw) and not an Axios error,
    // directly return the message.
    if (!axios.isAxiosError(err)) {
      const standardError = err as Error;
      if (standardError.message) return standardError.message;
    }

    const e = err as AxiosError<{ message?: string; error?: string }>;
    if (e.response?.data?.message) return e.response.data.message;
    if (e.response?.data?.error)   return e.response.data.error;
    if (e.code === 'ECONNABORTED') return 'Request timed out. Please check your connection.';
    if (!e.response && e.message)  return 'Network error. Please check your connection.';
    if (e.message)                 return e.message;
  }

  return 'Something went wrong. Please try again.';
};

/** True when the error is a pure network failure (no HTTP response received). */
export const isNetworkError = (err: unknown): boolean =>
  !(err as AxiosError)?.response;

/** HTTP status code from an Axios error, or null if unavailable. */
export const getStatusCode = (err: unknown): number | null =>
  (err as AxiosError)?.response?.status ?? null;

// ── Type-safe response envelope ────────────────────────────────────────────

/** Standard AITS API response wrapper returned by all endpoints. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Strips the AITS `{ success, data }` envelope and returns only `data`.
 * @example
 *   const products = await client
 *     .get<ApiResponse<Product[]>>('/products')
 *     .then(unwrapData);
 */
export const unwrapData = <T>(res: AxiosResponse<ApiResponse<T>>): T =>
  res.data.data;

// ── Re-export config type so callers don't need a separate import ──────────
export type { RetryableRequestConfig };
