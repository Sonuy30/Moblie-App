export type SubscriptionFrequency = 'daily' | 'alternate_days' | 'custom_days';
export type SubscriptionPlanType = 'day' | 'week' | 'month';
export type SubscriptionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  pin: string;
  country?: string;
}

export interface PauseRange {
  from: string;
  to: string;
}

export interface Subscription {
  _id: string;
  companyId: string;
  customer: string;
  item: string;
  itemName: string;
  unit: string;
  quantityPerDelivery: number;
  frequency: SubscriptionFrequency;
  daysOfWeek: string[];
  planType: SubscriptionPlanType;
  totalDeliveries: number;
  deliveriesCompleted: number;
  pricePerDelivery: number;
  totalAmount: number;
  gstAmount: number;
  startDate: string;
  endDate: string;
  skipDates: string[];
  pauses: PauseRange[];
  deliveryAddress: DeliveryAddress;
  zone?: string;
  assignedPartner?: string;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'cod_pending';
  paymentMethod?: 'online' | 'cod' | 'razorpay';
  billingStatus?: 'paid' | 'due' | 'overdue';
  currentCycleDeliveries?: number;
  cycleTotalAmount?: number;
  billDueDate?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: SubscriptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionCheckoutResult {
  razorpayOrder: {
    id: string;
    amount: number;
    currency: string;
  };
  pricePerDelivery: number;
  gstAmount: number;
  totalAmount: number;
  totalDeliveries: number;
}
