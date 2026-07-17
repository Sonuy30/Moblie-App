/**
 * stores/recentlyViewedStore.ts
 *
 * Keeps a capped list (max 10) of recently viewed products,
 * persisted to AsyncStorage via zustand/middleware.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentProduct {
  _id: string;
  slug: string;
  name: string;
  image: string;
  storePrice: number;
  unit: string;
  inStock: boolean;
}

const MAX_RECENT = 10;

interface RecentlyViewedState {
  items: RecentProduct[];
  addProduct: (product: RecentProduct) => void;
  clearAll: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      items: [],

      addProduct: (product) =>
        set((state) => {
          // Remove existing entry for same product (to re-insert at front)
          const filtered = state.items.filter((p) => p._id !== product._id);
          // Prepend and cap at MAX_RECENT
          const next = [product, ...filtered].slice(0, MAX_RECENT);
          return { items: next };
        }),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: 'aits_recently_viewed',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
