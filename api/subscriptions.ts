import client from './client';
import type { Subscription, SubscriptionCheckoutResult, DeliveryAddress } from '@/types/subscription';

/**
 * Initiate a subscription checkout.
 * Server computes and locks the price — returns a Razorpay order to present to the customer.
 */
export const checkoutSubscription = async (payload: {
  itemId: string;
  quantityPerDelivery: number;
  planType: 'day' | 'week' | 'month';
  frequency: 'daily' | 'alternate_days' | 'custom_days';
  daysOfWeek?: string[];
}): Promise<SubscriptionCheckoutResult> => {
  const { data } = await client.post<SubscriptionCheckoutResult>(
    '/api/mobile/subscriptions/checkout',
    payload
  );
  return data;
};

/**
 * Verify Razorpay payment and activate subscription.
 * Never passes price — server reads it from the pending checkout record.
 */
export const verifySubscriptionPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  startDate: string;
  deliveryAddress: DeliveryAddress;
}): Promise<{ subscription: Subscription }> => {
  const { data } = await client.post<{ subscription: Subscription }>(
    '/api/mobile/subscriptions/verify-payment',
    payload
  );
  return data;
};

/**
 * Activate a subscription with Cash on Delivery.
 * No Razorpay — payment collected at door.
 */
export const activateSubscriptionCOD = async (payload: {
  razorpayOrderId: string;  // checkout session ID (the Razorpay order.id from checkout step)
  startDate: string;
  deliveryAddress: DeliveryAddress;
}): Promise<{ subscription: Subscription }> => {
  const { data } = await client.post<{ subscription: Subscription }>(
    '/api/mobile/subscriptions/activate-cod',
    payload
  );
  return data;
};


/** Fetch all subscriptions for the authenticated customer */
export const fetchMySubscriptions = async (): Promise<Subscription[]> => {
  const { data } = await client.get<{ subscriptions: Subscription[] }>(
    '/api/mobile/subscriptions'
  );
  return data.subscriptions;
};

/**
 * Skip or unskip delivery for a specific date.
 * Fails if past the company's order cutoff time the night before.
 */
export const skipSubscriptionDate = async (
  id: string,
  date: string,
  action: 'skip' | 'unskip' = 'skip'
): Promise<{ subscription: Subscription }> => {
  const { data } = await client.post<{ subscription: Subscription }>(
    `/api/mobile/subscriptions/${id}/skip`,
    { date, action }
  );
  return data;
};

/**
 * Pause a subscription for a date range.
 * Extends endDate by the pause duration. Rejects overlapping ranges.
 */
export const pauseSubscription = async (
  id: string,
  pauseFrom: string,
  pauseTo: string
): Promise<{ subscription: Subscription }> => {
  const { data } = await client.patch<{ subscription: Subscription }>(
    `/api/mobile/subscriptions/${id}`,
    { action: 'add_pause', pauseFrom, pauseTo }
  );
  return data;
};

/**
 * Remove an existing pause range.
 * Recalculates endDate and resets subscription status.
 */
export const removeSubscriptionPause = async (
  id: string,
  pauseFrom: string,
  pauseTo: string
): Promise<{ subscription: Subscription }> => {
  const { data } = await client.patch<{ subscription: Subscription }>(
    `/api/mobile/subscriptions/${id}`,
    { action: 'remove_pause', pauseFrom, pauseTo }
  );
  return data;
};

/**
 * Resume a paused subscription immediately as of today.
 */
export const resumeSubscription = async (
  id: string
): Promise<{ subscription: Subscription }> => {
  const { data } = await client.patch<{ subscription: Subscription }>(
    `/api/mobile/subscriptions/${id}`,
    { action: 'resume_now' }
  );
  return data;
};

/**
 * Pay outstanding cycle bill for a subscription.
 */
export const paySubscriptionBill = async (
  id: string,
  paymentMethod: 'online' | 'cod' = 'online',
  razorpayPaymentId?: string
): Promise<{ subscription: Subscription; message: string }> => {
  const { data } = await client.post<{ subscription: Subscription; message: string }>(
    `/api/mobile/subscriptions/${id}/pay-bill`,
    { paymentMethod, razorpay_payment_id: razorpayPaymentId }
  );
  return data;
};

/** Update delivery address and re-assign delivery zone/partner */
export const updateSubscriptionAddress = async (
  id: string,
  deliveryAddress: DeliveryAddress
): Promise<{ subscription: Subscription }> => {
  const { data } = await client.patch<{ subscription: Subscription }>(
    `/api/mobile/subscriptions/${id}/address`,
    { deliveryAddress }
  );
  return data;
};

/** Cancel a subscription */
export const cancelSubscription = async (
  id: string
): Promise<{ subscription: Subscription }> => {
  const { data } = await client.delete<{ subscription: Subscription }>(
    `/api/mobile/subscriptions/${id}`
  );
  return data;
};

/** Fetch completed/single delivery details for customer view */
export const fetchDeliveryDetails = async (deliveryId: string) => {
  const { data } = await client.get(`/api/mobile/deliveries/${deliveryId}`);
  return data.delivery;
};
