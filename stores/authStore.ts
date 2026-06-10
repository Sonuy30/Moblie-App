/**
 * stores/authStore.ts — Zustand Auth Store
 *
 * Manages the full authentication lifecycle:
 *  - Session persistence via expo-secure-store
 *  - JWT + refresh token storage
 *  - Token refresh coordination (the Axios interceptor calls refreshAccessToken)
 *  - Sentry user context sync (via utils/sentry)
 *
 * SecureStore key registry:
 *  'aits_auth_token'    — Short-lived JWT access token
 *  'aits_refresh_token' — Long-lived refresh token (30 days)
 *  'aits_auth_user'     — JSON-serialised AuthUser object
 *
 * Design decisions:
 *  - refreshAccessToken() is kept on the store (not in api/) because the
 *    Axios interceptor imports the store directly — putting it in api/auth.ts
 *    would create a circular dependency (api/ → store → api/).
 *  - The store never imports from api/client.ts for the same reason.
 *  - All SecureStore operations are wrapped in try/catch — hardware-backed
 *    storage can fail on old Android devices without crashing the app.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Config } from '@/utils/config';

// ── Secure store keys ──────────────────────────────────────────────────────

export const SECURE_KEYS = {
  ACCESS_TOKEN:  'aits_auth_token',
  REFRESH_TOKEN: 'aits_refresh_token',
  USER:          'aits_auth_user',
} as const;

// ── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'delivery_staff' | 'warehouse_staff' | 'admin';
  companyId: string;
  companyName: string;
  tier?: 'premium' | 'regular' | 'guest';
  creditLimit?: number;
  creditAvailable?: number;
  pushToken?: string;
  email?: string;
}

/** Result of a successful token refresh. */
export interface RefreshResult {
  accessToken: string;
  refreshToken?: string; // server may rotate refresh tokens (rotation strategy)
}

interface AuthStore {
  // ── State ─────────────────────────────────────────────────────────────
  user: AuthUser | null;
  token: string | null;          // access token (in-memory copy; SecureStore is source of truth)
  isLoading: boolean;
  isAuthenticated: boolean;

  // ── Session management ────────────────────────────────────────────────
  /** Persist tokens + user after a successful login/OTP-verify. */
  setSession: (accessToken: string, user: AuthUser, refreshToken?: string) => Promise<void>;
  /** Full logout — clears SecureStore, resets state. */
  logout: () => Promise<void>;
  /** Restore session from SecureStore on app cold-start. */
  restoreSession: () => Promise<void>;

  // ── Token refresh (called by Axios interceptor) ───────────────────────
  /**
   * Silently refreshes the access token using the stored refresh token.
   * Returns the new access token string on success, null on failure.
   * On failure, also clears stored credentials (triggers redirect to login).
   */
  refreshAccessToken: () => Promise<string | null>;

  // ── User updates ──────────────────────────────────────────────────────
  updateUser: (updates: Partial<AuthUser>) => void;
  updatePushToken: (pushToken: string) => void;
}

// ── JWT utilities ──────────────────────────────────────────────────────────

interface JwtPayload {
  exp?: number;
  iat?: number;
  userId?: string;
  companyId?: string;
  role?: string;
}

/**
 * Decodes a JWT payload without verifying signature.
 * Safe to use client-side — we only need the claims for UX decisions,
 * not for security enforcement (the server still validates the signature).
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // React Native's atob handles standard base64; add padding if needed
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true when a token is syntactically valid and not expired.
 * Handles both real JWTs and mock tokens (prefixed "mock.").
 */
function isTokenValid(token: string): boolean {
  try {
    if (token.startsWith('mock.')) {
      const payloadB64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadB64)) as { iat?: number };
      const ageMs = Date.now() - (payload.iat ?? 0);
      return ageMs < 30 * 24 * 60 * 60 * 1000; // mock tokens live for 30 days
    }

    const payload = decodeJwtPayload(token);
    if (!payload) return false;
    if (payload.exp) {
      // Add a 30-second clock-skew buffer
      return Date.now() < (payload.exp - 30) * 1000;
    }
    return true; // no exp claim → assume valid
  } catch {
    return false;
  }
}

