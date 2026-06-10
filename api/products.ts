import client from './client';
import { mockFetchProducts, mockFetchProductBySlug, mockFetchCategories } from './mock';
import { Config } from '@/utils/config';

// ──────────────────────────────────────────────────────────
// Product Variant — a single selectable option for a product
// (e.g. "10mm", "40×40 mm", "2mm thickness", "Medium Grade")
// ──────────────────────────────────────────────────────────
export interface ProductVariant {
  _id: string;
  label: string;          // display text e.g. "10mm", "40×40"
  sku?: string;
  storePrice: number;
  mrp?: number;
  discount?: number;
  stockQty: number;
  inStock: boolean;
  weightPerPiece?: number;
  itemCode?: string;
  images?: string[];      // optional variant-specific images
  specifications?: { key: string; value: string }[];
}

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
  // ── Variant support ──
  variants?: ProductVariant[];
  variantType?: string;   // axis label e.g. "Size", "Diameter", "Grade"
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

/**
 * Determine whether the backend is unreachable (trigger mock fallback)
 * vs. the backend returned a real structured error (propagate to user).
 *
 * Only fallback to mock when:
 *  • No HTTP response at all (server down / wrong IP / network error)
 *  • 405 Method Not Allowed (endpoint not implemented)
 *
 * DO NOT fallback for:
 *  • 401 / 403 — auth errors should surface to the user
 *  • 404 — "Company not found" or "Product not found" are real errors
 *  • 500 — server crash, should surface to user
 */
function isBackendMissing(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return true;
  }
  const e = err as { response?: { data?: { message?: unknown; error?: unknown }; status?: number } };
  if (e.response?.data?.message || e.response?.data?.error) {
    return false;
  }
  const status = e.response?.status;
  if (!status || status === 405) return true;
  return false;
}

// ──────────────────────────────────────────────────────────
// Fetch product list (paginated, filtered)
// ──────────────────────────────────────────────────────────
export const fetchProducts = async (params?: ProductFilters): Promise<ProductListResponse> => {
  if (Config.USE_MOCK_API) {
    return mockFetchProducts(params);
  }

  try {
    const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
    const { data } = await client.get<unknown>('/api/mobile/items', {
      params: { ...params, companySlug: COMPANY_SLUG },
    });
    
    let totalPages = 1;
    let total = 0;
    let products: StoreProduct[] = [];
    let page = 1;

    if (data && typeof data === 'object') {
      const obj = data as {
        totalPages?: number;
        total?: number;
        products?: unknown;
        items?: unknown;
        data?: unknown;
        page?: number;
      };
      
      const limit = params?.limit || 20;
      const rawProducts = obj.products || obj.items || obj.data || [];
      if (Array.isArray(rawProducts)) {
        products = rawProducts as StoreProduct[];
      }
      
      total = obj.total || products.length;
      totalPages = obj.totalPages || Math.ceil(total / limit);
      page = obj.page || 1;
    }

    return { products, total, page, totalPages };
  } catch (err) {
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
  if (Config.USE_MOCK_API) {
    return mockFetchProductBySlug(slug);
  }

  try {
    const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
    const { data } = await client.get<unknown>(`/api/mobile/items/${slug}`, {
      params: { companySlug: COMPANY_SLUG },
    });
    
    let product: StoreProduct | null = null;
    if (data && typeof data === 'object') {
      const obj = data as { product?: unknown; item?: unknown };
      const rawProduct = obj.product || obj.item || data;
      if (rawProduct) {
        product = rawProduct as StoreProduct;
      }
    }
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  } catch (err) {
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
  if (Config.USE_MOCK_API) {
    return mockFetchCategories();
  }

  try {
    const COMPANY_SLUG = process.env.EXPO_PUBLIC_COMPANY_SLUG || 'sudama01';
    const { data } = await client.get<unknown>('/api/mobile/categories', {
      params: { companySlug: COMPANY_SLUG },
    });
    
    let categories: string[] = [];
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        categories = data as string[];
      } else {
        const obj = data as { categories?: unknown };
        if (Array.isArray(obj.categories)) {
          categories = obj.categories as string[];
        }
      }
    }
    return categories;
  } catch (err) {
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
