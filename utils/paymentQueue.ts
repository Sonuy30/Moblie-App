/**
 * paymentQueue.ts — Payment Drop Protection
 *
 * Problem: If the app is killed or loses network AFTER Razorpay deducts the
 * customer's money but BEFORE `verifySubscriptionPayment` resolves, the
 * subscription stays "unactivated" — money gone, no delivery.
 *
 * Solution:
 *  1. Save the Razorpay receipt to AsyncStorage the MOMENT the payment
 *     handler fires (before any API call).
 *  2. On every app launch, call `recoverPendingPayments()` to retry any
 *     unverified payments.
 *  3. On successful verification, clear the queue entry.
 *
 * Usage:
 *   // In Razorpay handler — BEFORE calling the API:
 *   await savePendingPayment({ razorpay_order_id, razorpay_payment_id,
 *     razorpay_signature, startDate, deliveryAddress });
 *
 *   // In app/_layout.tsx useEffect:
 *   await recoverPendingPayments();
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifySubscriptionPayment } from '@/api/subscriptions';
import type { DeliveryAddress } from '@/types/subscription';

const QUEUE_KEY = 'aits_pending_sub_payments';

export interface PendingPayment {
  id: string;             // Unique ID for this queue entry (UUID-ish)
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  startDate: string;
  deliveryAddress: DeliveryAddress;
  savedAt: number;        // Unix timestamp — for expiry checks
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function readQueue(): Promise<PendingPayment[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PendingPayment[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingPayment[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage failure is non-fatal — payment still proceeded
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a Razorpay receipt to the queue BEFORE calling the verify API.
 * Call this immediately inside the Razorpay `handler` callback.
 */
export async function savePendingPayment(
  payment: Omit<PendingPayment, 'id' | 'savedAt'>
): Promise<void> {
  const queue = await readQueue();
  // De-duplicate by razorpay_payment_id
  const existing = queue.findIndex((p) => p.razorpay_payment_id === payment.razorpay_payment_id);
  const entry: PendingPayment = {
    ...payment,
    id: `${payment.razorpay_payment_id}_${Date.now()}`,
    savedAt: Date.now(),
  };
  if (existing >= 0) {
    queue[existing] = entry;
  } else {
    queue.push(entry);
  }
  await writeQueue(queue);
}

/**
 * Remove a payment from the queue after successful verification.
 */
export async function clearPendingPayment(razorpay_payment_id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((p) => p.razorpay_payment_id !== razorpay_payment_id));
}

/**
 * Check for unverified payments on app launch and retry them.
 * Call this once from `app/_layout.tsx` after session is restored.
 *
 * @returns number of payments successfully recovered
 */
export async function recoverPendingPayments(): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  // Expire entries older than 48 hours — Razorpay signature TTL
  const EXPIRY_MS = 48 * 60 * 60 * 1000;
  const fresh = queue.filter((p) => Date.now() - p.savedAt < EXPIRY_MS);
  if (fresh.length !== queue.length) {
    // Write back pruned queue
    await writeQueue(fresh);
  }
  if (fresh.length === 0) return 0;

  let recovered = 0;
  for (const payment of fresh) {
    try {
      await verifySubscriptionPayment({
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
        startDate: payment.startDate,
        deliveryAddress: payment.deliveryAddress,
      });
      await clearPendingPayment(payment.razorpay_payment_id);
      recovered++;
    } catch {
      // Verification might fail if it was already processed server-side —
      // that's fine. We'll try again next launch until expiry.
    }
  }
  return recovered;
}
