import type { StoreProduct } from '@/api/products';

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popularity';

export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  categories?: string[];
  rating?: number;
  sortBy?: SortOption;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: StoreProduct[];
  total: number;
  page: number;
  totalPages: number;
}
