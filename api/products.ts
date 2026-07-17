import client from './client';

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
  description?: string;
  specifications?: { key: string; value: string }[];
  color?: string;
  size?: string;
  /** Raw ERP attribute map — e.g. { "Size": "10mm", "Grade": "Fe500D" } */
  attributes?: Record<string, string> | Map<string, string>;
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



// ──────────────────────────────────────────────────────────
// Fetch product list (paginated, filtered)
// ──────────────────────────────────────────────────────────
export const fetchProducts = async (params?: ProductFilters): Promise<ProductListResponse> => {
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
};

// ──────────────────────────────────────────────────────────
// Fetch single product by slug
// ──────────────────────────────────────────────────────────
export const fetchProductBySlug = async (slug: string): Promise<StoreProduct> => {
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
};

// ──────────────────────────────────────────────────────────
// Fetch category list
// ──────────────────────────────────────────────────────────
export const fetchCategories = async (): Promise<string[]> => {
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
};

// Aliases used by hooks/useProducts.ts
export const getProducts = fetchProducts;
export const getProductBySlug = fetchProductBySlug;
export const getCategories = fetchCategories;
