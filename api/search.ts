import client from './client';
import type { SearchFilters, SearchResult } from '@/types/search';



/**
 * Searches and filters products from the AITS backend.
 * Aborts the request using the passed signal if a new search keystroke occurs.
 */
import type { StoreProduct } from './products';

export const searchProducts = async (
  query: string,
  filters: SearchFilters,
  signal?: AbortSignal
): Promise<SearchResult> => {
  const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';

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


