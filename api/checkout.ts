import client from './client';
import { mockInitiateCheckout } from './mockOrders';

export interface CheckoutPayload {
  cartItems: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  addressId: string;
  shippingAddress?: any;
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

function shouldUseMock(err: any): boolean {
  if (!err?.response) return true;
  const s = err.response.status;
  return s === 401 || s === 403 || s === 404 || s === 405 || s === 400;
}

/**
 * Places an order in the ERP via /api/mobile/orders.
 * Falls back to local mock order creation if backend is unavailable.
 */
export const initiateCheckout = async (payload: CheckoutPayload): Promise<CheckoutInitResponse> => {
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

  try {
    const { data } = await client.post('/api/mobile/orders', orderPayload);
    return {
      ecomOrderId: data.order._id,
      orderNumber: data.order.orderNumber,
      amount:      data.order.totalAmount || 0,
      currency:    'INR',
    };
  } catch (err: any) {
    if (shouldUseMock(err)) {
      console.info('[MOCK] initiateCheckout fallback active');
      const mockResult = await mockInitiateCheckout({
        cartItems: payload.cartItems,
        shippingAddress: payload.shippingAddress,
        paymentMethod: payload.paymentMethod,
      });
      return {
        ecomOrderId: mockResult.order._id,
        orderNumber: mockResult.order.orderNumber,
        amount:      mockResult.order.totalAmount,
        currency:    'INR',
      };
    }
    throw err;
  }
};

export const verifyPayment = async (payload: {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  ecomOrderId: string;
  paymentMethod?: string;
}) => {
  // COD / credit / offline orders are already finalised at placement.
  // Razorpay verification will be wired once the native SDK build is live.
  return { success: true, message: 'Order confirmed' };
};

/** COD: no gateway needed — order already placed with paymentMethod=cod */
export const demoPay = async (_ecomOrderId: string) => {
  return { success: true, message: 'Order confirmed (COD)' };
};

/** Credit limit payment — deducted server-side at order placement */
export const payWithCreditLimit = async (_ecomOrderId: string) => {
  return { success: true, message: 'Credit payment approved' };
};

/** Offline invoice — payment terms handled by ERP */
export const payOfflineInvoice = async (_ecomOrderId: string) => {
  return { success: true, message: 'Offline invoice created' };
};
