import { useState } from 'react';
import { Platform } from 'react-native';
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

/** Load Razorpay JS SDK dynamically for web */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export const useRazorpay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const payWithRazorpay = async (
    amount: number,
    checkoutDetails?: any
  ): Promise<{ success: boolean; ecomOrderId?: string; orderNumber?: string }> => {
    setLoading(true);
    setError(null);

    if (Platform.OS === 'web') {
      try {
        // Step 1: Create Razorpay order on the server
        const orderData = await createOrder(amount);

        const isTestOrder = orderData.id.startsWith('order_test_') || orderData.id.startsWith('order_mock_');
        if (isTestOrder) {
          const verification = await verifyPayment(
            orderData.id,
            `pay_test_${Date.now()}`,
            'mock_signature',
            undefined,
            checkoutDetails
          );
          setLoading(false);
          return {
            success: verification.success,
            ecomOrderId: verification.ecomOrderId,
            orderNumber: verification.orderNumber,
          };
        }

        // Step 2: Load Razorpay JS SDK
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay payment SDK. Please check your internet connection.');
        }

        // Step 3: Open Razorpay checkout modal (web version)
        const paymentResult = await new Promise<RazorpayPaymentSuccess>((resolve, reject) => {
          const rzpInstance = new (window as any).Razorpay({
            key: orderData.key || process.env.EXPO_PUBLIC_RAZORPAY_KEY || '',
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            order_id: orderData.id,
            name: 'AITS Shop',
            description: 'Payment for your order',
            image: 'https://i.imgur.com/3g7A62C.png',
            prefill: {
              email: user?.email || 'customer@aits.com',
              contact: user?.phone || '9999999999',
              name: user?.fullName || 'Valued Customer',
            },
            theme: { color: colors.primary },
            modal: {
              ondismiss: () => {
                reject(new Error('Payment cancelled by user'));
              },
            },
            handler: (response: RazorpayPaymentSuccess) => {
              resolve(response);
            },
          });
          rzpInstance.open();
        });

        // Step 4: Verify payment and create order on server
        const verification = await verifyPayment(
          paymentResult.razorpay_order_id,
          paymentResult.razorpay_payment_id,
          paymentResult.razorpay_signature,
          undefined,
          checkoutDetails
        );

        setLoading(false);
        return {
          success: verification.success,
          ecomOrderId: verification.ecomOrderId,
          orderNumber: verification.orderNumber,
        };
      } catch (e: any) {
        setLoading(false);
        const msg = e?.message || 'Payment failed';
        if (msg.includes('cancelled')) {
          setError('Payment was cancelled. You can retry or choose Cash on Delivery.');
        } else {
          setError(msg);
        }
        return { success: false };
      }
    }

    try {
      // 1. Create Razorpay order on the server
      const orderData = await createOrder(amount);

      // 2. Configure payment gateway options
      const options = {
        description: 'Payment for order checkout',
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
        undefined, // no pre-created order ID
        checkoutDetails
      );

      setLoading(false);
      return {
        success: verification.success,
        ecomOrderId: verification.ecomOrderId,
        orderNumber: verification.orderNumber,
      };
    } catch (err: unknown) {
      setLoading(false);
      const rzpError = err as { code?: number; description?: string; message?: string };
      // Handle user cancellation (Razorpay returns code 2 on manual exit)
      if (rzpError.code === 2) {
        setError('Payment cancelled by user.');
      } else {
        setError(rzpError.description || rzpError.message || 'Payment failed.');
      }
      return { success: false };
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
