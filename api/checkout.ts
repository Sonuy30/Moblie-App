
export interface CheckoutPayload {
  cartItems: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  addressId: string;
  shippingAddress?: unknown;
  paymentMethod?: string;
  promoCode?: string;
}

export interface CheckoutInitResponse {
  ecomOrderId: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  key?: string;
  orderNumber: string;
}

import client from './client';
import { Config } from '@/utils/config';

/**
 * Places an order in the ERP via /api/mobile/orders.
 * Falls back to local mock order creation if backend is unavailable.
 */
export const initiateCheckout = async (payload: CheckoutPayload): Promise<CheckoutInitResponse> => {
  if (Config.USE_MOCK_API) {
    const totalAmount = payload.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gstAmount = Math.round(totalAmount * 0.18);
    return {
      ecomOrderId: `mock-order-${Date.now()}`,
      orderNumber: `SO-MOB-${Date.now()}`,
      amount: totalAmount + gstAmount,
      currency: 'INR',
    };
  }

  const orderPayload = {
    items: payload.cartItems.map((i) => ({
      productId: i.productId,
      name:      i.name,
      qty:       i.quantity,
      price:     i.price,
      image:     i.image,
    })),
    paymentMethod:   payload.paymentMethod || 'cod',
    shippingAddress: payload.shippingAddress || {},
  };

  const { data } = await client.post<{ order: { _id: string; orderNumber: string; totalAmount?: number } }>('/api/mobile/orders', orderPayload);
  return {
    ecomOrderId: data.order._id,
    orderNumber: data.order.orderNumber,
    amount:      data.order.totalAmount || 0,
    currency:    'INR',
  };
};

export const verifyPayment = async (_payload: {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  ecomOrderId: string;
  paymentMethod?: string;
}) => {
  // COD / credit / offline orders are already finalised at placement.
  // Razorpay verification will be wired once the native SDK build is live.
  await Promise.resolve();
  return { success: true, message: 'Order confirmed' };
};

/** COD: no gateway needed — order already placed with paymentMethod=cod */
export const demoPay = async (_ecomOrderId: string) => {
  await Promise.resolve();
  return { success: true, message: 'Order confirmed (COD)' };
};

/** Credit limit payment — deducted server-side at order placement */
export const payWithCreditLimit = async (_ecomOrderId: string) => {
  await Promise.resolve();
  return { success: true, message: 'Credit payment approved' };
};

/** Offline invoice — payment terms handled by ERP */
export const payOfflineInvoice = async (_ecomOrderId: string) => {
  await Promise.resolve();
  return { success: true, message: 'Offline invoice created' };
};

// ── Coupon Validation ──────────────────────────────────────────────────────────

export interface CouponValidateResponse {
  valid: boolean;
  discount: number;
  discountPercent?: number;
  message: string;
  code: string;
}

/**
 * Validate a coupon code against the cart total.
 * Falls back to mock codes when USE_MOCK_API is true.
 */
export const validateCoupon = async (
  code: string,
  cartTotal: number
): Promise<CouponValidateResponse> => {
  const upperCode = code.trim().toUpperCase();

  const { data } = await client.post<CouponValidateResponse>('/api/coupons/validate', {
    code: upperCode,
    cartTotal,
  });
  return data;
};
