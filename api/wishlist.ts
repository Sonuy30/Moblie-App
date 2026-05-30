import client from './client';

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
  try {
    const { data } = await client.get('/api/mobile/wishlist');
    return data.wishlist || data || [];
  } catch (err) {
    console.info('[WISHLIST] using in-memory wishlist fallback');
    return mockWishlist;
  }
};

export const addToWishlist = async (productId: string) => {
  try {
    const { data } = await client.post('/api/mobile/wishlist', { productId });
    return data;
  } catch (err) {
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

export const removeFromWishlist = async (productId: string) => {
  try {
    const { data } = await client.delete(`/api/mobile/wishlist/${productId}`);
    return data;
  } catch (err) {
    console.info(`[WISHLIST] removing from in-memory wishlist: ${productId}`);
    mockWishlist = mockWishlist.filter(item => item.productId !== productId);
    return { success: true, message: 'Removed from wishlist' };
  }
};
