/**
 * e2e/cart.test.ts
 *
 * Tier 1 & 2 E2E Tests: Cart and wishlist management.
 * Verifies cart operations (add, remove, update), calculation formulas (GST, delivery charge, bulk discount),
 * and wishlist CRUD actions and store updates.
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

import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import type { Product } from '@/types/product';

describe('E2E Cart & Wishlist Management', () => {
  const productA: Product = {
    _id: 'prod-a',
    slug: 'steel-beam-12m',
    name: '12m Steel Beam',
    itemCode: 'ST-001',
    storePrice: 1000,
    mrp: 1200,
    discount: 200,
    minOrderQty: 1,
    unit: 'piece',
    images: ['beam.png'],
    category: 'Structural Steel',
    description: '12m Heavy Beam',
    tags: ['beam', 'steel'],
    inStock: true,
    stockQty: 100,
    isFeatured: true,
    avgRating: 4.8,
    reviewCount: 15,
  };

  const productB: Product = {
    _id: 'prod-b',
    slug: 'gi-wire-2mm',
    name: '2mm GI Wire',
    itemCode: 'WR-002',
    storePrice: 50,
    mrp: 60,
    discount: 10,
    minOrderQty: 10,
    unit: 'kg',
    images: ['wire.png'],
    category: 'Wires & Meshes',
    description: '2mm GI Wire Roll',
    tags: ['wire', 'gi'],
    inStock: true,
    stockQty: 500,
    isFeatured: false,
    avgRating: 4.2,
    reviewCount: 8,
  };

  beforeEach(() => {
    useCartStore.getState().clearCart();
    useWishlistStore.getState().clearWishlist();
  });

  // Test 1: Init empty
  it('should initialize with empty cart and wishlist', () => {
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().totalItems()).toBe(0);
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  // Test 2: Add item
  it('should add a new product item to the cart', () => {
    useCartStore.getState().addItem({
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
    });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(productA._id);
    expect(items[0].quantity).toBe(1);
    expect(useCartStore.getState().totalItems()).toBe(1);
  });

  // Test 3: Increment item
  it('should increment quantity when adding the same product item again', () => {
    const itemData = {
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
    };

    useCartStore.getState().addItem(itemData);
    useCartStore.getState().addItem(itemData);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(useCartStore.getState().totalItems()).toBe(2);
  });

  // Test 4: Variants
  it('should support adding variants as distinct cart items', () => {
    const itemA = {
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
      variantId: 'v1',
      variantLabel: 'Grade Fe500',
    };

    const itemB = {
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
      variantId: 'v2',
      variantLabel: 'Grade Fe550D',
    };

    useCartStore.getState().addItem(itemA);
    useCartStore.getState().addItem(itemB);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(useCartStore.getState().totalItems()).toBe(2);
  });

  // Test 5: Max Quantity
  it('should enforce max quantity when adding items', () => {
    const maxQty = 3;
    const itemData = {
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty,
      unit: productA.unit,
    };

    useCartStore.getState().addItem(itemData);
    useCartStore.getState().addItem(itemData);
    useCartStore.getState().addItem(itemData);
    useCartStore.getState().addItem(itemData); // 4th attempt

    const items = useCartStore.getState().items;
    expect(items[0].quantity).toBe(maxQty);
  });

  // Test 6: Update Quantity
  it('should update item quantity in cart', () => {
    useCartStore.getState().addItem({
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
    });

    useCartStore.getState().updateQty(productA._id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  // Test 7: Remove item on 0
  it('should remove item when quantity is updated to 0', () => {
    useCartStore.getState().addItem({
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
    });

    useCartStore.getState().updateQty(productA._id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  // Test 8: Calculations (Subtotal, GST, delivery charge, discounts)
  it('should calculate subtotal, gst, bulk discount, and delivery charges correctly', () => {
    // Add 10 units of productA (10 * 1000 = 10,000 subtotal)
    // No bulk discount (requires >= 20 units)
    // Subtotal = 10,000. GST = 18% of 10,000 = 1,800.
    // Subtotal >= 999 so delivery charge = 0.
    // Grand Total = 10,000 + 1,800 + 0 = 11,800.
    useCartStore.getState().addItem({
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
    });
    useCartStore.getState().updateQty(productA._id, 10);

    const store = useCartStore.getState();
    expect(store.subtotal()).toBe(10000);
    expect(store.bulkDiscount()).toBe(0);
    expect(store.gst()).toBe(1800);
    expect(store.deliveryCharge()).toBe(0);
    expect(store.grandTotal()).toBe(11800);
  });

  // Test 9: Promo Code
  it('should set and clear a promo code in the cart', () => {
    useCartStore.getState().setPromoCode('WELCOME10');
    expect(useCartStore.getState().promoCode).toBe('WELCOME10');

    useCartStore.getState().setPromoCode(null);
    expect(useCartStore.getState().promoCode).toBeNull();
  });

  // Test 10: Clear Cart
  it('should clear the cart entirely', () => {
    useCartStore.getState().addItem({
      productId: productA._id,
      slug: productA.slug,
      name: productA.name,
      image: productA.images[0],
      price: productA.storePrice,
      maxQty: productA.stockQty,
      unit: productA.unit,
    });
    useCartStore.getState().setPromoCode('PROMO5');

    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().promoCode).toBeNull();
  });

  // Test 11: Wishlist Add
  it('should add a product to the wishlist', async () => {
    await useWishlistStore.getState().addToWishlist(productA);
    const items = useWishlistStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].productId).toBe(productA._id);
  });

  // Test 12: Wishlist isWishlisted
  it('should check if a product is in the wishlist', async () => {
    await useWishlistStore.getState().addToWishlist(productA);
    expect(useWishlistStore.getState().isWishlisted(productA._id)).toBe(true);
    expect(useWishlistStore.getState().isWishlisted(productB._id)).toBe(false);
  });

  // Test 13: Wishlist Remove
  it('should remove a product from the wishlist', async () => {
    await useWishlistStore.getState().addToWishlist(productA);
    await useWishlistStore.getState().removeFromWishlist(productA._id);
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  // Test 14: Wishlist Clear
  it('should clear the wishlist', async () => {
    await useWishlistStore.getState().addToWishlist(productA);
    await useWishlistStore.getState().addToWishlist(productB);
    useWishlistStore.getState().clearWishlist();
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });
});
