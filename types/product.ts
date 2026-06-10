export interface Seller {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  joinDate?: string;
  description?: string;
}

export interface ProductVariant {
  _id: string;
  label: string;          // e.g. "Red", "10mm"
  sku?: string;
  storePrice: number;
  mrp?: number;
  discount?: number;
  stockQty: number;
  inStock: boolean;
  weightPerPiece?: number;
  itemCode?: string;
  images?: string[];
  specifications?: { key: string; value: string }[];
  color?: string;        // Hex code or name e.g. "#FF0000" or "Red"
  size?: string;         // Size code e.g. "XL", "M", "8mm"
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
}

export interface Product {
  _id: string;
  slug: string;
  name: string;
  brand?: string;
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
  relatedProducts?: Product[];
  weightPerPiece?: number;
  variants?: ProductVariant[];
  variantType?: string;   // primary variant type
  seller?: Seller;
}
