/**
 * jest-setup.ts — Global Jest setup
 *
 * Runs before each test file. Mocks modules that are not available
 * in a Node.js environment (native modules, Expo SDK, etc.)
 */

// ── React Native Globals ───────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).__DEV__ = true;

// ── Environment Variables for Testing ──────────────────────────────────────
process.env.EXPO_PUBLIC_API_URL       = 'http://test-api.aits.local:3000';
process.env.EXPO_PUBLIC_API_TIMEOUT   = '10000';
process.env.EXPO_PUBLIC_COMPANY_SLUG  = 'test-company';
process.env.EXPO_PUBLIC_COMPANY_NAME  = 'Test Company Ltd';
process.env.EXPO_PUBLIC_RAZORPAY_KEY  = 'rzp_test_12345';
process.env.EXPO_PUBLIC_USE_MOCK_API  = 'false';
process.env.EXPO_PUBLIC_WS_URL        = 'ws://test-ws.aits.local:3001';

// ── expo-secure-store: in-memory Map replacement ───────────────────────────
const mockSecureStore = new Map<string, string>();

jest.mock('expo-secure-store', () => ({
  setItemAsync:    jest.fn((k: string, v: string) => { mockSecureStore.set(k, v); return Promise.resolve(); }),
  getItemAsync:    jest.fn((k: string) => Promise.resolve(mockSecureStore.get(k) ?? null)),
  deleteItemAsync: jest.fn((k: string) => { mockSecureStore.delete(k); return Promise.resolve(); }),
}));

// ── expo-constants: minimal stub ───────────────────────────────────────────
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name:    'AITS Shop (Test)',
      slug:    'aits-shop',
      version: '1.0.0',
      extra:   {},
    },
  },
}));

// ── @sentry/react-native: no-op stub ──────────────────────────────────────
jest.mock('@sentry/react-native', () => ({
  init:                    jest.fn(),
  captureException:        jest.fn(),
  captureMessage:          jest.fn(),
  setUser:                 jest.fn(),
  setTag:                  jest.fn(),
  withScope:               jest.fn((cb: (s: { setExtra: jest.Mock }) => void) => cb({ setExtra: jest.fn() })),
  withErrorBoundary:       jest.fn((C: unknown) => C),
  mobileReplayIntegration: jest.fn(() => ({})),
}));

// ── expo-router: navigation stub ─────────────────────────────────────────
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
  useRouter:   () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
  usePathname: () => '/',
}));

// ── Silence console.log/info in tests ─────────────────────────────────────
// Keep warn + error visible (they indicate real problems during testing).
global.console = {
  ...console,
  log:  jest.fn(),
  info: jest.fn(),
};

// ── Clear in-memory secure store before each test ─────────────────────────
beforeEach(() => {
  mockSecureStore.clear();
});
