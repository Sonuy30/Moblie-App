/**
 * stores/__tests__/cartStore.test.ts
 *
 * Unit tests for the cart Zustand store — pure state transition logic.
 * No React, no native modules. Runs in a plain Node environment.
 *
 * Coverage:
 *  • addItem          — new item, duplicate accumulation, maxQty cap
 *  • removeItem       — direct removal, key-based targeting with variant
 *  • updateQty        — clamping, zero → remove pathway
 *  • clearCart        — full wipe
 *  • bulkDiscount     — 5% at ≥20 units, 10% at ≥50 units, 0% below 20
 *  • gst              — 18% on (subtotal − bulkDiscount)
 *  • deliveryCharge   — ₹0 above ₹999, ₹99 below
 *  • grandTotal       — composition of all above
 */

// ── Isolate from AsyncStorage persistence ──────────────────────────────────
// The store uses zustand/middleware persist which calls AsyncStorage.
// We mock it before the store module is imported.
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:    jest.fn(() => Promise.resolve(null)),
  setItem:    jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear:      jest.fn(() => Promise.resolve()),
  getAllKeys:  jest.fn(() => Promise.resolve([])),
  multiGet:   jest.fn(() => Promise.resolve([])),
  multiSet:   jest.fn(() => Promise.resolve()),
}));

import { useCartStore } from '../cartStore';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<{
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  maxQty: number;
  unit: string;
  variantId?: string;
  variantLabel?: string;
}> = {}) {
  return {
    productId: 'prod-001',
    slug:      'steel-bar-10mm',
    name:      'Steel Bar 10mm',
    image:     'https://example.com/img.jpg',
    price:     500,
    maxQty:    100,
    unit:      'kg',
    ...overrides,
  };
}

/** Get a fresh store snapshot after each test. */
function store() {
  return useCartStore.getState();
}

