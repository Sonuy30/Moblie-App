/**
 * e2e/orders.test.ts
 *
 * Tier 1 & 2 E2E Tests: Order tracking, notifications, settings.
 * Verifies order list fetching, tracking detail resolution, notification preference loading/toggling,
 * and order return request initiation and status tracking.
 */

jest.mock('@/utils/config', () => {
  const actual = jest.requireActual('../utils/config');
  return {
    ...actual,
    Config: {
      ...actual.Config,
      USE_MOCK_API: true,
    },
  };
});

import {
  fetchOrders,
  fetchOrderById,
  getOrderStatus,
  getTrackingDetails,
} from '@/api/orders';
import { useNotificationStore } from '@/stores/notificationStore';
import { initiateReturn, getReturnStatus } from '@/api/returns';

describe('E2E Orders Tracking, Notifications & Settings', () => {
  const TEST_ORDER_ID = 'mock-order-1';

  beforeEach(() => {
    // reset notification store preferences if needed
  });

  // Test 1: Fetch Orders
  it('should fetch orders list successfully', async () => {
    const res = await fetchOrders();
    expect(res.orders).toBeDefined();
    expect(Array.isArray(res.orders)).toBe(true);
  });

  // Test 2: Fetch Order by ID
  it('should fetch single order detail and verify structure', async () => {
    const res = await fetchOrders();
    if (res.orders.length > 0) {
      console.warn("RUNNING ASSERTIONS IN TEST 2");
      const orderId = res.orders[0]._id;
      const detail = await fetchOrderById(orderId);
      expect(detail.order).toBeDefined();
      expect(detail.order._id).toBe(orderId);
      expect(detail.order.orderNumber).toBeDefined();
    } else {
      console.warn("WARNING: NO ORDERS FOUND IN TEST 2 - ASSERTIONS SKIPPED!");
    }
  });

  // Test 3: Non-existent order id
  it('should handle non-existent order ID lookup gracefully', async () => {
    await expect(fetchOrderById('non-existent-id')).rejects.toThrow();
  });

  // Test 4: Get Order Status
  it('should fetch lightweight order status', async () => {
    const res = await fetchOrders();
    if (res.orders.length > 0) {
      const orderId = res.orders[0]._id;
      const statusRes = await getOrderStatus(orderId);
      expect(statusRes.orderId).toBe(orderId);
      expect(statusRes.status).toBeDefined();
    }
  });

  // Test 5: Get Tracking Details
  it('should fetch full tracking details including milestones and courier details', async () => {
    const res = await fetchOrders();
    if (res.orders.length > 0) {
      const orderId = res.orders[0]._id;
      const tracking = await getTrackingDetails(orderId);
      expect(tracking.orderId).toBe(orderId);
      expect(tracking.milestones).toBeDefined();
      expect(tracking.milestones.length).toBeGreaterThan(0);
    }
  });

  // Test 6: Load notification preferences
  it('should load default notification preferences', async () => {
    await useNotificationStore.getState().loadPreferences();
    const prefs = useNotificationStore.getState().preferences;
    expect(prefs.ORDER_UPDATE).toBe(true);
    expect(prefs.PROMO).toBe(false);
  });

  // Test 7: Toggle notification category
  it('should toggle specific notification category and persist changes', async () => {
    await useNotificationStore.getState().loadPreferences();
    expect(useNotificationStore.getState().preferences.FLASH_SALE).toBe(true);

    await useNotificationStore.getState().toggleCategory('FLASH_SALE');
    expect(useNotificationStore.getState().preferences.FLASH_SALE).toBe(false);

    await useNotificationStore.getState().toggleCategory('FLASH_SALE');
    expect(useNotificationStore.getState().preferences.FLASH_SALE).toBe(true);
  });

  // Test 8: Set all preferences
  it('should set all preferences at once', async () => {
    const newPrefs = {
      ORDER_UPDATE: false,
      PRICE_DROP: false,
      FLASH_SALE: false,
      PROMO: true,
    };
    await useNotificationStore.getState().setAllPreferences(newPrefs);
    expect(useNotificationStore.getState().preferences).toEqual(newPrefs);
  });

  // Test 9: Check category enabled
  it('should check if a specific category is enabled', () => {
    const isPromoEnabled = useNotificationStore
      .getState()
      .isCategoryEnabled('PROMO');
    expect(isPromoEnabled).toBe(useNotificationStore.getState().preferences.PROMO);
  });

  // Test 10: Submit Return Request
  it('should submit a return request for an order', async () => {
    const returnPayload = {
      orderId: TEST_ORDER_ID,
      reason: 'damaged_product' as const,
      reasonDetail: 'The steel tube was dented on arrival.',
      method: 'pickup' as const,
      items: [{ itemId: 'item-1', returnQty: 1 }],
    };

    const res = await initiateReturn(returnPayload);
    expect(res.returnId).toBeDefined();
    expect(res.message).toContain('submitted successfully');
  });

  // Test 11: Get Return Request Status
  it('should retrieve return request status and verify return milestones', async () => {
    const returnPayload = {
      orderId: TEST_ORDER_ID,
      reason: 'wrong_item' as const,
      reasonDetail: 'Received 12mm instead of 10mm.',
      method: 'pickup' as const,
      items: [{ itemId: 'item-1', returnQty: 2 }],
    };

    const initRes = await initiateReturn(returnPayload);
    const returnId = initRes.returnId;

    const statusRes = await getReturnStatus(returnId);
    expect(statusRes.returnId).toBe(returnId);
    expect(statusRes.overallStatus).toBe('active');
    expect(statusRes.reason).toBe(returnPayload.reason);
    expect(statusRes.milestones).toHaveLength(6);
    expect(statusRes.milestones[0].status).toBe('active');
  });
});
