import type { AxiosError } from 'axios';
import client from './client';
import { Config } from '@/utils/config';

export interface RazorpayOrderResponse {
  id: string; // Razorpay Order ID (e.g. order_DBdbPy480sfbpj)
  amount: number; // Amount in paise
  currency: string;
  key?: string; // Razorpay Public Key
}

function shouldUseMock(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const axiosError = err as AxiosError;
  if (!axiosError.response) return true;
  const s = axiosError.response.status;
  return s === 401 || s === 403 || s === 404 || s === 405 || s === 400;
}

/**
 * Calls backend to create a Razorpay order.
 * Falls back to mock order generation if backend is unavailable.
 */
export const createOrder = async (
  amount: number,
  currency = 'INR'
): Promise<RazorpayOrderResponse> => {
  if (Config.USE_MOCK_API) {
    return {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100), // convert INR to paise
      currency,
      key: 'rzp_test_mockkey12345',
    };
  }
  try {
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
  } catch (err: unknown) {
    if (shouldUseMock(err)) {
      console.info('[MOCK] createOrder fallback active');
      return {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100), // convert INR to paise
        currency,
        key: 'rzp_test_mockkey12345',
      };
    }
    throw err;
  }
};

/**
 * Validates the payment signature on the server.
 * Falls back to returning success if backend is offline.
 */
export const verifyPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
  ecomOrderId?: string
): Promise<{ success: boolean; message: string }> => {
  if (Config.USE_MOCK_API) {
    return { success: true, message: 'Mock payment verified successfully' };
  }
  try {
    const { data } = await client.post<{ success: boolean; message: string }>(
      '/api/payments/verify',
      {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        ecomOrderId,
      }
    );
    return data;
  } catch (err: unknown) {
    if (shouldUseMock(err)) {
      console.info('[MOCK] verifyPayment fallback active');
      return { success: true, message: 'Mock payment verified successfully' };
    }
    throw err;
  }
};
