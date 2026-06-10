/**
 * constants/config.ts
 *
 * ⚠️  This file is kept for backward compatibility only.
 *    New code should import directly from '@/utils/config'.
 *
 *    import { Config } from '@/utils/config';
 */

// Re-export everything from the canonical config module
export { Config, type AppConfig } from '@/utils/config';

// Legacy named exports — kept so existing imports don't break
import { Config } from '@/utils/config';

/** @deprecated Import Config.API_URL from '@/utils/config' instead */
export const API_BASE_URL = Config.API_URL;

/** @deprecated Import Config.RAZORPAY_KEY from '@/utils/config' instead */
export const RAZORPAY_KEY = Config.RAZORPAY_KEY;

/** @deprecated Import Config.GST_RATE from '@/utils/config' instead */
export const GST_RATE = Config.GST_RATE;

/** @deprecated Import Config.FREE_DELIVERY_THRESHOLD from '@/utils/config' instead */
export const FREE_DELIVERY_THRESHOLD = Config.FREE_DELIVERY_THRESHOLD;

/** @deprecated Import Config.DELIVERY_CHARGE from '@/utils/config' instead */
export const DELIVERY_CHARGE = Config.DELIVERY_CHARGE;

/** @deprecated Import Config.ITEMS_PER_PAGE from '@/utils/config' instead */
export const ITEMS_PER_PAGE = Config.ITEMS_PER_PAGE;

// Layout / spacing tokens — not env-specific, stay here
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;
