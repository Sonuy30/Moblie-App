import { useState } from 'react';
// @ts-expect-error react-native-razorpay lacks type definitions
import RazorpayCheckout from 'react-native-razorpay';
import { useAuthStore } from '@/stores/authStore';
import { createOrder, verifyPayment } from '@/api/payments';
import { colors } from '@/constants/colors';
import type { RazorpayPaymentSuccess } from '@/types/checkout';

interface RazorpayCheckoutInterface {
  open: (options: Record<string, unknown>) => Promise<unknown>;
}

const rzp = RazorpayCheckout as unknown as RazorpayCheckoutInterface;

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const payWithRazorpay = async (amount: number, ecomOrderId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create Razorpay order on the server
      const orderData = await createOrder(amount);

      // 2. Configure payment gateway options
      const options = {
        description: `Payment for Order #${ecomOrderId}`,
        image: 'https://i.imgur.com/3g7A62C.png',
        key: orderData.key || 'rzp_test_mockkey12345',
        amount: orderData.amount, // already in paise
        currency: orderData.currency,
        name: 'AITS Shop',
        order_id: orderData.id,
        prefill: {
          email: user?.email || 'customer@aits.com',
          contact: user?.phone || '9999999999',
          name: user?.fullName || 'Valued Customer',
        },
        theme: { color: colors.primary },
      };

      // 3. Open Razorpay checkout modal
      const paymentResult = await new Promise<RazorpayPaymentSuccess>((resolve, reject) => {
        rzp.open(options)
          .then((data: unknown) => {
            resolve(data as RazorpayPaymentSuccess);
          })
          .catch((err: unknown) => {
            const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : {};
            const errCode = typeof errObj.code === 'number' ? errObj.code : undefined;
            const errDesc = typeof errObj.description === 'string' ? errObj.description : undefined;

            // Construct an Error object wrapping the Razorpay details to satisfy eslint
            const rejectError = new Error(errDesc || 'Payment failed');
            Object.assign(rejectError, { code: errCode, description: errDesc });

            reject(rejectError);
          });
      });

      // 4. Verify payment signature on the server
      const verification = await verifyPayment(
        paymentResult.razorpay_order_id,
        paymentResult.razorpay_payment_id,
        paymentResult.razorpay_signature,
        ecomOrderId
      );

      setLoading(false);
      return verification.success;
    } catch (err: unknown) {
      setLoading(false);
      const rzpError = err as { code?: number; description?: string; message?: string };
      // Handle user cancellation (Razorpay returns code 2 on manual exit)
      if (rzpError.code === 2) {
        setError('Payment cancelled by user.');
      } else {
        setError(rzpError.description || rzpError.message || 'Payment failed.');
      }
      return false;
    }
  };

  const resetPaymentState = () => {
    setError(null);
    setLoading(false);
  };

  return {
    payWithRazorpay,
    loading,
    error,
    resetPaymentState,
  };
};
