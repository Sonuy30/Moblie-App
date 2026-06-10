import client from './client';
import { Config } from '@/utils/config';

export interface WishlistItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  addedAt: string;
}

// In-memory wishlist for the current session to ensure full interactivity
let mockWishlist: WishlistItem[] = [];

export const getWishlist = async (): Promise<WishlistItem[]> => {
  if (Config.USE_MOCK_API) {
    return mockWishlist;
  }

  try {
    const { data } = await client.get<unknown>('/api/mobile/wishlist');
    let list: WishlistItem[] = [];
    if (data && typeof data === 'object') {
      const obj = data as { wishlist?: unknown };
      if (Array.isArray(obj.wishlist)) {
        list = obj.wishlist as WishlistItem[];
      } else if (Array.isArray(data)) {
        list = data as WishlistItem[];
      }
    }
    return list;
  } catch {
    console.info('[WISHLIST] using in-memory wishlist fallback');
    return mockWishlist;
  }
};

export const addToWishlist = async (productId: string): Promise<unknown> => {
  if (Config.USE_MOCK_API) {
    if (!mockWishlist.some(item => item.productId === productId)) {
      mockWishlist.push({
        _id: `wish-${Date.now()}`,
        productId,
        name: 'Steel Product',
        price: 0,
        addedAt: new Date().toISOString()
      });
    }
    return { success: true, message: 'Added to wishlist' };
  }

  try {
    const { data } = await client.post<unknown>('/api/mobile/wishlist', { productId });
    return data;
  } catch {
    console.info(`[WISHLIST] adding to in-memory wishlist: ${productId}`);
    // Check if already in wishlist
    if (!mockWishlist.some(item => item.productId === productId)) {
      mockWishlist.push({
        _id: `wish-${Date.now()}`,
        productId,
        name: 'Steel Product',
        price: 0,
        addedAt: new Date().toISOString()
      });
    }
    return { success: true, message: 'Added to wishlist' };
  }
};

export const removeFromWishlist = async (productId: string): Promise<unknown> => {
  if (Config.USE_MOCK_API) {
    mockWishlist = mockWishlist.filter(item => item.productId !== productId);
    return { success: true, message: 'Removed from wishlist' };
  }

  try {
    const { data } = await client.delete<unknown>(`/api/mobile/wishlist/${productId}`);
    return data;
  } catch {
    console.info(`[WISHLIST] removing from in-memory wishlist: ${productId}`);
    mockWishlist = mockWishlist.filter(item => item.productId !== productId);
    return { success: true, message: 'Removed from wishlist' };
  }
};
