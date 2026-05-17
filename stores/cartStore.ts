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
}

interface CartStore {
  items: CartItem[];
  promoCode: string;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  setPromoCode: (code: string) => void;
  totalItems: () => number;
  subtotal: () => number;
  gst: () => number;
  deliveryCharge: () => number;
  grandTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: '',

      addItem: (newItem) => {
        const existing = get().items.find((i) => i.productId === newItem.productId);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.productId === newItem.productId
                ? { ...i, quantity: Math.min(i.quantity + 1, i.maxQty) }
                : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { ...newItem, quantity: 1 }] }));
        }
      },

      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(qty, i.maxQty) }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [], promoCode: '' }),

      setPromoCode: (code) => set({ promoCode: code }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      gst: () => Math.round(get().subtotal() * 0.18),

      deliveryCharge: () => (get().subtotal() >= 999 ? 0 : 99),

      grandTotal: () => get().subtotal() + get().gst() + get().deliveryCharge(),
    }),
    {
      name: 'aits-cart',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
