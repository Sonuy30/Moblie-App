import { type Address as BaseAddress } from '@/api/orders';

export type Address = BaseAddress;

export interface DeliveryOption {
  id: 'standard' | 'express' | 'same_day';
  name: string;
  price: number;
  estimatedDays: number;
  estimatedDeliveryDate: string;
  isDeliverable: boolean;
  message?: string;
}

export type PaymentOptionType =
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'wallet'
  | 'cod'
  | 'credit'
  | 'offline_invoice';

export interface OrderSummary {
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  couponDiscount: number;
  grandTotal: number;
}

export interface RazorpayPaymentSuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentError {
  code: number;
  description: string;
}
