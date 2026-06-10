/**
 * api/returns.ts — Returns & Refunds API
 *
 * Endpoints:
 *  • initiateReturn()    — POST a new return request
 *  • getReturnStatus()   — GET the current return + refund status
 *  • getReturnHistory()  — GET all returns for an order
 *
 * Mock fallback fires when:
 *  • No HTTP response (server down / wrong IP / CORS)
 *  • HTTP 401 / 403 / 404 / 405  (endpoint not yet deployed)
 *
 * The mock layer maintains an in-session Map<returnId, ReturnRecord> so that
 * getReturnStatus() can echo back a realistic response for a just-created return.
 */

import client from './client';
import type { AxiosError } from 'axios';
import { Config } from '@/utils/config';
import type {
  InitiateReturnPayload,
  InitiateReturnResponse,
  GetReturnStatusResponse,
  ReturnRecord,
  ReturnMilestone,
  ReturnMilestoneKey,
  ReturnOverallStatus,
  RefundInfo,
  RefundMethod,
} from '@/types/returns';

// ── Helpers ───────────────────────────────────────────────────────────────────

function shouldUseMock(err: unknown): boolean {
  const axErr = err as AxiosError;
  if (!axErr?.response) return true;
  const s = axErr.response.status;
  return s === 401 || s === 403 || s === 404 || s === 405;
}

