import client from './client';
import { mockFetchProducts, mockFetchProductBySlug, mockFetchCategories } from './mock';

export interface StoreProduct {
  _id: string;
  slug: string;
  name: string;
  itemCode: string;
  storePrice: number;
  mrp?: number;
  discount?: number;
  minOrderQty: number;
  unit: string;
  images: string[];
  category: string;
  description: string;
  tags: string[];
  inStock: boolean;
  stockQty: number;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  specifications?: { key: string; value: string }[];
  relatedProducts?: StoreProduct[];
  weightPerPiece?: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export interface ProductListResponse {
  products: StoreProduct[];
  total: number;
  page: number;
  totalPages: number;
}

function isBackendMissing(err: any): boolean {
  // No response at all = network error / CORS / server down
  if (!err?.response) return true;
  const status = err.response.status;
  
  // If the company is explicitly not found in the DB, it is a configuration error,
  // not a missing API endpoint, so we should NOT silently fall back to mocks.
  if (status === 404 && err.response.data?.message === "Company not found") {
    return false;
  }

  // 401 / 403: backend requires auth even for product browsing → use mock
  // 404: endpoint not found → use mock
  // 405: method not allowed → use mock
  return status === 401 || status === 403 || status === 404 || status === 405;
}

// ──────────────────────────────────────────────────────────
// Fetch product list (paginated, filtered)
// ──────────────────────────────────────────────────────────
export const fetchProducts = async (params?: ProductFilters): Promise<ProductListResponse> => {
  try {
    const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
    const { data } = await client.get('/api/mobile/items', {
      params: { ...params, companySlug: COMPANY_SLUG },
    });
    const limit = params?.limit || 20;
    const totalPages = data.totalPages || Math.ceil((data.total || 0) / limit);

    // Normalize different backend shapes
    const products = data.products || data.items || data.data || [];
    return { products, total: data.total || products.length, page: data.page || 1, totalPages };
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] fetchProducts fallback active');
      return mockFetchProducts(params);
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────
// Fetch single product by slug
// ──────────────────────────────────────────────────────────
export const fetchProductBySlug = async (slug: string): Promise<StoreProduct> => {
  try {
    const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
    const { data } = await client.get(`/api/mobile/items/${slug}`, {
      params: { companySlug: COMPANY_SLUG },
    });
    return (data.product || data.item || data) as StoreProduct;
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] fetchProductBySlug fallback active');
      return mockFetchProductBySlug(slug);
    }
    throw err;
  }
};

// ──────────────────────────────────────────────────────────
// Fetch category list
// ──────────────────────────────────────────────────────────
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
    const { data } = await client.get('/api/mobile/categories', {
      params: { companySlug: COMPANY_SLUG },
    });
    return (Array.isArray(data) ? data : data.categories || []) as string[];
  } catch (err: any) {
    if (isBackendMissing(err)) {
      console.info('[MOCK] fetchCategories fallback active');
      return mockFetchCategories();
    }
    throw err;
  }
};

// Aliases used by hooks/useProducts.ts
export const getProducts = fetchProducts;
export const getProductBySlug = fetchProductBySlug;
export const getCategories = fetchCategories;
