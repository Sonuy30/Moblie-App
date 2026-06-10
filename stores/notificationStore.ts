/**
 * stores/notificationStore.ts
 *
 * Manages per-category push notification preferences for the user.
 * Preferences are persisted in AsyncStorage so they survive app restarts.
 *
 * Categories align 1-to-1 with the notification types handled in
 * services/notifications.ts — add a new type here AND there.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'aits_notification_prefs';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Every supported push notification category. */
export type NotificationCategory =
  | 'ORDER_UPDATE'
  | 'PRICE_DROP'
  | 'FLASH_SALE'
  | 'PROMO';

/** One entry per category: enabled/disabled. */
export type NotificationPreferences = Record<NotificationCategory, boolean>;

/** Human-readable metadata for each category (used in the Settings UI). */
export interface NotificationCategoryMeta {
  category: NotificationCategory;
  label: string;
  description: string;
  icon: string;
}

export const NOTIFICATION_CATEGORY_META: NotificationCategoryMeta[] = [
  {
    category: 'ORDER_UPDATE',
    label: 'Order Updates',
    description: 'Shipping, delivery, and order status changes',
    icon: 'cube-outline',
  },
  {
    category: 'PRICE_DROP',
    label: 'Price Drops',
    description: 'When items you viewed drop in price',
    icon: 'trending-down-outline',
  },
  {
    category: 'FLASH_SALE',
    label: 'Flash Sales',
    description: 'Limited-time deals and lightning offers',
    icon: 'flash-outline',
  },
  {
    category: 'PROMO',
    label: 'Promotions',
    description: 'Coupons, discounts, and exclusive offers',
    icon: 'pricetag-outline',
  },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  ORDER_UPDATE: true,  // critical — on by default
  PRICE_DROP:   true,
  FLASH_SALE:   true,
  PROMO:        false, // marketing — off by default (respect privacy)
};

// ── Store interface ───────────────────────────────────────────────────────────

interface NotificationStore {
  preferences: NotificationPreferences;
  isLoaded: boolean;

  /** Call once on app start to hydrate preferences from AsyncStorage. */
  loadPreferences: () => Promise<void>;

  /** Toggle a single category on/off and persist immediately. */
  toggleCategory: (category: NotificationCategory) => Promise<void>;

  /** Set all categories at once (e.g. "mute all"). */
  setAllPreferences: (prefs: NotificationPreferences) => Promise<void>;

  /** Returns true if the given notification category is enabled. */
  isCategoryEnabled: (category: NotificationCategory) => boolean;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  isLoaded: false,

  // ── loadPreferences ──────────────────────────────────────────────────────
  loadPreferences: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<NotificationPreferences>;
        // Merge with defaults so new categories are enabled by default
        set({
          preferences: { ...DEFAULT_PREFERENCES, ...saved },
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (e) {
      console.warn('[NotificationStore] Failed to load preferences:', e);
      set({ isLoaded: true });
    }
  },

  // ── toggleCategory ───────────────────────────────────────────────────────
  toggleCategory: async (category) => {
    const current = get().preferences;
    const updated: NotificationPreferences = {
      ...current,
      [category]: !current[category],
    };
    set({ preferences: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[NotificationStore] Failed to persist toggle:', e);
    }
  },

  // ── setAllPreferences ────────────────────────────────────────────────────
  setAllPreferences: async (prefs) => {
    set({ preferences: prefs });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('[NotificationStore] Failed to persist all prefs:', e);
    }
  },

  // ── isCategoryEnabled ────────────────────────────────────────────────────
  isCategoryEnabled: (category) => get().preferences[category],
}));
