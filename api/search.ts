import client from './client';
import type { SearchFilters, SearchResult } from '@/types/search';
import type { StoreProduct } from './products';
import { Config } from '@/utils/config';
import { MOCK_PRODUCTS } from './products';
import { useAuthStore } from '@/stores/authStore';

export const searchProducts = async (
  query: string,
  filters: SearchFilters,
  signal?: AbortSignal
): Promise<SearchResult> => {
  if (Config.USE_MOCK_API) {
    let filtered = [...MOCK_PRODUCTS];
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(p => filters.categories?.includes(p.category));
    }
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => p.storePrice >= (filters.minPrice || 0));
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.storePrice <= (filters.maxPrice || Infinity));
    }
    if (filters.rating !== undefined) {
      filtered = filtered.filter(p => p.avgRating >= (filters.rating || 0));
    }
    if (filters.sortBy === 'price_asc') {
      filtered.sort((a, b) => a.storePrice - b.storePrice);
    } else if (filters.sortBy === 'price_desc') {
      filtered.sort((a, b) => b.storePrice - a.storePrice);
    }
    return {
      products: filtered,
      total: filtered.length,
      page: 1,
      totalPages: 1
    };
  }

  const COMPANY_SLUG = useAuthStore.getState().user?.companySlug || Config.COMPANY_SLUG || 'ever';

  // Map filters to API query parameters
  const params: Record<string, string | number | boolean | undefined> = {
    companySlug: COMPANY_SLUG,
    search: query || undefined,
    minPrice: filters.minPrice || undefined,
    maxPrice: filters.maxPrice || undefined,
    rating: filters.rating || undefined,
    sort: filters.sortBy === 'relevance' ? undefined : filters.sortBy,
    page: filters.page || 1,
    limit: filters.limit || 20,
  };

  if (filters.categories && filters.categories.length > 0) {
    params.categories = filters.categories.join(',');
  }

  try {
    const { data } = await client.get<{
      products?: StoreProduct[];
      items?: StoreProduct[];
      data?: StoreProduct[];
      total?: number;
      page?: number;
      totalPages?: number;
    }>('/api/mobile/items', {
      params,
      signal,
    });

    const products = data.products || data.items || data.data || [];
    const total = data.total || products.length;
    const page = data.page || 1;
    const limit = filters.limit || 20;
    const totalPages = data.totalPages || Math.ceil(total / limit);

    return { products, total, page, totalPages };
  } catch (err: unknown) {
    // If the call was explicitly aborted, propagate the cancellation error
    if (err && typeof err === 'object') {
      const errorWithName = err as { name?: string };
      if (errorWithName.name === 'CanceledError' || errorWithName.name === 'AbortError') {
        throw err;
      }
    }
    throw err;
  }
};


