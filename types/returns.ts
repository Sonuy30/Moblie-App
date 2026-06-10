/**
 * types/returns.ts — Return & Refund domain types
 *
 * Shared by api/returns.ts, app/order/[id]/return.tsx, and
 * app/order/[id]/return-status.tsx.
 *
 * ── Return state machine ──────────────────────────────────────────────────────
 *
 *  return_requested ──► pickup_scheduled ──► item_picked_up
 *    ──► qc_check ──► refund_initiated ──► refund_credited
 *
 *  Any stage → rejected  (QC failure, outside window, etc.)
 */

// ── Return window constant ────────────────────────────────────────────────────

/**
 * Number of days after delivery within which a return can be initiated.
 * Business rule: 7 days for AITS Shop.
 */
export const RETURN_WINDOW_DAYS = 7;

// ── Return reasons ────────────────────────────────────────────────────────────

export type ReturnReason =
  | 'damaged_product'
  | 'wrong_item'
  | 'size_issue'
  | 'changed_mind'
  | 'other';

export const RETURN_REASON_META: Record<
  ReturnReason,
  { label: string; requiresPhoto: boolean; icon: string }
> = {
  damaged_product: { label: 'Damaged Product',   requiresPhoto: true,  icon: 'warning-outline' },
  wrong_item:      { label: 'Wrong Item Sent',    requiresPhoto: true,  icon: 'swap-horizontal-outline' },
  size_issue:      { label: 'Size / Fit Issue',   requiresPhoto: false, icon: 'resize-outline' },
  changed_mind:    { label: 'Changed Mind',       requiresPhoto: false, icon: 'heart-dislike-outline' },
  other:           { label: 'Other',              requiresPhoto: false, icon: 'ellipsis-horizontal-outline' },
};

// ── Return method ─────────────────────────────────────────────────────────────

export type ReturnMethod = 'pickup' | 'dropoff';

export const RETURN_METHOD_META: Record<
  ReturnMethod,
  { label: string; description: string; icon: string }
> = {
  pickup:  {
    label:       'Doorstep Pickup',
    description: 'Our partner will collect the item from your address',
    icon:        'bicycle-outline',
  },
  dropoff: {
    label:       'Drop-off at Store',
    description: 'Drop the item at the nearest AITS collection point',
    icon:        'storefront-outline',
  },
};

// ── Return item ───────────────────────────────────────────────────────────────

/**
 * One item being returned from an order.
 * A single return request can cover multiple items.
 */
export interface ReturnItem {
  /** productId or order-item index */
  itemId:       string;
  name:         string;
  image:        string;
  quantity:     number;
  price:        number;
  /** Quantity the customer actually wants to return (1…quantity) */
  returnQty:    number;
}

// ── Return request payload ────────────────────────────────────────────────────

/** Body sent to initiateReturn(). */
export interface InitiateReturnPayload {
  orderId:      string;
  items:        Pick<ReturnItem, 'itemId' | 'returnQty'>[];
  reason:       ReturnReason;
  reasonDetail?: string;         // free-text when reason = 'other'
  method:       ReturnMethod;
  /** Array of local file URIs (max 3) — uploaded as multipart on mobile. */
  photoUris?:   string[];
}

// ── Return milestone ──────────────────────────────────────────────────────────

export type ReturnMilestoneKey =
  | 'return_requested'
  | 'pickup_scheduled'
  | 'item_picked_up'
  | 'qc_check'
  | 'refund_initiated'
  | 'refund_credited';

export type ReturnMilestoneStatus = 'completed' | 'active' | 'pending' | 'failed';

export interface ReturnMilestone {
  key:         ReturnMilestoneKey;
  label:       string;
  description: string;
  icon:        string;
  status:      ReturnMilestoneStatus;
  timestamp?:  string;
  /** Shown only on the QC step if the check failed. */
  failureNote?: string;
}

// ── Refund info ───────────────────────────────────────────────────────────────

export type RefundMethod =
  | 'original_payment'    // back to card/UPI/netbanking
  | 'store_credit'        // AITS wallet credits
  | 'bank_transfer'       // manual NEFT (COD orders)
  | 'upi';                // UPI transfer

export interface RefundInfo {
  method:           RefundMethod;
  amount:           number;
  /** Bank / UPI reference number once credited. */
  referenceId?:     string;
  /** ISO-8601 ETA for when the refund will be credited. */
  estimatedDate?:   string;
  /** ISO-8601 timestamp when refund was actually credited. */
  creditedAt?:      string;
}

// ── Return record ─────────────────────────────────────────────────────────────

export type ReturnOverallStatus =
  | 'pending'
  | 'active'
  | 'completed'
  | 'rejected';

export interface ReturnRecord {
  returnId:       string;
  orderId:        string;
  orderNumber:    string;
  items:          ReturnItem[];
  reason:         ReturnReason;
  reasonDetail?:  string;
  method:         ReturnMethod;
  milestones:     ReturnMilestone[];
  refund?:        RefundInfo;
  overallStatus:  ReturnOverallStatus;
  /** True when the return has reached a terminal state. */
  isTerminal:     boolean;
  createdAt:      string;
  updatedAt:      string;
  /** Pickup address (only for pickup method). */
  pickupAddress?: string;
  /** Collection point address (only for dropoff method). */
  dropoffAddress?: string;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface InitiateReturnResponse {
  returnId:    string;
  message:     string;
  /** Estimated refund credit date (ISO-8601). */
  refundEta?:  string;
}

export interface GetReturnStatusResponse {
  return: ReturnRecord;
}

// ── Return eligibility ────────────────────────────────────────────────────────

export interface ReturnEligibility {
  eligible:          boolean;
  /** Days remaining in the return window (0 when expired). */
  daysRemaining:     number;
  /** ISO-8601 deadline date for return initiation. */
  deadline:          string;
  /** Reason why it's ineligible (e.g. "Return window expired"). */
  ineligibleReason?: string;
}

/**
 * Calculate whether an order is within the return window.
 * @param deliveredAt  ISO-8601 delivery timestamp.
 * @param windowDays   Override the default RETURN_WINDOW_DAYS.
 */
export function getReturnEligibility(
  deliveredAt: string,
  windowDays = RETURN_WINDOW_DAYS
): ReturnEligibility {
  const deliveredMs = new Date(deliveredAt).getTime();
  const deadlineMs  = deliveredMs + windowDays * 24 * 60 * 60 * 1000;
  const nowMs       = Date.now();
  const msRemaining = deadlineMs - nowMs;
  const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

  return {
    eligible:      nowMs < deadlineMs,
    daysRemaining,
    deadline:      new Date(deadlineMs).toISOString(),
    ineligibleReason: nowMs >= deadlineMs ? 'Return window expired' : undefined,
  };
}
