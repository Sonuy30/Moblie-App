import client from './client';
import { Config } from '@/utils/config';

export interface RazorpayOrderResponse {
  id: string; // Razorpay Order ID (e.g. order_DBdbPy480sfbpj)
  amount: number; // Amount in paise
  currency: string;
  key?: string; // Razorpay Public Key
}

export const createOrder = async (
  amount: number,
  currency = 'INR'
): Promise<RazorpayOrderResponse> => {
  if (Config.USE_MOCK_API) {
    return {
      id: `order_mock_${Date.now()}`,
      amount: amount * 100,
      currency,
      key: 'rzp_test_mockkey12345',
    };
  }

  const { data } = await client.post<{
    id?: string;
    razorpayOrderId?: string;
    amount: number;
    currency?: string;
    key?: string;
  }>('/api/payments/order', { amount, currency });

  return {
    id: data.id || data.razorpayOrderId || '',
    amount: data.amount,
    currency: data.currency || currency,
    key: data.key,
  };
};

export const verifyPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  ecomOrderId?: string,
  checkoutDetails?: {
    items: any[];
    shippingAddress: any;
    paymentMethod: string;
    promoCode?: string;
  }
): Promise<{ success: boolean; message: string; ecomOrderId?: string; orderNumber?: string }> => {
  if (Config.USE_MOCK_API) {
    return {
      success: true,
      message: 'Payment verified successfully (MOCK)',
      ecomOrderId: ecomOrderId || `mock-order-${Date.now()}`,
      orderNumber: `SO-MOB-${Date.now()}`,
    };
  }

  const { data } = await client.post<{
    success: boolean;
    message: string;
    ecomOrderId?: string;
    orderNumber?: string;
  }>('/api/payments/verify', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    ecomOrderId,
    checkoutDetails,
  });
  return data;
};
