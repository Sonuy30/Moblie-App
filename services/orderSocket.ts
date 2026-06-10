/**
 * services/orderSocket.ts — AITS Delivery WebSocket stub
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  TODO: AITS DELIVERY SYSTEM INTEGRATION                                ║
 * ║                                                                          ║
 * ║  This module defines the WebSocket interface for real-time delivery      ║
 * ║  partner tracking. The interface is fully typed and ready for            ║
 * ║  production implementation.                                              ║
 * ║                                                                          ║
 * ║  Implementation checklist:                                               ║
 * ║    [ ] Replace the stub WebSocket with a real ws:// connection           ║
 * ║    [ ] Add reconnection logic (exponential back-off)                     ║
 * ║    [ ] Wire up to the delivery partner's mobile app (AITS Delivery)      ║
 * ║    [ ] Integrate with map in track.tsx (View on Map button)              ║
 * ║    [ ] Add JWT auth header on WS handshake                               ║
 * ║    [ ] Emit 'subscribe_order' / 'unsubscribe_order' events               ║
 * ║    [ ] Server: emit 'location_update' on each driver GPS tick            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Usage (in a React component / hook):
 *
 *   import { orderSocket } from '@/services/orderSocket';
 *
 *   // Connect when out_for_delivery
 *   orderSocket.connect(orderId);
 *
 *   // Listen for location updates
 *   const unsub = orderSocket.onLocationUpdate((event) => {
 *     setPartnerLocation({ lat: event.latitude, lng: event.longitude });
 *   });
 *
 *   // Cleanup
 *   return () => { unsub(); orderSocket.disconnect(); };
 */

import { Config } from '@/utils/config';
import type { LocationUpdateEvent } from '@/types/orders';

// ── WebSocket connection state ────────────────────────────────────────────────

type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// ── Subscriber registry ───────────────────────────────────────────────────────

type LocationUpdateCallback = (event: LocationUpdateEvent) => void;
type UnsubscribeFn = () => void;

// ── Internal module state ─────────────────────────────────────────────────────

let _socket:      WebSocket | null = null;
let _orderId:     string | null = null;
let _state:       SocketConnectionState = 'disconnected';
const _subscribers: Set<LocationUpdateCallback> = new Set();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the WebSocket server URL.
 *
 * TODO: Replace with a proper WS URL builder that includes auth token
 *       in the query string (or as a first message payload).
 *       e.g.: `${Config.WS_URL}/delivery/track/${orderId}?token=${accessToken}`
 */
function buildWsUrl(orderId: string): string {
  const base = Config.WS_URL || 'ws://localhost:3001';
  return `${base}/delivery/track/${orderId}`;
}

function notifySubscribers(event: LocationUpdateEvent): void {
  _subscribers.forEach((cb) => {
    try {
      cb(event);
    } catch (e) {
      console.warn('[OrderSocket] Subscriber threw during location update:', e);
    }
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export const orderSocket = {
  /**
   * Establish a WebSocket connection for real-time tracking of the given order.
   *
   * Safe to call multiple times — if already connected to the same order,
   * this is a no-op.  If connected to a different order, the old socket is
   * closed first.
   *
   * TODO: Replace the stub logic with a real WebSocket connection.
   */
  connect(orderId: string): void {
    // Already connected to this order — no-op
    if (_socket && _orderId === orderId && _state === 'connected') {
      return;
    }

    // Disconnect from any previous order
    this.disconnect();

    _orderId = orderId;
    _state   = 'connecting';

    if (__DEV__) {
      console.info(`[OrderSocket] TODO: Connect to ${buildWsUrl(orderId)}`);
      console.info('[OrderSocket] Stub active — no real WebSocket created in dev.');
      // Simulate connected state after a tick so callers can subscribe
      setTimeout(() => { _state = 'connected'; }, 0);
      return;
    }

    // ── PRODUCTION IMPLEMENTATION (uncomment when ready) ─────────────────
    // try {
    //   _socket = new WebSocket(buildWsUrl(orderId));
    //
    //   _socket.onopen = () => {
    //     _state = 'connected';
    //     // Authenticate
    //     _socket?.send(JSON.stringify({ type: 'subscribe_order', orderId }));
    //     console.info('[OrderSocket] Connected and subscribed to', orderId);
    //   };
    //
    //   _socket.onmessage = (event) => {
    //     try {
    //       const msg = JSON.parse(event.data as string) as { type: string; payload: LocationUpdateEvent };
    //       if (msg.type === 'location_update') {
    //         notifySubscribers(msg.payload);
    //       }
    //     } catch (e) {
    //       console.warn('[OrderSocket] Failed to parse WS message:', e);
    //     }
    //   };
    //
    //   _socket.onerror = (error) => {
    //     _state = 'error';
    //     console.error('[OrderSocket] WebSocket error:', error);
    //   };
    //
    //   _socket.onclose = () => {
    //     _state = 'disconnected';
    //     console.info('[OrderSocket] Disconnected from', orderId);
    //     // TODO: Add exponential back-off reconnection here
    //   };
    // } catch (e) {
    //   _state = 'error';
    //   console.error('[OrderSocket] Failed to create WebSocket:', e);
    // }
  },

  /**
   * Gracefully close the WebSocket connection.
   * Clears all state but preserves subscribers (they'll reconnect).
   */
  disconnect(): void {
    if (_socket) {
      try {
        _socket.close(1000, 'Client disconnect');
      } catch {
        // ignore
      }
      _socket = null;
    }
    _orderId = null;
    _state   = 'disconnected';

    if (__DEV__) {
      console.info('[OrderSocket] Disconnected (stub).');
    }
  },

  /**
   * Subscribe to real-time delivery partner location updates.
   *
   * @param callback  Called with every LocationUpdateEvent from the server.
   * @returns         Unsubscribe function — call it in useEffect cleanup.
   *
   * @example
   *   const unsub = orderSocket.onLocationUpdate((e) => setMarker(e));
   *   return () => unsub();
   */
  onLocationUpdate(callback: LocationUpdateCallback): UnsubscribeFn {
    _subscribers.add(callback);
    return () => {
      _subscribers.delete(callback);
    };
  },

  /**
   * Simulate a location update — useful for testing the UI without a live backend.
   * Only callable in __DEV__ mode; throws in production.
   *
   * TODO: Remove this method (or guard it more strictly) before go-live.
   */
  simulateLocationUpdate(event: LocationUpdateEvent): void {
    if (!__DEV__) {
      throw new Error('[OrderSocket] simulateLocationUpdate is only for development.');
    }
    notifySubscribers(event);
  },

  // ── Read-only state ───────────────────────────────────────────────────────

  /** Current connection state. Useful for UI indicators. */
  get state(): SocketConnectionState {
    return _state;
  },

  /** The order ID this socket is currently connected to, or null. */
  get currentOrderId(): string | null {
    return _orderId;
  },
};
