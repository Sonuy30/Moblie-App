import client from './client';
import { StoreProduct } from './products';

export const getWishlist = async (): Promise<StoreProduct[]> => {
  const { data } = await client.get('/api/store/wishlist');
  return data.wishlist || data || [];
};

export const addToWishlist = async (productId: string) => {
  const { data } = await client.post('/api/store/wishlist', { productId });
  return data;
};

export const removeFromWishlist = async (productId: string) => {
  const { data } = await client.delete(`/api/store/wishlist/${productId}`);
  return data;
};
