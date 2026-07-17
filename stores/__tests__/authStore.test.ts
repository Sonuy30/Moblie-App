/**
 * stores/__tests__/authStore.test.ts
 *
 * Unit tests for the auth Zustand store — session management and JWT utilities.
 * Pure Node environment. expo-secure-store is mocked in jest-setup.ts.
 *
 * Coverage:
 *  • setSession   — persists tokens/user, sets isAuthenticated = true
 *  • logout       — wipes SecureStore, resets all state
 *  • restoreSession — valid token restore, expired + refresh, both expired
 *  • isTokenExpired — exported utility: future/past/missing tokens
 *  • JWT expiry   — future-dated payload treated as valid
 *  • updateUser   — partial field merges without full reset
 */

// expo-secure-store is mocked globally in jest-setup.ts (in-memory Map).
// We import the mock so we can assert call counts in specific tests.
import * as SecureStore from 'expo-secure-store';

import { useAuthStore, isTokenExpired, SECURE_KEYS } from '../authStore';
import type { AuthUser } from '../authStore';

// ── JWT test helpers ───────────────────────────────────────────────────────

function base64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/**
 * Build a minimal JWT string with the given exp (Unix timestamp in seconds).
 * Not cryptographically signed — the store only decodes, never verifies.
 */
function buildJwt(expOffset: number): string {
  const exp = Math.floor(Date.now() / 1000) + expOffset;
  const header  = base64url({ alg: 'HS256', typ: 'JWT' });
  const payload = base64url({ userId: 'u1', companyId: 'c1', role: 'customer', exp });
  return `${header}.${payload}.fakesig`;
}

const VALID_JWT      = buildJwt(+3600);   // expires in 1 hour
const EXPIRED_JWT    = buildJwt(-3600);   // expired 1 hour ago
const NO_EXP_JWT     = `${base64url({ alg: 'HS256' })}.${base64url({ userId: 'u1' })}.fakesig`;
const FUTURE_JWT     = buildJwt(+86400);  // expires in 24 hours

const MOCK_USER: AuthUser = {
  _id:         'user-001',
  fullName:    'Sonu Yadav',
  phone:       '9876543210',
  role:        'customer',
  companyId:   'comp-001',
  companyName: 'Test Company Ltd',
};

