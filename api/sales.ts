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

// Helper to determine if we should fall back to mock data
function isBackendMissing(err: unknown): boolean {
  if (!Config.USE_MOCK_API) return false;
  if (!err || typeof err !== 'object') return true;
  const e = err as { response?: { data?: { message?: unknown; error?: unknown }; status?: number } };
  if (e.response?.data?.message || e.response?.data?.error) return false;
  const status = e.response?.status;
  if (!status || status === 405 || status === 404) return true;
  return false;
}

export function getMockActiveSale(): FlashSale | null {
  return null;
}

// ──────────────────────────────────────────────────────────
// API Methods
// ──────────────────────────────────────────────────────────

/**
 * Fetch the active Flash Sale details.
 */
export const getActiveSale = async (): Promise<FlashSale | null> => {
  if (Config.USE_MOCK_API) {
    return null;
  }

  try {
    const { data } = await client.get<{ sale: FlashSale | null }>('/api/mobile/sales/active');
    return data.sale;
  } catch (err) {
    if (isBackendMissing(err)) {
      return null;
    }
    throw err;
  }
};

/**
 * Fetch products included in a specific Flash Sale.
 */
export const getSaleProducts = async (saleId: string): Promise<SaleProduct[]> => {
  if (Config.USE_MOCK_API) {
    return [];
  }

  try {
    const { data } = await client.get<{ products: SaleProduct[] }>(`/api/mobile/sales/${saleId}/products`);
    return data.products;
  } catch (err) {
    if (isBackendMissing(err)) {
      return [];
    }
    throw err;
  }
};

