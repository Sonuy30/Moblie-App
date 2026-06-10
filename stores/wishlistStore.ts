import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './authStore';
import { getProducts } from '@/api/products';
import {
  getWishlist as fetchWishlistApi,
  addToWishlist as addToWishlistApi,
  removeFromWishlist as removeFromWishlistApi,
} from '@/api/wishlist';
import type { Product } from '@/types/product';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistStore {
  items: WishlistItem[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  syncWishlist: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToWishlist: async (product) => {
        const alreadyIn = get().items.some((i) => i.productId === product._id);
        if (alreadyIn) return;

        const newItem: WishlistItem = {
          productId: product._id,
          addedAt: new Date().toISOString(),
          savedPrice: product.storePrice,
          product,
        };

        set((s) => ({ items: [...s.items, newItem] }));

        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (isAuthenticated) {
          try {
            await addToWishlistApi(product._id);
          } catch (err) {
            console.warn('[WISHLIST STORE] Failed to add to backend wishlist:', err);
          }
        }
      },

      removeFromWishlist: async (productId) => {
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) }));

        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (isAuthenticated) {
          try {
            await removeFromWishlistApi(productId);
          } catch (err) {
            console.warn('[WISHLIST STORE] Failed to remove from backend wishlist:', err);
          }
        }
      },

      isWishlisted: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },

      clearWishlist: () => set({ items: [] }),

      syncWishlist: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        if (!isAuthenticated) return;

        try {
          const backendItems = await fetchWishlistApi();
          if (!backendItems || backendItems.length === 0) {
            // Upload local wishlist to backend if backend is empty
            const localItems = get().items;
            for (const item of localItems) {
              await addToWishlistApi(item.productId).catch(() => {});
            }
            return;
          }

          // Fetch products catalog to match with product details
          const allProductsData = await getProducts({ limit: 100 });
          const allProducts = allProductsData.products || [];

          const mergedItems: WishlistItem[] = [];

          for (const bItem of backendItems) {
            const existing = get().items.find((i) => i.productId === bItem.productId);
            const matchedProduct = allProducts.find((p) => p._id === bItem.productId);

            if (existing) {
              mergedItems.push({
                ...existing,
                savedPrice: bItem.price || existing.savedPrice,
              });
            } else if (matchedProduct) {
              mergedItems.push({
                productId: bItem.productId,
                addedAt: bItem.addedAt || new Date().toISOString(),
                savedPrice: bItem.price || matchedProduct.storePrice,
                product: matchedProduct,
              });
            }
          }

          set({ items: mergedItems });
        } catch (err) {
          console.warn('[WISHLIST STORE] Sync failed:', err);
        }
      },

      toggle: async (productId) => {
        const existing = get().items.find((i) => i.productId === productId);
        if (existing) {
          await get().removeFromWishlist(productId);
        } else {
          const allProductsData = await getProducts({ limit: 100 }).catch(() => ({ products: [] }));
          const matchedProduct = allProductsData.products?.find((p) => p._id === productId);
          if (matchedProduct) {
            await get().addToWishlist(matchedProduct);
          }
        }
      },
    }),
    {
      name: 'aits-wishlist-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
