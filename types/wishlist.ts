import type { Product } from './product';

export interface WishlistItem {
  productId: string;
  addedAt: string;
  savedPrice: number;
  product: Product;
}
