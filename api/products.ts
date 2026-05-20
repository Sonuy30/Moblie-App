import client from './client';

export interface StoreProduct {
  _id: string;
  slug: string;
  name: string;
  itemCode: string;
  storePrice: number;
  mrp?: number;
  discount?: number;
  minOrderQty: number;
  unit: string;           // kg, pcs, litre, bags
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
}

// Filter params type used by hooks and screens
export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  featured?: boolean;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

// Response type
export interface ProductListResponse {
  products: StoreProduct[];
  total: number;
  page: number;
  totalPages: number;
}

// companyId is NOT passed from app — backend gets it from JWT
export const fetchProducts = async (params?: ProductFilters): Promise<ProductListResponse> => {
  const { data } = await client.get('/api/store/products', { params });
  // Compute totalPages if backend doesn't provide it
  const limit = params?.limit || 20;
  const totalPages = data.totalPages || Math.ceil((data.total || 0) / limit);
  return { ...data, totalPages };
};

export const fetchProductBySlug = async (slug: string): Promise<StoreProduct> => {
  const { data } = await client.get(`/api/store/products/${slug}`);
  return (data.product || data) as StoreProduct;
};

export const fetchCategories = async () => {
  const { data } = await client.get('/api/store/categories');
  return data as string[];
};

// Aliases used by hooks/useProducts.ts
export const getProducts = fetchProducts;
export const getProductBySlug = fetchProductBySlug;
export const getCategories = fetchCategories;