/** Returns true when a token is expired (or absent) and a refresh is warranted. */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  return !isTokenValid(token);
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // ── setSession ─────────────────────────────────────────────────────────
  setSession: async (accessToken, user, refreshToken) => {
    try {
      await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(SECURE_KEYS.USER, JSON.stringify(user));
      if (refreshToken) {
        await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, refreshToken);
      }
    } catch (e) {
      console.warn('[AuthStore] Failed to persist session to SecureStore:', e);
    }
    set({ token: accessToken, user, isAuthenticated: true });
  },

  // ── logout ─────────────────────────────────────────────────────────────
  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_KEYS.USER);
    } catch (e) {
      console.warn('[AuthStore] SecureStore delete failed during logout:', e);
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  // ── restoreSession ─────────────────────────────────────────────────────
  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const accessToken  = await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
      const userStr      = await SecureStore.getItemAsync(SECURE_KEYS.USER);

      if (!accessToken || !userStr) {
        set({ isLoading: false });
        return;
      }

      // Parse user before deciding anything else
      let user: AuthUser | null = null;
      try {
        user = JSON.parse(userStr) as AuthUser;
      } catch {
        console.warn('[AuthStore] Corrupt user data in SecureStore — clearing');
        await get().logout();
        set({ isLoading: false });
        return;
      }

      if (!user?._id || !user?.phone) {
        console.warn('[AuthStore] Incomplete user data — clearing session');
        await get().logout();
        set({ isLoading: false });
        return;
      }

      // Access token still valid — restore normally
      if (isTokenValid(accessToken)) {
        set({ token: accessToken, user, isAuthenticated: true });
        return;
      }

      // Access token expired — attempt silent refresh if we have a refresh token
      if (refreshToken && isTokenValid(refreshToken)) {
        console.info('[AuthStore] Access token expired at startup — attempting silent refresh');
        // Temporarily set user so refreshAccessToken can run with context
        set({ token: accessToken, user, isAuthenticated: false });
        const newToken = await get().refreshAccessToken();
        if (newToken) {
          set({ isAuthenticated: true });
          return;
        }
      }

      // Both tokens invalid — clear and force re-login
      console.info('[AuthStore] Both tokens expired — clearing session');
      await get().logout();
    } catch (e) {
      console.warn('[AuthStore] restoreSession error:', e);
      await get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  // ── refreshAccessToken ─────────────────────────────────────────────────
  /**
   * Called by the Axios 401 interceptor.
   * Uses the refresh token to obtain a new access token from the server.
   *
   * Architecture note:
   *  - Uses a bare fetch() instead of the Axios client to avoid triggering
   *    the 401 interceptor again (which would cause infinite recursion).
   *  - The Axios interceptor handles the request-queue mutex; this method
   *    just performs the HTTP call and updates storage.
   */
  refreshAccessToken: async (): Promise<string | null> => {
    if (Config.USE_MOCK_API) {
      console.info('[MOCK] refreshAccessToken active');
      const currentUser = get().user;
      const payload = btoa(
        JSON.stringify({
          sub: currentUser?._id || 'mock-user-id',
          phone: currentUser?.phone || '9999999999',
          iat: Date.now(),
        })
      );
      const newAccessToken = `mock.${payload}.sig`;
      try {
        await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, newAccessToken);
      } catch (e) {
        console.warn('[AuthStore] Failed to save mock access token:', e);
      }
      set({ token: newAccessToken });
      return newAccessToken;
    }

    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        console.info('[AuthStore] No refresh token stored — cannot refresh');
        await get().logout();
        return null;
      }

      if (!isTokenValid(refreshToken)) {
        console.info('[AuthStore] Refresh token is expired — forcing re-login');
        await get().logout();
        return null;
      }

      // Use bare fetch to avoid Axios interceptor recursion
      const response = await fetch(`${Config.API_URL}/api/mobile/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Client': 'aits-shop',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Only log out if the client gets a explicit 4xx authentication reject
        if (response.status >= 400 && response.status < 500) {
          console.warn(`[AuthStore] Refresh token rejected by server (${response.status})`);
          await get().logout();
        }
        return null;
      }

      const data = (await response.json()) as {
        accessToken?: string;
        authToken?: string;
        token?: string;
        refreshToken?: string;
      };

      const newAccessToken = data.accessToken ?? data.authToken ?? data.token ?? null;

      if (!newAccessToken) {
        console.warn('[AuthStore] Refresh response missing access token');
        await get().logout();
        return null;
      }

      // Persist new tokens
      await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, newAccessToken);
      if (data.refreshToken) {
        // Server is rotating refresh tokens (more secure) — update stored token
        await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, data.refreshToken);
      }

      // Update in-memory state
      set({ token: newAccessToken });

      console.info('[AuthStore] Access token refreshed successfully');
      return newAccessToken;
    } catch (e) {
      console.warn('[AuthStore] refreshAccessToken network error:', e);
      // DO NOT call logout() here! Wiping credentials on connection drop is a bug.
      return null;
    }
  },

  // ── updateUser ─────────────────────────────────────────────────────────
  updateUser: (updates) => {
    set((state) => {
      if (!state.user) return {};
      const updatedUser = { ...state.user, ...updates };
      SecureStore.setItemAsync(SECURE_KEYS.USER, JSON.stringify(updatedUser)).catch((e) =>
        console.warn('[AuthStore] Failed to persist user update:', e)
      );
      return { user: updatedUser };
    });
  },

  // ── updatePushToken ────────────────────────────────────────────────────
  updatePushToken: (pushToken) => {
    set((state) => {
      if (!state.user) return {};
      const updatedUser = { ...state.user, pushToken };
      SecureStore.setItemAsync(SECURE_KEYS.USER, JSON.stringify(updatedUser)).catch((e) =>
        console.warn('[AuthStore] Failed to persist push token:', e)
      );
      return { user: updatedUser };
    });
  },
}));
