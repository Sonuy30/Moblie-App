import { create } from 'zustand';
import type { Address, DeliveryOption, PaymentOptionType } from '@/types/checkout';

interface CheckoutState {
  selectedAddress: Address | null;
  deliveryOption: DeliveryOption | null;
  paymentMethod: PaymentOptionType | null;
  couponCode: string;
  couponDiscount: number;
  ecomOrderId: string | null;
  orderNumber: string | null;

  setSelectedAddress: (addr: Address | null) => void;
  setDeliveryOption: (opt: DeliveryOption | null) => void;
  setPaymentMethod: (method: PaymentOptionType | null) => void;
  setCouponCode: (code: string) => void;
  setCouponDiscount: (amount: number) => void;
  setOrderDetails: (ecomOrderId: string | null, orderNumber: string | null) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  selectedAddress: null,
  deliveryOption: null,
  paymentMethod: null,
  couponCode: '',
  couponDiscount: 0,
  ecomOrderId: null,
  orderNumber: null,

  setSelectedAddress: (selectedAddress) => set({ selectedAddress }),
  setDeliveryOption: (deliveryOption) => set({ deliveryOption }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCouponCode: (couponCode) => set({ couponCode }),
  setCouponDiscount: (couponDiscount) => set({ couponDiscount }),
  setOrderDetails: (ecomOrderId, orderNumber) => set({ ecomOrderId, orderNumber }),
  resetCheckout: () =>
    set({
      selectedAddress: null,
      deliveryOption: null,
      paymentMethod: null,
      couponCode: '',
      couponDiscount: 0,
      ecomOrderId: null,
      orderNumber: null,
    }),
}));
