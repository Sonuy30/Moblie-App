import { useCartStore } from '@/stores/cartStore';

export const useCart = () => {
  const store = useCartStore();

  return {
    items: store.items,
    promoCode: store.promoCode,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQty: store.updateQty,
    clearCart: store.clearCart,
    setPromoCode: store.setPromoCode,
    totalItems: store.totalItems(),
    subtotal: store.subtotal(),
    gst: store.gst(),
    deliveryCharge: store.deliveryCharge(),
    grandTotal: store.grandTotal(),
    isEmpty: store.items.length === 0,
  };
};
