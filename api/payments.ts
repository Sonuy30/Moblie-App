import client from './client';

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
  ecomOrderId?: string
): Promise<{ success: boolean; message: string }> => {
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
};
