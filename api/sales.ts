import client from './client';
import { Config } from '@/utils/config';

export interface FlashSale {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  discountPercentage?: number;
}

export interface SaleProduct {
  _id: string;
  slug: string;
  name: string;
  itemCode: string;
  storePrice: number;       // Flash Sale Price
  originalPrice: number;    // Struck-through Price (MRP)
  discount: number;         // Discount percentage
  minOrderQty: number;
  unit: string;
  images: string[];
  category: string;
  description: string;
  inStock: boolean;
  stockQty: number;
  soldQty: number;          // Quantity sold in this sale
  avgRating: number;
  reviewCount: number;
}

// ──────────────────────────────────────────────────────────
// Mock Data Generation Helpers
// ──────────────────────────────────────────────────────────

// Predefined mock sale products using steel and pipe items from core catalog
const MOCK_SALE_PRODUCTS: SaleProduct[] = [
  {
    _id: 'prod-tmt-10mm',
    slug: 'tmt-bar-10mm',
    name: 'TMT Steel Bar Fe 500D (10mm)',
    itemCode: 'TMT-10-500',
    storePrice: 520, // Sale Price
    originalPrice: 650, // Struck-through Price
    discount: 20,
    minOrderQty: 10,
    unit: 'pcs',
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80'],
    category: 'TMT Bars',
    description: 'High tensile strength reinforced TMT steel bar, diameter 10mm. Ideal for residential structural slabs and beams.',
    inStock: true,
    stockQty: 80,
    soldQty: 120,
    avgRating: 4.8,
    reviewCount: 42,
  },
  {
    _id: 'prod-gi-pipe-25',
    slug: 'gi-pipe-25mm',
    name: 'GI Pipe Class B Hot-Dip (25mm)',
    itemCode: 'PIPE-GI-25L',
    storePrice: 294, // Sale Price
    originalPrice: 420, // Struck-through Price
    discount: 30,
    minOrderQty: 5,
    unit: 'pcs',
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'],
    category: 'Pipes',
    description: 'Hot-dip galvanized iron pipe with superior corrosion resistance. Size 25mm (1 inch) diameter, length 6 meters.',
    inStock: true,
    stockQty: 45,
    soldQty: 55,
    avgRating: 4.5,
    reviewCount: 28,
  },
  {
    _id: 'prod-sht-15',
    slug: 'ms-sheet-1-5mm',
    name: 'Mild Steel Cold Rolled Sheet (1.5mm)',
    itemCode: 'STL-SHT-15MM',
    storePrice: 1890,
    originalPrice: 2700,
    discount: 30,
    minOrderQty: 2,
    unit: 'sheets',
    images: ['https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80'],
    category: 'MS Sheets',
    description: 'Cold rolled mild steel sheet with smooth surface finish. Thickness 1.5mm, dimensions 2500 x 1250 mm.',
    inStock: true,
    stockQty: 15,
    soldQty: 35,
    avgRating: 4.6,
    reviewCount: 19,
  },
  {
    _id: 'prod-rnd-16',
    slug: 'ms-round-bar-16mm',
    name: 'Mild Steel Bright Round Bar (16mm)',
    itemCode: 'STL-RND-16',
    storePrice: 1960,
    originalPrice: 2800,
    discount: 30,
    minOrderQty: 5,
    unit: 'pcs',
    images: ['https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=600&auto=format&fit=crop&q=80'],
    category: 'Round Bars',
    description: 'Industrial grade hot-rolled bright round steel bar. Diameter 16mm, length 6 meters.',
    inStock: false, // SOLD OUT item to test sold out overlay
    stockQty: 0,
    soldQty: 110,
    avgRating: 4.7,
    reviewCount: 22,
  },
  {
    _id: 'prod-ang-40',
    slug: 'ms-angle-40x40',
    name: 'Mild Steel Equal Angle (40x40x5mm)',
    itemCode: 'STL-ANG-4040',
    storePrice: 3600,
    originalPrice: 4800,
    discount: 25,
    minOrderQty: 4,
    unit: 'pcs',
    images: ['https://images.unsplash.com/photo-1563784462386-044fd95e9852?w=600&auto=format&fit=crop&q=80'],
    category: 'Angles & Channels',
    description: 'Hot rolled structural steel equal angle bar. Size 40x40 mm, thickness 5mm, length 6 meters.',
    inStock: true,
    stockQty: 5, // LOW STOCK item
    soldQty: 40,
    avgRating: 4.4,
    reviewCount: 15,
  },
];

// Helper to determine if we should fall back to mock data
function isBackendMissing(err: unknown): boolean {
  if (!err || typeof err !== 'object') return true;
  const e = err as { response?: { data?: { message?: unknown; error?: unknown }; status?: number } };
  if (e.response?.data?.message || e.response?.data?.error) return false;
  const status = e.response?.status;
  if (!status || status === 405 || status === 404) return true;
  return false;
}

// Global active sale config mock that can be modified dynamically for testing countdowns
let mockSaleOffsetSeconds = 2 * 60 * 60; // Default: 2 hours

export function setMockSaleOffset(seconds: number) {
  mockSaleOffsetSeconds = seconds;
}

export function getMockActiveSale(): FlashSale {
  const now = Date.now();
  const startTime = new Date(now - 30 * 60 * 1000).toISOString(); // Started 30 mins ago
  const endTime = new Date(now + mockSaleOffsetSeconds * 1000).toISOString();

  return {
    _id: 'sale-flash-001',
    title: 'Monsoon Steel Bonanza',
    description: 'Vast discount on structural steel, pipes, sheets, and reinforcement bars. Offer valid till stock lasts!',
    startTime,
    endTime,
    discountPercentage: 30,
  };
}

// ──────────────────────────────────────────────────────────
// API Methods
// ──────────────────────────────────────────────────────────

/**
 * Fetch the active Flash Sale details.
 */
export const getActiveSale = async (): Promise<FlashSale | null> => {
  if (Config.USE_MOCK_API) {
    // Return mock active sale details
    return getMockActiveSale();
  }

  try {
    const { data } = await client.get<{ sale: FlashSale | null }>('/api/mobile/sales/active');
    return data.sale;
  } catch (err) {
    if (isBackendMissing(err)) {
      return getMockActiveSale();
    }
    throw err;
  }
};

/**
 * Fetch products included in a specific Flash Sale.
 */
export const getSaleProducts = async (saleId: string): Promise<SaleProduct[]> => {
  if (Config.USE_MOCK_API || saleId === 'sale-flash-001') {
    // Return mock products
    return [...MOCK_SALE_PRODUCTS];
  }

  try {
    const { data } = await client.get<{ products: SaleProduct[] }>(`/api/mobile/sales/${saleId}/products`);
    return data.products;
  } catch (err) {
    if (isBackendMissing(err)) {
      return [...MOCK_SALE_PRODUCTS];
    }
    throw err;
  }
};