// ── Reset between tests ────────────────────────────────────────────────────
beforeEach(() => {
  useCartStore.getState().clearCart();
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. addItem
// ═══════════════════════════════════════════════════════════════════════════

describe('addItem', () => {
  test('adds a brand-new item with quantity 1', () => {
    store().addItem(makeItem());
    const { items } = store();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(1);
    expect(items[0].productId).toBe('prod-001');
  });

  test('increments quantity when same product is added again', () => {
    store().addItem(makeItem());
    store().addItem(makeItem());
    expect(store().items[0].quantity).toBe(2);
  });

  test('adds multiple distinct products as separate entries', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().addItem(makeItem({ productId: 'prod-002', name: 'Steel Rod 12mm' }));
    expect(store().items).toHaveLength(2);
  });

  test('treats same productId with different variantId as distinct items', () => {
    store().addItem(makeItem({ variantId: 'v-6m' }));
    store().addItem(makeItem({ variantId: 'v-9m' }));
    expect(store().items).toHaveLength(2);
  });

  test('does not exceed maxQty when same item added many times', () => {
    for (let i = 0; i < 200; i++) {
      store().addItem(makeItem({ maxQty: 10 }));
    }
    expect(store().items[0].quantity).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. removeItem
// ═══════════════════════════════════════════════════════════════════════════

describe('removeItem', () => {
  test('removes an item by productId', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().addItem(makeItem({ productId: 'prod-002' }));
    store().removeItem('prod-001');
    const { items } = store();
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe('prod-002');
  });

  test('removes only the specific variant, leaving other variants intact', () => {
    store().addItem(makeItem({ variantId: 'v-6m' }));
    store().addItem(makeItem({ variantId: 'v-9m' }));
    store().removeItem('prod-001', 'v-6m');
    const { items } = store();
    expect(items).toHaveLength(1);
    expect(items[0].variantId).toBe('v-9m');
  });

  test('is a no-op when item does not exist', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().removeItem('prod-999');
    expect(store().items).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. updateQty
// ═══════════════════════════════════════════════════════════════════════════

describe('updateQty', () => {
  test('updates quantity to specified value', () => {
    store().addItem(makeItem({ productId: 'prod-001', maxQty: 100 }));
    store().updateQty('prod-001', 25);
    expect(store().items[0].quantity).toBe(25);
  });

  test('clamps quantity at maxQty', () => {
    store().addItem(makeItem({ productId: 'prod-001', maxQty: 50 }));
    store().updateQty('prod-001', 999);
    expect(store().items[0].quantity).toBe(50);
  });

  test('removes item when qty is updated to 0', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().updateQty('prod-001', 0);
    expect(store().items).toHaveLength(0);
  });

  test('removes item when qty is updated to negative value', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().updateQty('prod-001', -5);
    expect(store().items).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. clearCart
// ═══════════════════════════════════════════════════════════════════════════

describe('clearCart', () => {
  test('empties all items', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().addItem(makeItem({ productId: 'prod-002' }));
    store().clearCart();
    expect(store().items).toHaveLength(0);
  });

  test('resets promoCode to null', () => {
    store().setPromoCode('STEEL10');
    store().clearCart();
    expect(store().promoCode).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. totalItems
// ═══════════════════════════════════════════════════════════════════════════

describe('totalItems', () => {
  test('sums quantities across all items', () => {
    store().addItem(makeItem({ productId: 'prod-001' }));
    store().addItem(makeItem({ productId: 'prod-001' })); // +1 to qty
    store().addItem(makeItem({ productId: 'prod-002' }));
    // prod-001: qty=2, prod-002: qty=1
    expect(store().totalItems()).toBe(3);
  });

  test('returns 0 when cart is empty', () => {
    expect(store().totalItems()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. bulkDiscount — tier thresholds: 5% at ≥20 units, 10% at ≥50 units
// ═══════════════════════════════════════════════════════════════════════════

describe('bulkDiscount — tier-based batch discount formula', () => {
  test('no discount for qty < 20', () => {
    // price=100, qty=10 → discount = 0
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 10);
    expect(store().bulkDiscount()).toBe(0);
  });

  test('exactly 19 units → no discount (boundary below 5% tier)', () => {
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 19);
    expect(store().bulkDiscount()).toBe(0);
  });

  test('exactly 20 units → 5% discount (lower tier boundary)', () => {
    // price=200, qty=20 → subtotal=4000, 5% → 200
    store().addItem(makeItem({ price: 200, maxQty: 200 }));
    store().updateQty('prod-001', 20);
    expect(store().bulkDiscount()).toBe(200);
  });

  test('35 units → 5% discount (mid-tier)', () => {
    // price=100, qty=35 → subtotal=3500, 5% → 175
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 35);
    expect(store().bulkDiscount()).toBe(175);
  });

  test('exactly 49 units → 5% discount (boundary below 10% tier)', () => {
    // price=100, qty=49 → subtotal=4900, 5% → 245
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 49);
    expect(store().bulkDiscount()).toBe(245);
  });

  test('exactly 50 units → 10% discount (upper tier boundary)', () => {
    // price=100, qty=50 → subtotal=5000, 10% → 500
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 50);
    expect(store().bulkDiscount()).toBe(500);
  });

  test('100 units → 10% discount', () => {
    // price=200, qty=100 → subtotal=20000, 10% → 2000
    store().addItem(makeItem({ price: 200, maxQty: 200 }));
    store().updateQty('prod-001', 100);
    expect(store().bulkDiscount()).toBe(2000);
  });

  test('discount is summed correctly across multiple items with different tiers', () => {
    // Item A: price=100, qty=20 → 5% → 100 discount
    store().addItem(makeItem({ productId: 'prod-A', price: 100, maxQty: 200 }));
    store().updateQty('prod-A', 20);
    // Item B: price=200, qty=50 → 10% → 1000 discount
    store().addItem(makeItem({ productId: 'prod-B', price: 200, maxQty: 200 }));
    store().updateQty('prod-B', 50);
    // Total discount = 100 + 1000 = 1100
    expect(store().bulkDiscount()).toBe(1100);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. gst — 18% on (subtotal - bulkDiscount)
// ═══════════════════════════════════════════════════════════════════════════

describe('gst — 18% on taxable amount', () => {
  test('computes 18% GST on full subtotal when no bulk discount', () => {
    // price=1000, qty=1 → subtotal=1000, discount=0, gst=180
    store().addItem(makeItem({ price: 1000 }));
    expect(store().gst()).toBe(180);
  });

  test('GST is applied on post-discount taxable amount', () => {
    // price=100, qty=20 → subtotal=2000, discount=100(5%), taxable=1900, gst=342
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 20);
    const taxable = store().subtotal() - store().bulkDiscount(); // 1900
    expect(store().gst()).toBe(Math.round(taxable * 0.18));      // 342
  });

  test('GST is 0 for empty cart', () => {
    expect(store().gst()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. deliveryCharge — ₹0 when post-discount subtotal ≥ ₹999, else ₹99
// ═══════════════════════════════════════════════════════════════════════════

describe('deliveryCharge — free above ₹999 threshold', () => {
  test('charges ₹99 when taxable amount is below ₹999', () => {
    // price=500, qty=1 → taxable=500 < 999
    store().addItem(makeItem({ price: 500 }));
    expect(store().deliveryCharge()).toBe(99);
  });

  test('free delivery when taxable amount equals exactly ₹999', () => {
    // price=999, qty=1 → taxable=999 → free
    store().addItem(makeItem({ price: 999 }));
    expect(store().deliveryCharge()).toBe(0);
  });

  test('free delivery when taxable amount exceeds ₹999', () => {
    // price=1500, qty=1 → taxable=1500 → free
    store().addItem(makeItem({ price: 1500 }));
    expect(store().deliveryCharge()).toBe(0);
  });

  test('delivery charge considers bulk discount in threshold check', () => {
    // price=100, qty=50 → subtotal=5000, discount=500(10%), taxable=4500 → free
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 50);
    expect(store().deliveryCharge()).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. grandTotal — end-to-end composition
// ═══════════════════════════════════════════════════════════════════════════

describe('grandTotal', () => {
  test('empty cart returns deliveryCharge only (₹99) since subtotal is below threshold', () => {
    // subtotal=0 < 999 → deliveryCharge=99; gst=0; grandTotal=99
    expect(store().subtotal()).toBe(0);
    expect(store().gst()).toBe(0);
    expect(store().deliveryCharge()).toBe(99);
    expect(store().grandTotal()).toBe(99);
  });

  test('single item below free-delivery threshold: subtotal + GST + ₹99 delivery', () => {
    // price=500, qty=1 → subtotal=500, discount=0, gst=90, delivery=99 → total=689
    store().addItem(makeItem({ price: 500 }));
    expect(store().subtotal()).toBe(500);
    expect(store().bulkDiscount()).toBe(0);
    expect(store().gst()).toBe(90);
    expect(store().deliveryCharge()).toBe(99);
    expect(store().grandTotal()).toBe(689);
  });

  test('single item above free-delivery threshold: subtotal + GST, no delivery', () => {
    // price=1000, qty=1 → subtotal=1000, discount=0, gst=180, delivery=0 → total=1180
    store().addItem(makeItem({ price: 1000 }));
    expect(store().grandTotal()).toBe(1180);
  });

  test('grand total accounts for bulk discount in GST and threshold calculation', () => {
    // price=100, qty=50 → subtotal=5000, discount=500, taxable=4500
    // gst=810, delivery=0 (taxable≥999) → total=4500+810=5310
    store().addItem(makeItem({ price: 100, maxQty: 200 }));
    store().updateQty('prod-001', 50);
    const subtotal  = store().subtotal();        // 5000
    const discount  = store().bulkDiscount();    // 500
    const taxable   = subtotal - discount;        // 4500
    const gst       = store().gst();             // 810
    const delivery  = store().deliveryCharge();  // 0
    expect(store().grandTotal()).toBe(taxable + gst + delivery); // 5310
  });
});
