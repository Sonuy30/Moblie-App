import client from './client';

export interface StoreProduct {
  _id: string;
  slug: string;
  name: string;
  itemCode: string;
  storePrice: number;
  mrp: number;
  discount: number;
  images: string[];
  category: string;
  description: string;
  tags: string[];
  inStock: boolean;
  stockQty: number;
  avgRating: number;
  reviewCount: number;
  specifications: { key: string; value: string }[];
  relatedProducts: StoreProduct[];
}

export interface ProductListResponse {
  products: StoreProduct[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  featured?: boolean;
}

const DUMMY_PRODUCTS: StoreProduct[] = [
  {
    _id: 'prod_1',
    slug: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    itemCode: 'APL-IP15P',
    storePrice: 999,
    mrp: 1099,
    discount: 10,
    images: ['https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80'],
    category: 'Electronics',
    description: 'The latest iPhone 15 Pro with a sleek aerospace-grade titanium design, A17 Pro chip for next-level gaming, and a powerful pro camera system.',
    tags: ['apple', 'smartphone'],
    inStock: true,
    stockQty: 50,
    avgRating: 4.8,
    reviewCount: 120,
    specifications: [{ key: 'Color', value: 'Natural Titanium' }],
    relatedProducts: [],
  },
  {
    _id: 'prod_2',
    slug: 'macbook-pro-m3',
    name: 'MacBook Pro 14" M3',
    itemCode: 'APL-MBPM3',
    storePrice: 1599,
    mrp: 1699,
    discount: 5,
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80'],
    category: 'Computers',
    description: 'Supercharged by the M3 Pro and M3 Max chips, featuring a brilliant Liquid Retina XDR display and exceptional battery life for pro workflows.',
    tags: ['apple', 'laptop'],
    inStock: true,
    stockQty: 25,
    avgRating: 4.9,
    reviewCount: 85,
    specifications: [{ key: 'RAM', value: '18GB' }],
    relatedProducts: [],
  },
  {
    _id: 'prod_3',
    slug: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5',
    itemCode: 'SNY-WH5',
    storePrice: 348,
    mrp: 398,
    discount: 12,
    images: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80'],
    category: 'Accessories',
    description: 'Industry-leading noise canceling headphones with Auto NC Optimizer, crystal clear hands-free calling, and up to 30-hour battery life.',
    tags: ['sony', 'headphones', 'audio'],
    inStock: true,
    stockQty: 100,
    avgRating: 4.7,
    reviewCount: 340,
    specifications: [{ key: 'Color', value: 'Silver' }, { key: 'Type', value: 'Over-ear' }],
    relatedProducts: [],
  },
  {
    _id: 'prod_4',
    slug: 'samsung-odyssey-g9',
    name: 'Samsung Odyssey G9',
    itemCode: 'SAM-OG9',
    storePrice: 1299,
    mrp: 1499,
    discount: 13,
    images: ['https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&q=80'],
    category: 'Gaming',
    description: '49" DQHD curved gaming monitor with 240Hz refresh rate, 1ms response time, and Quantum Mini-LED technology for an immersive experience.',
    tags: ['samsung', 'monitor', 'gaming'],
    inStock: true,
    stockQty: 10,
    avgRating: 4.6,
    reviewCount: 56,
    specifications: [{ key: 'Size', value: '49 inch' }],
    relatedProducts: [],
  },
  {
    _id: 'prod_5',
    slug: 'apple-watch-ultra-2',
    name: 'Apple Watch Ultra 2',
    itemCode: 'APL-AWU2',
    storePrice: 799,
    mrp: 799,
    discount: 0,
    images: ['https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&q=80'],
    category: 'Wearables',
    description: 'The most rugged and capable smartwatch. Designed for outdoor adventures and supercharged workouts with a lightweight titanium case.',
    tags: ['apple', 'watch', 'wearable'],
    inStock: true,
    stockQty: 40,
    avgRating: 4.9,
    reviewCount: 210,
    specifications: [{ key: 'Material', value: 'Titanium' }],
    relatedProducts: [],
  },
  {
    _id: 'prod_6',
    slug: 'keychron-q1-pro',
    name: 'Keychron Q1 Pro',
    itemCode: 'KEY-Q1P',
    storePrice: 199,
    mrp: 219,
    discount: 9,
    images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&q=80'],
    category: 'Accessories',
    description: 'A premium full-metal QMK/VIA wireless custom mechanical keyboard, featuring a 75% layout, double-gasket design, and hot-swappable switches.',
    tags: ['keyboard', 'mechanical'],
    inStock: true,
    stockQty: 15,
    avgRating: 4.8,
    reviewCount: 72,
    specifications: [{ key: 'Switches', value: 'Keychron K Pro Red' }],
    relatedProducts: [],
  }
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const getProducts = async (filters: ProductFilters = {}): Promise<ProductListResponse> => {
  await delay(500);
  let result = [...DUMMY_PRODUCTS];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
  }

  if (filters.category) {
    result = result.filter(p => p.category === filters.category);
  }

  if (filters.maxPrice) {
    result = result.filter(p => p.storePrice <= filters.maxPrice!);
  }

  if (filters.minPrice) {
    result = result.filter(p => p.storePrice >= filters.minPrice!);
  }

  if (filters.featured) {
    // Just use a subset or random mock logic for featured, e.g., high rating or discount > 0
    result = result.filter(p => p.avgRating >= 4.8 || p.discount > 0);
  }

  if (filters.sort === 'price_asc') result.sort((a, b) => a.storePrice - b.storePrice);
  if (filters.sort === 'price_desc') result.sort((a, b) => b.storePrice - a.storePrice);
  if (filters.sort === 'newest') result.reverse();
  if (filters.sort === 'popular') result.sort((a, b) => b.reviewCount - a.reviewCount);
  
  return {
    products: result,
    total: result.length,
    page: 1,
    totalPages: 1,
  };
};

export const getProductBySlug = async (slug: string): Promise<StoreProduct> => {
  await delay(500);
  const prod = DUMMY_PRODUCTS.find(p => p.slug === slug);
  if (!prod) throw new Error('Product not found');
  return prod;
};

export const getCategories = async (): Promise<string[]> => {
  await delay(500);
  return ['Electronics', 'Computers', 'Accessories', 'Gaming', 'Wearables'];
};
