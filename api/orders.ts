import client from './client';
import { mockFetchOrders, mockFetchOrderById, mockInitiateCheckout } from './mockOrders';

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface EcomOrder {
  _id: string;
  orderNumber: string;
  items: { name: string; image: string; quantity: number; price: number; unit: string }[];
  deliveryAddress: Address;
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'failed' | 'pending';
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  courierName?: string;
  deliveryToken?: string;
  estimatedDelivery?: string;
  placedAt: string;
  updatedAt: string;
  createdAt?: string;
  paymentMethod?: string;
}

// Helper: should we use mock instead of re-throwing?
function shouldUseMock(err: any): boolean {
  if (!err?.response) return true;     // network down / CORS / wrong IP
  const s = err.response.status;
  // 401 = JWT expired or not sent; show mock orders instead of error screen
  // 403/404/405 = endpoint not configured on local dev server
  return s === 401 || s === 403 || s === 404 || s === 405;
}

// ── Fetch order list ───────────────────────────────────────────────────────
export const fetchOrders = async (params?: { status?: string; page?: number }) => {
  try {
    const { data } = await client.get('/api/mobile/orders', { params });
    return data as { orders: EcomOrder[]; total: number };
  } catch (err: any) {
    if (shouldUseMock(err)) {
      console.info('[MOCK] fetchOrders fallback active');
      return mockFetchOrders(params);
    }
    throw err;
  }
};

// ── Fetch single order ────────────────────────────────────────────────────
export const fetchOrderById = async (id: string) => {
  try {
    const { data } = await client.get(`/api/mobile/orders/${id}`);
    return data as { order: EcomOrder };
  } catch (err: any) {
    if (shouldUseMock(err)) {
      console.info(`[MOCK] fetchOrderById fallback for: ${id}`);
      return mockFetchOrderById(id);
    }
    throw err;
  }
};

// ── Initiate checkout (place order) ───────────────────────────────────────
export const initiateCheckout = async (payload: {
  cartItems: { productId: string; quantity: number; price: number; name: string; image?: string }[];
  addressId?: string;
  shippingAddress?: Address;
  paymentMethod?: string;
  promoCode?: string;
}) => {
  const orderPayload = {
    items: payload.cartItems.map((i) => ({
      productId: i.productId,
      name:      i.name,
      qty:       i.quantity,
      price:     i.price,
    })),
    paymentMethod:   payload.paymentMethod || 'cod',
    shippingAddress: payload.shippingAddress || {},
  };

  try {
    const { data } = await client.post('/api/mobile/orders', orderPayload);
    return data as {
      order: { _id: string; orderNumber: string; totalAmount: number };
      message: string;
    };
  } catch (err: any) {
    if (shouldUseMock(err)) {
      console.info('[MOCK] initiateCheckout fallback active');
      return mockInitiateCheckout({
        cartItems: payload.cartItems.map((i) => ({
          ...i,
          image: i.image || 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&auto=format&fit=crop&q=80',
        })),
        shippingAddress: payload.shippingAddress,
        paymentMethod: payload.paymentMethod,
      });
    }
    throw err;
  }
};

// ── Verify payment ────────────────────────────────────────────────────────
export const verifyPayment = async (payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  ecomOrderId: string;
}) => {
  try {
    const { data } = await client.post('/api/store/checkout/verify', payload);
    return data as { orderNumber: string; estimatedDelivery: string };
  } catch (err: any) {
    if (shouldUseMock(err)) {
      return { orderNumber: 'MOCK', estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600000).toISOString() };
    }
    throw err;
  }
};
