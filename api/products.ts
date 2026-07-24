import client from './client';
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
  isSubscribable?: boolean;
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



// Mock Products and Categories for E2E Tests in USE_MOCK_API mode
export const MOCK_PRODUCTS: StoreProduct[] = [
  {
    _id: 'prod-001',
    slug: 'tmt-bar-12mm',
    name: 'TMT Bar 12mm',
    itemCode: 'TMT12',
    storePrice: 1200,
    mrp: 1500,
    discount: 20,
    minOrderQty: 10,
    unit: 'ton',
    images: ['tmt.png'],
    category: 'Steel Bars',
    description: 'High strength structural steel TMT bar 12mm.',
    tags: ['steel', 'bar', 'tmt', 'construction'],
    inStock: true,
    stockQty: 500,
    isFeatured: true,
    avgRating: 4.5,
    reviewCount: 15,
  },
  {
    _id: 'prod-002',
    slug: 'gi-pipe-2-inch',
    name: 'GI Pipe 2 Inch',
    itemCode: 'GI2',
    storePrice: 2400,
    mrp: 2800,
    discount: 14,
    minOrderQty: 5,
    unit: 'piece',
    images: ['gi.png'],
    category: 'Pipes & Tubes',
    description: 'Galvanized iron pipe 2 inch diameter.',
    tags: ['gi', 'pipe', 'tube', 'iron'],
    inStock: true,
    stockQty: 200,
    isFeatured: true,
    avgRating: 4.2,
    reviewCount: 8,
  },
  {
    _id: 'prod-003',
    slug: 'binding-wire-1kg',
    name: 'Binding Wire 1kg',
    itemCode: 'BW1',
    storePrice: 85,
    mrp: 100,
    discount: 15,
    minOrderQty: 20,
    unit: 'kg',
    images: ['wire.png'],
    category: 'Wire & Mesh',
    description: 'Flexible binding wire for rebar construction.',
    tags: ['wire', 'binding', 'steel'],
    inStock: true,
    stockQty: 1000,
    isFeatured: false,
    avgRating: 4.0,
    reviewCount: 3,
  }
];

export const MOCK_CATEGORIES: Category[] = [
  { name: 'Steel Bars', icon: 'cube-outline' },
  { name: 'Pipes & Tubes', icon: 'git-network-outline' },
  { name: 'Wire & Mesh', icon: 'grid-outline' }
];

import { useAuthStore } from '@/stores/authStore';

export function getCompanySlug(): string {
  const user = useAuthStore.getState().user;
  if (user?.companySlug) return user.companySlug;
  return Config.COMPANY_SLUG || 'ever';
}

// ──────────────────────────────────────────────────────────
// Fetch product list (paginated, filtered)
// ──────────────────────────────────────────────────────────
export const fetchProducts = async (params?: ProductFilters): Promise<ProductListResponse> => {
  if (Config.USE_MOCK_API) {
    return {
      products: MOCK_PRODUCTS,
      total: MOCK_PRODUCTS.length,
      page: 1,
      totalPages: 1
    };
  }

  const COMPANY_SLUG = getCompanySlug();
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
  if (Config.USE_MOCK_API) {
    const found = MOCK_PRODUCTS.find(p => p.slug === slug);
    if (!found) throw new Error('Product not found');
    return found;
  }

  const COMPANY_SLUG = getCompanySlug();
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

export interface Category {
  name: string;
  icon: string;
}

// ──────────────────────────────────────────────────────────
// Fetch category list
// ──────────────────────────────────────────────────────────
export const fetchCategories = async (): Promise<Category[]> => {
  if (Config.USE_MOCK_API) {
    return MOCK_CATEGORIES;
  }

  const COMPANY_SLUG = getCompanySlug();
  const { data } = await client.get<unknown>('/api/mobile/categories', {
    params: { companySlug: COMPANY_SLUG },
  });
  
  let categories: Category[] = [];
  if (data && typeof data === 'object') {
    const obj = data as { categories?: unknown };
    if (Array.isArray(obj.categories)) {
      categories = obj.categories as Category[];
    } else if (Array.isArray(data)) {
      categories = data as Category[];
    }
  }
  return categories;
};

// Aliases used by hooks/useProducts.ts
export const getProducts = fetchProducts;
export const getProductBySlug = fetchProductBySlug;
export const getCategories = fetchCategories;

