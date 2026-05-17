import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WishlistStore {
  ids: string[];
  isWishlisted: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],

      isWishlisted: (id) => get().ids.includes(id),

      toggle: (id) => {
        if (get().ids.includes(id)) {
          set((s) => ({ ids: s.ids.filter((i) => i !== id) }));
        } else {
          set((s) => ({ ids: [...s.ids, id] }));
        }
      },

      add: (id) => {
        if (!get().ids.includes(id)) {
          set((s) => ({ ids: [...s.ids, id] }));
        }
      },

      remove: (id) => set((s) => ({ ids: s.ids.filter((i) => i !== id) })),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'aits-wishlist',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
