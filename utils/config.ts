/**
 * utils/config.ts — Centralised, type-safe environment configuration
 *
 * Rules:
 *  1. All env vars are accessed here — nowhere else in the app.
 *  2. Required vars throw a descriptive error at startup (not at the call site).
 *  3. expo-constants is used so the values work across Expo Go, dev builds,
 *     and production APK/IPA without any platform-specific workaround.
 *  4. Every export is `as const` to prevent accidental mutation.
 *
 * Usage:
 *   import { Config } from '@/utils/config';
 *   console.log(Config.API_URL);
 */

import Constants from 'expo-constants';

// ── Type for all recognised environment variables ──────────────────────────
interface EnvVars {
  EXPO_PUBLIC_API_URL: string;
  EXPO_PUBLIC_API_TIMEOUT: string;
  EXPO_PUBLIC_COMPANY_SLUG: string;
  EXPO_PUBLIC_COMPANY_NAME: string;
  EXPO_PUBLIC_RAZORPAY_KEY: string;
  EXPO_PUBLIC_USE_MOCK_API: string;
  EXPO_PUBLIC_WS_URL: string;
  EXPO_PUBLIC_COMPANY_TAGLINE: string;
}

// ── Internal env accessor (Expo SDK 54 compatible) ─────────────────────────
// In SDK 54, EXPO_PUBLIC_* vars are available on both:
//   • process.env (Metro bundler inlines them at build time)
//   • Constants.expoConfig?.extra (via app.config.js `extra` field)
// We prefer process.env because it works without modifying app.config.js.
function getEnv(key: keyof EnvVars): string | undefined {
  // Primary: Metro-inlined process.env (works in Expo Go + bare workflow)
  // We must access these statically (literal property access) so the Metro bundler
  // can replace them with string literals during production bundling.
  let fromProcess: string | undefined;
  switch (key) {
    case 'EXPO_PUBLIC_API_URL':
      fromProcess = process.env.EXPO_PUBLIC_API_URL;
      break;
    case 'EXPO_PUBLIC_API_TIMEOUT':
      fromProcess = process.env.EXPO_PUBLIC_API_TIMEOUT;
      break;
    case 'EXPO_PUBLIC_COMPANY_SLUG':
      fromProcess = process.env.EXPO_PUBLIC_COMPANY_SLUG;
      break;
    case 'EXPO_PUBLIC_COMPANY_NAME':
      fromProcess = process.env.EXPO_PUBLIC_COMPANY_NAME;
      break;
    case 'EXPO_PUBLIC_RAZORPAY_KEY':
      fromProcess = process.env.EXPO_PUBLIC_RAZORPAY_KEY;
      break;
    case 'EXPO_PUBLIC_USE_MOCK_API':
      fromProcess = process.env.EXPO_PUBLIC_USE_MOCK_API;
      break;
    case 'EXPO_PUBLIC_WS_URL':
      fromProcess = process.env.EXPO_PUBLIC_WS_URL;
      break;
    case 'EXPO_PUBLIC_COMPANY_TAGLINE':
      fromProcess = process.env.EXPO_PUBLIC_COMPANY_TAGLINE;
      break;
  }
  if (fromProcess) return fromProcess;

  // Fallback: Constants.expoConfig?.extra (useful in EAS builds with app.config.js)
  const extra = Constants.expoConfig?.extra;
  const val: unknown = extra?.[key];
  return typeof val === 'string' ? val : undefined;
}

// ── Runtime validation ─────────────────────────────────────────────────────

// ── Required variables — app will not start without these ─────────────────
const REQUIRED_VARS = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_COMPANY_SLUG',
 ] as const satisfies ReadonlyArray<keyof EnvVars>;

// Export the list of missing required variables so it can be handled in UI
export const MISSING_ENV_VARS = REQUIRED_VARS.filter((key) => {
  const val = getEnv(key);
  return !val || val.trim() === '';
});

// ── Typed Config object ────────────────────────────────────────────────────
/**
 * Single source of truth for all runtime configuration.
 * Import this anywhere in the app — never read process.env directly.
 *
 * @example
 *   import { Config } from '@/utils/config';
 *   const client = axios.create({ baseURL: Config.API_URL });
 */
export const Config = {
  // API
  /** Backend base URL. Pulled from EXPO_PUBLIC_API_URL. */
  API_URL: (() => {
    const raw = getEnv('EXPO_PUBLIC_API_URL') || 'http://localhost:3000';
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:3000';
    }
    return raw;
  })(),

  /** Request timeout in milliseconds. Defaults to 15 000 ms (15 s). */
  API_TIMEOUT: parseInt(getEnv('EXPO_PUBLIC_API_TIMEOUT') ?? '15000', 10),

  // Company / Tenant
  /** ERP tenant slug — sent in pre-login request bodies. */
  COMPANY_SLUG: getEnv('EXPO_PUBLIC_COMPANY_SLUG') as string,

  /** Human-readable company name for UI display. */
  COMPANY_NAME: getEnv('EXPO_PUBLIC_COMPANY_NAME') ?? 'AITS Shop',

  /** Tagline for splash/marketing. Pulled from EXPO_PUBLIC_COMPANY_TAGLINE. */
  COMPANY_TAGLINE: getEnv('EXPO_PUBLIC_COMPANY_TAGLINE') ?? 'Shop with confidence',

  // Payments
  /** Razorpay publishable key. Use rzp_test_* in dev, rzp_live_* in prod. */
  RAZORPAY_KEY: getEnv('EXPO_PUBLIC_RAZORPAY_KEY') ?? '',

  // Feature Flags
  /**
   * When true, all API calls return local mock data instead of hitting the server.
   * Useful for UI development without a running backend.
   */
  USE_MOCK_API: getEnv('EXPO_PUBLIC_USE_MOCK_API') === 'true',

  // Future: AITS Delivery Module
  /**
   * WebSocket server URL for real-time order tracking.
   * Used by the AITS Delivery module (driver tracking, ETA updates).
   */
  WS_URL: getEnv('EXPO_PUBLIC_WS_URL') ?? '',

  // App-wide business constants (not env-specific but centralised here)
  GST_RATE: 0.18,
  FREE_DELIVERY_THRESHOLD: 999,   // INR — free delivery above this
  DELIVERY_CHARGE: 99,            // INR — flat delivery fee below threshold
  ITEMS_PER_PAGE: 20,
} as const;

// ── Named type export ──────────────────────────────────────────────────────
export type AppConfig = typeof Config;

// ── Dev-mode diagnostic log ────────────────────────────────────────────────
if (__DEV__) {
  console.info(
    '[Config] Loaded environment:',
    JSON.stringify(
      {
        API_URL: Config.API_URL,
        API_TIMEOUT: Config.API_TIMEOUT,
        COMPANY_SLUG: Config.COMPANY_SLUG,
        COMPANY_NAME: Config.COMPANY_NAME,
        USE_MOCK_API: Config.USE_MOCK_API,
        WS_URL: Config.WS_URL,
        // ⚠️ RAZORPAY_KEY intentionally omitted from logs
      },
      null,
      2
    )
  );
}
