import client from './client';
import { mockFetchProducts } from './mock';
import { Config } from '@/utils/config';
import type { SearchFilters, SearchResult } from '@/types/search';

// Check if the backend is unreachable (consistent with api/products.ts)
function isBackendMissing(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const errorWithResponse = err as { response?: { data?: { message?: string; error?: string }; status?: number } };
    if (errorWithResponse.response?.data?.message || errorWithResponse.response?.data?.error) {
      return false;
    }
    const status = errorWithResponse.response?.status;
    if (!status || status === 405) return true;
  }
  return false;
}

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
  if (Config.USE_MOCK_API) {
    return mockSearchProducts(query, filters);
  }

  try {
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

    if (isBackendMissing(err)) {
      console.info('[MOCK] searchProducts fallback active');
      return mockSearchProducts(query, filters);
    }
    throw err;
  }
};

/**
 * Local mock implementation for search fallback when offline / no backend.
 */
async function mockSearchProducts(query: string, filters: SearchFilters): Promise<SearchResult> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Retrieve products using mock-fallback from products api (bypassing server completely)
  const response = await mockFetchProducts({ limit: 100 });
  let items = [...response.products];

  // Apply text query search
  if (query) {
    const q = query.toLowerCase();
    items = items.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // Apply categories filter (multi-select)
  if (filters.categories && filters.categories.length > 0) {
    items = items.filter((p) => filters.categories!.includes(p.category));
  }

  // Apply price range filters
  if (filters.minPrice !== undefined) {
    items = items.filter((p) => p.storePrice >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    items = items.filter((p) => p.storePrice <= filters.maxPrice!);
  }

  // Apply average rating filter
  if (filters.rating !== undefined) {
    items = items.filter((p) => p.avgRating >= filters.rating!);
  }

  // Apply sorting options
  const sortBy = filters.sortBy || 'relevance';
  if (sortBy === 'price_asc') {
    items.sort((a, b) => a.storePrice - b.storePrice);
  } else if (sortBy === 'price_desc') {
    items.sort((a, b) => b.storePrice - a.storePrice);
  } else if (sortBy === 'newest') {
    items.sort((a, b) => b._id.localeCompare(a._id));
  } else if (sortBy === 'popularity') {
    items.sort((a, b) => (b.reviewCount * b.avgRating) - (a.reviewCount * a.avgRating));
  }

  // Page calculations
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  const pagedItems = items.slice(start, start + limit);
  const totalPages = Math.ceil(items.length / limit);

  return {
    products: pagedItems,
    total: items.length,
    page,
    totalPages,
  };
}
