import client from './client';

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
  paymentMethod?: string;
}

export const fetchOrders = async (params?: { status?: string; page?: number }) => {
  const { data } = await client.get('/api/store/orders', { params });
  return data as { orders: EcomOrder[]; total: number };
};

export const fetchOrderById = async (id: string) => {
  const { data } = await client.get(`/api/store/orders/${id}`);
  return data as { order: EcomOrder };
};

// Initiate checkout — validates stock + creates Razorpay order
export const initiateCheckout = async (payload: {
  cartItems: { productId: string; quantity: number; price: number }[];
  addressId: string;
  promoCode?: string;
}) => {
  const { data } = await client.post('/api/store/checkout/initiate', payload);
  return data as {
    razorpayOrderId: string;
    amount: number;     // in paise
    currency: string;
    key: string;
    ecomOrderId: string;
  };
};

// Verify payment after Razorpay success
export const verifyPayment = async (payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  ecomOrderId: string;
}) => {
  const { data } = await client.post('/api/store/checkout/verify', payload);
  return data as { orderNumber: string; estimatedDelivery: string };
};
