import client from './client';

export interface CheckoutPayload {
  cartItems: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  addressId: string;
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

export const initiateCheckout = async (payload: CheckoutPayload): Promise<CheckoutInitResponse> => {
  const { data } = await client.post('/api/store/checkout/initiate', payload);
  return data;
};

export const verifyPayment = async (payload: {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  ecomOrderId: string;
  paymentMethod?: string;
}) => {
  const { data } = await client.post('/api/store/checkout/verify', payload);
  return data;
};

// Demo payment for development (no Razorpay SDK)
export const demoPay = async (ecomOrderId: string) => {
  const { data } = await client.post('/api/store/checkout/verify', {
    ecomOrderId,
    paymentMethod: 'demo',
    razorpay_payment_id: `demo_${Date.now()}`,
    razorpay_order_id: `demo_order_${Date.now()}`,
    razorpay_signature: 'demo_signature',
  });
  return data;
};
