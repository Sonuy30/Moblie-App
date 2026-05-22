import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  maxQty: number;
  unit: string;
}

interface CartStore {
  items: CartItem[];
  promoCode: string | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setPromoCode: (code: string | null) => void;
  totalItems: () => number;
  subtotal: () => number;
  bulkDiscount: () => number;
  gst: () => number;
  deliveryCharge: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,

      addItem: (newItem) => {
        const existing = get().items.find(i => i.productId === newItem.productId);
        if (existing) {
          set(s => ({ items: s.items.map(i =>
            i.productId === newItem.productId
              ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQty) } : i
          )}));
        } else {
          set(s => ({ items: [...s.items, { ...newItem, quantity: 1 }] }));
        }
      },

      removeItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.productId !== id) })),

      updateQty: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return; }
        set(s => ({ items: s.items.map(i =>
          i.productId === id ? { ...i, quantity: Math.min(qty, i.maxQty) } : i
        )}));
      },

      clearCart: () => set({ items: [], promoCode: null }),
      setPromoCode: (code) => set({ promoCode: code }),

      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
      bulkDiscount: () => get().items.reduce((s, i) => {
        let pct = 0;
        if (i.quantity >= 50) pct = 10;
        else if (i.quantity >= 20) pct = 5;
        return s + Math.round(i.price * i.quantity * (pct / 100));
      }, 0),
      gst: () => Math.round((get().subtotal() - get().bulkDiscount()) * 0.18),
      deliveryCharge: () => (get().subtotal() - get().bulkDiscount()) >= 999 ? 0 : 99,
      grandTotal: () => get().subtotal() - get().bulkDiscount() + get().gst() + get().deliveryCharge(),
    }),
    { name: 'aits-cart', storage: createJSONStorage(() => AsyncStorage) }
  )
);