/** Generate a random return ID (mock only). */
function mockReturnId(): string {
  return `RTN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

// ── In-memory mock store (session only) ──────────────────────────────────────

const MOCK_RETURNS = new Map<string, ReturnRecord>();

// ── Milestone builder ─────────────────────────────────────────────────────────

const MILESTONE_SEQUENCE: ReturnMilestoneKey[] = [
  'return_requested',
  'pickup_scheduled',
  'item_picked_up',
  'qc_check',
  'refund_initiated',
  'refund_credited',
];

const MILESTONE_META: Record<ReturnMilestoneKey, { label: string; description: string; icon: string }> = {
  return_requested: {
    label:       'Return Requested',
    description: 'Your return request has been received',
    icon:        'return-down-back-outline',
  },
  pickup_scheduled: {
    label:       'Pickup Scheduled',
    description: 'We\'ve arranged a pickup from your address',
    icon:        'calendar-outline',
  },
  item_picked_up: {
    label:       'Item Picked Up',
    description: 'Delivery partner collected your item',
    icon:        'cube-outline',
  },
  qc_check: {
    label:       'Quality Check',
    description: 'Our team is inspecting the returned item',
    icon:        'shield-checkmark-outline',
  },
  refund_initiated: {
    label:       'Refund Initiated',
    description: 'Refund has been triggered to your payment method',
    icon:        'cash-outline',
  },
  refund_credited: {
    label:       'Refund Credited',
    description: 'Amount has been credited to your account',
    icon:        'checkmark-circle-outline',
  },
};

function buildMilestones(
  currentKey: ReturnMilestoneKey,
  createdAt:  string,
  updatedAt:  string,
  rejected:   boolean
): ReturnMilestone[] {
  const currentIdx = MILESTONE_SEQUENCE.indexOf(currentKey);

  return MILESTONE_SEQUENCE.map((key, idx) => {
    const meta = MILESTONE_META[key];

    let status: ReturnMilestone['status'];
    let timestamp: string | undefined;

    if (rejected && idx === currentIdx) {
      status    = 'failed';
      timestamp = updatedAt;
    } else if (rejected && idx > currentIdx) {
      status = 'pending';
    } else if (idx < currentIdx) {
      status    = 'completed';
      timestamp = idx === 0 ? createdAt : updatedAt;
    } else if (idx === currentIdx) {
      status    = 'active';
      timestamp = updatedAt;
    } else {
      status = 'pending';
    }

    return {
      key,
      label:       meta.label,
      description: meta.description,
      icon:        meta.icon,
      status,
      timestamp,
    };
  });
}

function buildMockReturn(
  returnId:  string,
  payload:   InitiateReturnPayload,
  orderNumber: string
): ReturnRecord {
  const now = new Date().toISOString();

  const refundMethodMap: Record<string, RefundMethod> = {
    cod:     'bank_transfer',
    upi:     'upi',
    online:  'original_payment',
    default: 'original_payment',
  };

  const refundMethod: RefundMethod = refundMethodMap['original_payment'];

  const estimatedRefundMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const refund: RefundInfo = {
    method:        refundMethod,
    amount:        0,   // will be recalculated on real backend
    estimatedDate: new Date(estimatedRefundMs).toISOString(),
  };

  const terminal: ReturnOverallStatus[] = ['completed', 'rejected'];
  const overallStatus: ReturnOverallStatus = 'active';

  return {
    returnId,
    orderId:     payload.orderId,
    orderNumber,
    items:       payload.items.map((i) => ({
      itemId:    i.itemId,
      name:      'Item',
      image:     '',
      quantity:  i.returnQty,
      price:     0,
      returnQty: i.returnQty,
    })),
    reason:      payload.reason,
    reasonDetail: payload.reasonDetail,
    method:      payload.method,
    milestones:  buildMilestones('return_requested', now, now, false),
    refund,
    overallStatus,
    isTerminal:  terminal.includes(overallStatus),
    createdAt:   now,
    updatedAt:   now,
    pickupAddress: payload.method === 'pickup'
      ? 'Your delivery address on file'
      : undefined,
  };
}

// ── initiateReturn ────────────────────────────────────────────────────────────

/**
 * Submit a new return request.
 *
 * For orders with photo evidence (damaged / wrong item), this uses multipart
 * form data so images are uploaded with the request.
 *
 * @param payload  Return details including items, reason, method, and optional photos.
 * @returns        The server-assigned returnId and estimated refund ETA.
 */
export const initiateReturn = async (
  payload: InitiateReturnPayload
): Promise<InitiateReturnResponse> => {
  if (Config.USE_MOCK_API) {
    console.info('[MOCK] initiateReturn fallback active');

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    const returnId    = mockReturnId();
    const orderNumber = `ORD-${payload.orderId.slice(-6).toUpperCase()}`;
    const mockReturn  = buildMockReturn(returnId, payload, orderNumber);

    MOCK_RETURNS.set(returnId, mockReturn);

    return {
      returnId,
      message:   'Return request submitted successfully! We\'ll schedule a pickup within 24 hours.',
      refundEta: mockReturn.refund?.estimatedDate,
    };
  }

  try {
    let response: InitiateReturnResponse;

    if (payload.photoUris && payload.photoUris.length > 0) {
      // Multipart form data for photo uploads
      const formData = new FormData();
      formData.append('orderId',      payload.orderId);
      formData.append('reason',       payload.reason);
      formData.append('method',       payload.method);
      if (payload.reasonDetail) {
        formData.append('reasonDetail', payload.reasonDetail);
      }
      formData.append('items',        JSON.stringify(payload.items));

      payload.photoUris.forEach((uri, idx) => {
        const filename = uri.split('/').pop() ?? `photo_${idx}.jpg`;
        const match    = /\.(\w+)$/.exec(filename);
        const type     = match ? `image/${match[1]}` : 'image/jpeg';
        // React Native FormData accepts { uri, name, type } objects
        formData.append('photos', { uri, name: filename, type } as unknown as Blob);
      });

      const { data } = await client.post<InitiateReturnResponse>(
        '/api/mobile/returns',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      response = data;
    } else {
      const { data } = await client.post<InitiateReturnResponse>(
        '/api/mobile/returns',
        {
          orderId:      payload.orderId,
          reason:       payload.reason,
          reasonDetail: payload.reasonDetail,
          method:       payload.method,
          items:        payload.items,
        }
      );
      response = data;
    }

    return response;
  } catch (err) {
    if (shouldUseMock(err)) {
      console.info('[MOCK] initiateReturn fallback active');

      // Simulate network delay
      await new Promise((r) => setTimeout(r, 600));

      const returnId    = mockReturnId();
      const orderNumber = `ORD-${payload.orderId.slice(-6).toUpperCase()}`;
      const mockReturn  = buildMockReturn(returnId, payload, orderNumber);

      MOCK_RETURNS.set(returnId, mockReturn);

      return {
        returnId,
        message:   'Return request submitted successfully! We\'ll schedule a pickup within 24 hours.',
        refundEta: mockReturn.refund?.estimatedDate,
      };
    }
    throw err;
  }
};

// ── getReturnStatus ───────────────────────────────────────────────────────────

/**
 * Fetch the current status of a return request.
 * Used by the return-status screen with TanStack Query + 60s refetchInterval.
 *
 * @param returnId  The returnId returned by initiateReturn().
 */
export const getReturnStatus = async (
  returnId: string
): Promise<ReturnRecord> => {
  if (Config.USE_MOCK_API) {
    console.info(`[MOCK] getReturnStatus fallback for: ${returnId}`);

    await new Promise((r) => setTimeout(r, 300));

    const record = MOCK_RETURNS.get(returnId);
    if (record) return record;

    // No in-session record — synthesise a plausible one
    const now   = new Date().toISOString();
    const synth: ReturnRecord = {
      returnId,
      orderId:      'unknown',
      orderNumber:  'ORD-UNKNOWN',
      items:        [],
      reason:       'other',
      method:       'pickup',
      milestones:   buildMilestones('return_requested', now, now, false),
      overallStatus: 'active',
      isTerminal:   false,
      createdAt:    now,
      updatedAt:    now,
    };
    return synth;
  }

  try {
    const { data } = await client.get<GetReturnStatusResponse>(
      `/api/mobile/returns/${returnId}`
    );
    return data.return;
  } catch (err) {
    if (shouldUseMock(err)) {
      console.info(`[MOCK] getReturnStatus fallback for: ${returnId}`);

      await new Promise((r) => setTimeout(r, 300));

      const record = MOCK_RETURNS.get(returnId);
      if (record) return record;

      // No in-session record — synthesise a plausible one
      const now   = new Date().toISOString();
      const synth: ReturnRecord = {
        returnId,
        orderId:      'unknown',
        orderNumber:  'ORD-UNKNOWN',
        items:        [],
        reason:       'other',
        method:       'pickup',
        milestones:   buildMilestones('return_requested', now, now, false),
        overallStatus: 'active',
        isTerminal:   false,
        createdAt:    now,
        updatedAt:    now,
      };
      return synth;
    }
    throw err;
  }
};

// ── getReturnHistory ──────────────────────────────────────────────────────────

/**
 * Fetch all return requests for a given order.
 * An order can have multiple returns (e.g. if original return was rejected).
 *
 * @param orderId  The order ID.
 */
export const getReturnHistory = async (
  orderId: string
): Promise<ReturnRecord[]> => {
  if (Config.USE_MOCK_API) {
    console.info(`[MOCK] getReturnHistory fallback for order: ${orderId}`);
    // Return in-session returns for this order
    const sessionReturns = Array.from(MOCK_RETURNS.values()).filter(
      (r) => r.orderId === orderId
    );
    return sessionReturns;
  }

  try {
    const { data } = await client.get<{ returns: ReturnRecord[] }>(
      `/api/mobile/orders/${orderId}/returns`
    );
    return data.returns;
  } catch (err) {
    if (shouldUseMock(err)) {
      console.info(`[MOCK] getReturnHistory fallback for order: ${orderId}`);
      // Return in-session returns for this order
      const sessionReturns = Array.from(MOCK_RETURNS.values()).filter(
        (r) => r.orderId === orderId
      );
      return sessionReturns;
    }
    throw err;
  }
};