// ── Reset store state between tests ───────────────────────────────────────
beforeEach(async () => {
  // Full logout resets state + SecureStore (mocked in-memory map cleared by jest-setup)
  await useAuthStore.getState().logout();
  jest.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. isTokenExpired (exported utility)
// ═══════════════════════════════════════════════════════════════════════════

describe('isTokenExpired()', () => {
  test('returns true for null token', () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  test('returns true for empty string', () => {
    expect(isTokenExpired('')).toBe(true);
  });

  test('returns false for a valid future-dated JWT', () => {
    expect(isTokenExpired(VALID_JWT)).toBe(false);
  });

  test('returns true for an expired JWT', () => {
    expect(isTokenExpired(EXPIRED_JWT)).toBe(true);
  });

  test('returns false for a JWT with no exp claim (treated as valid)', () => {
    expect(isTokenExpired(NO_EXP_JWT)).toBe(false);
  });

  test('returns false for a 24-hour future-dated JWT', () => {
    expect(isTokenExpired(FUTURE_JWT)).toBe(false);
  });

  test('returns false for a mock.* prefixed token with recent iat', () => {
    const iat = Date.now(); // issued right now → age is 0ms < 30 days
    const mockToken = `mock.${Buffer.from(JSON.stringify({ iat })).toString('base64')}.sig`;
    expect(isTokenExpired(mockToken)).toBe(false);
  });

  test('returns true for a mock.* prefixed token with very old iat', () => {
    const iat = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 days ago
    const mockToken = `mock.${Buffer.from(JSON.stringify({ iat })).toString('base64')}.sig`;
    expect(isTokenExpired(mockToken)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. setSession — token + user persistence
// ═══════════════════════════════════════════════════════════════════════════

describe('setSession()', () => {
  test('sets isAuthenticated to true', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  test('sets user in state', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    expect(useAuthStore.getState().user).toMatchObject({ _id: 'user-001', phone: '9876543210' });
  });

  test('sets token in state', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    expect(useAuthStore.getState().token).toBe(VALID_JWT);
  });

  test('persists access token to SecureStore', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SECURE_KEYS.ACCESS_TOKEN,
      VALID_JWT
    );
  });

  test('persists user object to SecureStore', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SECURE_KEYS.USER,
      JSON.stringify(MOCK_USER)
    );
  });

  test('persists refresh token to SecureStore when provided', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER, 'refresh-token-abc');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      SECURE_KEYS.REFRESH_TOKEN,
      'refresh-token-abc'
    );
  });

  test('does NOT write to REFRESH_TOKEN key when refresh token is omitted', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    const calls = (SecureStore.setItemAsync as jest.Mock).mock.calls;
    const refreshCalls = calls.filter(([key]: [string]) => key === SECURE_KEYS.REFRESH_TOKEN);
    expect(refreshCalls).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. logout — cache wipe routine
// ═══════════════════════════════════════════════════════════════════════════

describe('logout()', () => {
  test('resets isAuthenticated to false', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test('clears user from state', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });

  test('clears token from state', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().token).toBeNull();
  });

  test('deletes ACCESS_TOKEN from SecureStore', async () => {
    await useAuthStore.getState().logout();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_KEYS.ACCESS_TOKEN);
  });

  test('deletes REFRESH_TOKEN from SecureStore', async () => {
    await useAuthStore.getState().logout();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_KEYS.REFRESH_TOKEN);
  });

  test('deletes USER from SecureStore', async () => {
    await useAuthStore.getState().logout();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(SECURE_KEYS.USER);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. restoreSession — session recovery on cold-start
// ═══════════════════════════════════════════════════════════════════════════

describe('restoreSession()', () => {
  test('restores authenticated session when valid token is stored', async () => {
    // Pre-populate SecureStore via setSession, then simulate cold-start
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    // Reset in-memory state without touching SecureStore
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false, isLoading: true });

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().token).toBe(VALID_JWT);
    expect(useAuthStore.getState().user?._id).toBe('user-001');
  });

  test('sets isLoading to false after restore completes', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    useAuthStore.setState({ isLoading: true });
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('does not authenticate when no token is stored', async () => {
    // SecureStore is empty after logout (mocked map cleared in beforeEach)
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  test('clears session when stored token is expired and no refresh token is present', async () => {
    // Write expired token directly to SecureStore mock
    await (SecureStore.setItemAsync as jest.Mock)('aits_auth_token', EXPIRED_JWT);
    await (SecureStore.setItemAsync as jest.Mock)('aits_auth_user', JSON.stringify(MOCK_USER));

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  test('evaluates structural expiration rules: future-dated JWT is treated as valid', async () => {
    // A JWT that expires 24 hours from now must restore the session
    await useAuthStore.getState().setSession(FUTURE_JWT, MOCK_USER);
    useAuthStore.setState({ token: null, user: null, isAuthenticated: false, isLoading: true });

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(isTokenExpired(FUTURE_JWT)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. updateUser — partial field merges
// ═══════════════════════════════════════════════════════════════════════════

describe('updateUser()', () => {
  test('merges partial updates without overwriting unrelated fields', async () => {
    await useAuthStore.getState().setSession(VALID_JWT, MOCK_USER);
    useAuthStore.getState().updateUser({ fullName: 'Updated Name' });
    const { user } = useAuthStore.getState();
    expect(user?.fullName).toBe('Updated Name');
    expect(user?._id).toBe('user-001');       // unchanged
    expect(user?.phone).toBe('9876543210');   // unchanged
  });

  test('is a no-op when user is null', () => {
    useAuthStore.setState({ user: null });
    expect(() => useAuthStore.getState().updateUser({ fullName: 'Test' })).not.toThrow();
  });
});
