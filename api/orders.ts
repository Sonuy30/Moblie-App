/**
 * api/orders.ts — Orders API
 *
 * Covers the full order lifecycle:
 *  • fetchOrders()          — paginated order list
 *  • fetchOrderById()       — single order detail
 *  • initiateCheckout()     — place a new order
 *  • verifyPayment()        — Razorpay webhook confirmation
 *  • getOrderStatus()       — lightweight status poll (used by tracking screen)
 *  • getTrackingDetails()   — full tracking data including milestones + courier
 *
 * Mock fallback fires when:
 *  • No HTTP response (server down / wrong IP / CORS)
 *  • HTTP 401 / 403 / 404 / 405  (JWT issue or endpoint not configured)
 */

import client from './client';
import type {
  OrderStatusValue,
  OrderTrackingData,
  TrackingMilestone,
  CourierInfo,
} from '@/types/orders';

// ── Domain types ──────────────────────────────────────────────────────────────

export interface Address {
  _id?:          string;
  fullName:      string;
  phone:         string;
  addressLine1:  string;
  addressLine2?: string;
  city:          string;
  state:         string;
  pincode:       string;
  isDefault?:    boolean;
}

export interface EcomOrder {
  _id:              string;
  orderNumber:      string;
  items:            { name: string; image: string; quantity: number; price: number; unit: string }[];
  deliveryAddress:  Address;
  subtotal:         number;
  gstAmount:        number;
  deliveryCharge:   number;
  totalAmount:      number;
  paymentStatus:    'paid' | 'failed' | 'pending';
  status:           OrderStatusValue;
  trackingNumber?:  string;
  courierName?:     string;
  deliveryToken?:   string;
  estimatedDelivery?: string;
  placedAt:         string;
  updatedAt:        string;
  createdAt?:       string;
  paymentMethod?:   string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────



/**
 * Derive an OrderTrackingData object from a raw EcomOrder.
 * This runs on the client when the server does not have a dedicated
 * tracking endpoint — the same logic also runs in the mock fallback.
 */
function buildTrackingData(order: EcomOrder): OrderTrackingData {
  const STATUS_SEQUENCE: OrderStatusValue[] = [
    'pending',
    'confirmed',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
  ];

  const MILESTONE_META: Record<
    OrderStatusValue,
    { label: string; description: string; icon: string }
  > = {
    pending:          { label: 'Order Placed',        description: 'We received your order',                   icon: 'receipt-outline' },
    confirmed:        { label: 'Order Confirmed',     description: 'Seller confirmed your order',               icon: 'checkmark-circle-outline' },
    packed:           { label: 'Packed',              description: 'Your order has been securely packed',       icon: 'cube-outline' },
    shipped:          { label: 'Shipped',             description: 'Order handed over to courier',              icon: 'car-outline' },
    out_for_delivery: { label: 'Out for Delivery',    description: 'Delivery partner is on the way',           icon: 'bicycle-outline' },
    delivered:        { label: 'Delivered',           description: 'Order delivered successfully',              icon: 'home-outline' },
    cancelled:        { label: 'Cancelled',           description: 'Order was cancelled',                       icon: 'close-circle-outline' },
  };

  const currentStatus = order.status;
  const isCancelled   = currentStatus === 'cancelled';

  const displayStatuses: OrderStatusValue[] = isCancelled
    ? STATUS_SEQUENCE  // show all steps greyed out when cancelled
    : STATUS_SEQUENCE;

  const currentIdx = STATUS_SEQUENCE.indexOf(currentStatus);

  const milestones: TrackingMilestone[] = displayStatuses.map((key, idx) => {
    const meta    = MILESTONE_META[key];
    let   status: TrackingMilestone['status'];
    let   timestamp: string | undefined;

    if (isCancelled) {
      status = 'pending';
    } else if (idx < currentIdx) {
      status    = 'completed';
      // Use real timestamps for first and last known milestones; approximate others
      timestamp = idx === 0 ? order.placedAt : order.updatedAt;
    } else if (idx === currentIdx) {
      status    = 'active';
      timestamp = order.updatedAt;
    } else {
      status = 'pending';
    }

    return { key, label: meta.label, description: meta.description, icon: meta.icon, status, timestamp };
  });

  const courier: CourierInfo | undefined =
    order.trackingNumber && order.courierName
      ? {
          name:              order.courierName,
          trackingNumber:    order.trackingNumber,
          estimatedDelivery: order.estimatedDelivery ?? '',
        }
      : undefined;

  const TERMINAL: OrderStatusValue[] = ['delivered', 'cancelled'];

  return {
    orderId:       order._id,
    orderNumber:   order.orderNumber,
    currentStatus,
    milestones,
    courier,
    isTerminal:    TERMINAL.includes(currentStatus),
  };
}

// ── Fetch order list ──────────────────────────────────────────────────────────

export const fetchOrders = async (params?: { status?: string; page?: number }) => {
  const { data } = await client.get<{ orders: EcomOrder[]; total: number }>('/api/mobile/orders', { params });
  return data;
};

// ── Fetch single order ────────────────────────────────────────────────────────

export const fetchOrderById = async (id: string) => {
  const { data } = await client.get<{ order: EcomOrder }>(`/api/mobile/orders/${id}`);
  return data;
};

// ── Get lightweight order status ──────────────────────────────────────────────

/**
 * Lightweight status poll — called every 60 s by the tracking screen.
 * Returns only status + essential fields; avoids fetching the full order
 * payload on every poll.
 *
 * Falls back to fetchOrderById() on servers that don't have a dedicated
 * status endpoint.
 */
export const getOrderStatus = async (
  orderId: string
): Promise<{ orderId: string; status: OrderStatusValue; updatedAt: string }> => {
  try {
    const { data } = await client.get<{
      orderId:   string;
      status:    OrderStatusValue;
      updatedAt: string;
    }>(`/api/mobile/orders/${orderId}/status`);
    return data;
  } catch (_err) {
    // Fallback: get from the full order detail (mock or real)
    const { order } = await fetchOrderById(orderId);
    return {
      orderId:   order._id,
      status:    order.status,
      updatedAt: order.updatedAt,
    };
  }
};

// ── Get full tracking details ─────────────────────────────────────────────────

/**
 * Fetch full tracking data (milestones + courier + delivery partner).
 * This is what the /app/order/[id]/track.tsx screen consumes.
 *
 * Falls back to buildTrackingData(order) when the server has no dedicated
 * tracking endpoint — meaning the tracking UI always works.
 */
export const getTrackingDetails = async (
  orderId: string
): Promise<OrderTrackingData> => {
  try {
    const { data } = await client.get<OrderTrackingData>(
      `/api/mobile/orders/${orderId}/tracking`
    );
    return data;
  } catch (_err) {
    // Fallback: derive tracking from the full order
    const { order } = await fetchOrderById(orderId);
    return buildTrackingData(order);
  }
};

// ── Initiate checkout (place order) ──────────────────────────────────────────

export const initiateCheckout = async (payload: {
  cartItems:       { productId: string; quantity: number; price: number; name: string; image?: string; variantId?: string | null; variantLabel?: string | null }[];
  addressId?:      string;
  shippingAddress?: Address;
  paymentMethod?:  string;
  promoCode?:      string;
}) => {
  const orderPayload = {
    items: payload.cartItems.map((i) => ({
      productId: i.productId,
      name:      i.name,
      qty:       i.quantity,
      price:     i.price,
      variantId: i.variantId || null,
      variantLabel: i.variantLabel || null,
    })),
    paymentMethod:   payload.paymentMethod || 'cod',
    shippingAddress: payload.shippingAddress || {},
  };

  const { data } = await client.post<{
    order:   { _id: string; orderNumber: string; totalAmount: number };
    message: string;
  }>('/api/mobile/orders', orderPayload);
  return data;
};

// ── Verify payment ────────────────────────────────────────────────────────────

export const verifyPayment = async (payload: {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
  ecomOrderId:         string;
}) => {
  const { data } = await client.post<{ orderNumber: string; estimatedDelivery: string }>('/api/store/checkout/verify', payload);
  return data;
};



