/**
 * types/orders.ts — Order tracking domain types
 *
 * Canonical type definitions for the order lifecycle, tracking milestones,
 * courier information, and the delivery partner (AITS Delivery system stub).
 *
 * These types are referenced by:
 *  • api/orders.ts  — API response shapes
 *  • hooks/useOrders.ts (extended)
 *  • app/order/[id]/track.tsx — tracking screen UI
 *  • services/orderSocket.ts — WebSocket location updates
 *
 * ── Milestone status machine ──────────────────────────────────────────────
 *
 *  pending ──► confirmed ──► packed ──► shipped ──► out_for_delivery ──► delivered
 *                                                                    └──► cancelled  (any stage)
 */

// ── Order status ──────────────────────────────────────────────────────────────

/** All possible lifecycle states of an order. */
export type OrderStatusValue =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// ── Milestone ─────────────────────────────────────────────────────────────────

/** Visual / display state of a single timeline step. */
export type MilestoneStatus = 'completed' | 'active' | 'pending';

/**
 * One step in the vertical order-tracking timeline.
 *
 * @property key         Machine-readable identifier (matches OrderStatusValue).
 * @property label       Human-readable label shown in the UI.
 * @property description Short supporting text (e.g. "Your order is being packed").
 * @property icon        Ionicons icon name for this step.
 * @property status      Whether this step is done, current, or upcoming.
 * @property timestamp   ISO-8601 timestamp when this milestone was reached (undefined = future).
 */
export interface TrackingMilestone {
  key:         OrderStatusValue;
  label:       string;
  description: string;
  icon:        string;
  status:      MilestoneStatus;
  timestamp?:  string;
}

// ── Courier ───────────────────────────────────────────────────────────────────

/**
 * Courier/logistics provider details attached to a shipped order.
 *
 * @property name              Courier company name (e.g. "Delhivery", "Blue Dart").
 * @property trackingNumber    AWB / consignment number.
 * @property estimatedDelivery ISO-8601 date string for expected delivery.
 * @property trackingUrl       Optional deep link to the courier's tracking page.
 * @property phone             Optional customer-care number for the courier.
 */
export interface CourierInfo {
  name:               string;
  trackingNumber:     string;
  estimatedDelivery:  string;
  trackingUrl?:       string;
  phone?:             string;
}

// ── Delivery Partner (AITS Delivery system) ───────────────────────────────────

/**
 * Delivery partner assigned to an order (populated when status = out_for_delivery).
 * This is the data model for the AITS Delivery app integration.
 *
 * @property id          Unique partner ID from the delivery system.
 * @property name        Partner's full name.
 * @property phone       Partner's phone number (used for "Call" button).
 * @property vehicleNo   Vehicle registration number (optional).
 * @property rating      Average rating (0–5).
 * @property photoUrl    Profile photo URL (optional).
 * @property location    Last-known GPS coordinates (updated via WebSocket).
 */
export interface DeliveryPartner {
  id:         string;
  name:       string;
  phone:      string;
  vehicleNo?: string;
  rating?:    number;
  photoUrl?:  string;
  location?:  {
    latitude:  number;
    longitude: number;
    /** ISO-8601 timestamp of the last location update. */
    updatedAt: string;
  };
}

// ── Order tracking response ───────────────────────────────────────────────────

/**
 * Full tracking data returned by getTrackingDetails() and getOrderStatus().
 * This is the shape consumed by the order tracking screen.
 */
export interface OrderTrackingData {
  orderId:         string;
  orderNumber:     string;
  currentStatus:   OrderStatusValue;
  milestones:      TrackingMilestone[];
  courier?:        CourierInfo;
  deliveryPartner?: DeliveryPartner;
  /** True when the order is in a terminal state (delivered or cancelled). */
  isTerminal:      boolean;
}

// ── Location update (WebSocket event) ────────────────────────────────────────

/**
 * Payload emitted by the AITS Delivery WebSocket on each location push.
 * Consumed by services/orderSocket.ts → onLocationUpdate callback.
 */
export interface LocationUpdateEvent {
  orderId:   string;
  partnerId: string;
  latitude:  number;
  longitude: number;
  bearing?:  number;   // degrees 0–360 for map arrow rotation
  speed?:    number;   // km/h
  timestamp: string;
}
