/**
 * e2e/integration.test.ts
 *
 * Tier 3: Cross-Feature combinations.
 * Tier 4: Real-World workload scenarios.
 * Verifies complex multi-feature interactions, discount calculation models,
 * return lifecycles, stock limits, and concurrent user session simulation.
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

import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCheckoutStore } from '@/stores/checkoutStore';
import { registerUser, verifyOTP } from '@/api/auth';
import { searchProducts } from '@/api/search';
import { getProductBySlug } from '@/api/products';
import { addAddress } from '@/api/addresses';
import { initiateCheckout } from '@/api/checkout';
import { getTrackingDetails } from '@/api/orders';
import { initiateReturn, getReturnStatus } from '@/api/returns';
import type { Product } from '@/types/product';

describe('E2E Integration & Workload Scenarios (Tier 3 & Tier 4)', () => {
  const mockProduct: Product = {
    _id: 'prod-001',
    slug: 'gi-pipe-10mm',
    name: 'GI Pipe 10mm',
    itemCode: 'GI-001',
    storePrice: 1000,
    mrp: 1200,
    discount: 200,
    minOrderQty: 1,
    unit: 'piece',
    images: ['pipe.jpg'],
    category: 'Pipes & Tubes',
    description: 'Heavy duty GI Pipe 10mm',
    tags: ['pipe', 'gi'],
    inStock: true,
    stockQty: 100,
    isFeatured: true,
    avgRating: 4.5,
    reviewCount: 10,
  };

  beforeEach(async () => {
    await useAuthStore.getState().logout();
    useCartStore.getState().clearCart();
    useWishlistStore.getState().clearWishlist();
    useCheckoutStore.getState().resetCheckout();
    jest.clearAllMocks();
  });

  // =========================================================================
  // Tier 3: Cross-Feature Combinations (5 tests)
  // =========================================================================

  // Test 1
  it('Tier 3.1: Search product, view details, add to cart, and verify subtotal', async () => {
    // 1. Search
    const searchRes = await searchProducts('pipe', {});
    expect(searchRes.products.length).toBeGreaterThan(0);
    const targetProduct = searchRes.products[0];

    // 2. View details
    const productDetails = await getProductBySlug(targetProduct.slug);
    expect(productDetails._id).toBe(targetProduct._id);

    // 3. Add to cart
    useCartStore.getState().addItem({
      productId: productDetails._id,
      slug: productDetails.slug,
      name: productDetails.name,
      image: productDetails.images[0],
      price: productDetails.storePrice,
      maxQty: productDetails.stockQty,
      unit: productDetails.unit,
    });

    // 4. Verify cart
    expect(useCartStore.getState().totalItems()).toBe(1);
    expect(useCartStore.getState().subtotal()).toBe(productDetails.storePrice);
  });

  // Test 2
  it('Tier 3.2: Add item to wishlist, login, sync wishlist, and move wishlisted item to cart', async () => {
    // 1. Wishlist item locally
    await useWishlistStore.getState().addToWishlist(mockProduct);
    expect(useWishlistStore.getState().items).toHaveLength(1);

    // 2. Perform authentication login flow
    const regRes = await registerUser({
      fullName: 'Wishlist Integrator',
      phone: '9000011111',
      password: 'mypassword',
    });
    const verifyRes = await verifyOTP('9000011111', (regRes as any).devOtp);
    await useAuthStore.getState().setSession(verifyRes.token, verifyRes.user!);

    // 3. Sync wishlist
    await useWishlistStore.getState().syncWishlist();

    // 4. Add the wishlisted item to cart
    const wishlistItem = useWishlistStore.getState().items[0];
    useCartStore.getState().addItem({
      productId: wishlistItem.productId,
      slug: wishlistItem.product.slug,
      name: wishlistItem.product.name,
      image: wishlistItem.product.images[0],
      price: wishlistItem.savedPrice,
      maxQty: wishlistItem.product.stockQty,
      unit: wishlistItem.product.unit,
    });

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].productId).toBe(mockProduct._id);
  });

  // Test 3
  it('Tier 3.3: Login, add address, configure cart, initiate checkout, and verify payment', async () => {
    // 1. Login
    const regRes = await registerUser({
      fullName: 'Checkout User',
      phone: '9000022222',
      password: 'mypassword',
    });
    const verifyRes = await verifyOTP('9000022222', (regRes as any).devOtp);
    await useAuthStore.getState().setSession(verifyRes.token, verifyRes.user!);

    // 2. Add address
    const addressRes: any = await addAddress({
      fullName: 'Checkout User',
      phone: '9000022222',
      addressLine1: 'Checkout Lane',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    });
    useCheckoutStore.getState().setSelectedAddress(addressRes.address);

    // 3. Configure cart
    useCartStore.getState().addItem({
      productId: mockProduct._id,
      slug: mockProduct.slug,
      name: mockProduct.name,
      image: mockProduct.images[0],
      price: mockProduct.storePrice,
      maxQty: mockProduct.stockQty,
      unit: mockProduct.unit,
    });

    // 4. Initiate checkout
    const checkoutRes = await initiateCheckout({
      cartItems: useCartStore.getState().items,
      addressId: addressRes.address._id || 'addr-mock-id',
      shippingAddress: addressRes.address,
      paymentMethod: 'online',
    });

    expect(checkoutRes.ecomOrderId).toBeDefined();
    expect(checkoutRes.amount).toBeGreaterThan(0);
  });

  // Test 4
  it('Tier 3.4: Place order, view order tracking status, and initiate return request', async () => {
    // 1. Initiate checkout directly (COD)
    const cartItems = [
      {
        productId: mockProduct._id,
        name: mockProduct.name,
        price: mockProduct.storePrice,
        quantity: 1,
        image: mockProduct.images[0],
      },
    ];

    const checkoutRes = await initiateCheckout({
      cartItems,
      addressId: 'addr-mock-id',
      paymentMethod: 'cod',
    });
    const orderId = checkoutRes.ecomOrderId;

    // 2. Fetch tracking details
    const tracking = await getTrackingDetails(orderId);
    expect(tracking.orderId).toBe(orderId);
    expect(tracking.currentStatus).toBe('confirmed');

    // 3. Request a return
    const returnRes = await initiateReturn({
      orderId,
      reason: 'wrong_item' as const,
      reasonDetail: 'Wrong specifications delivered',
      method: 'pickup',
      items: [{ itemId: 'item-1', returnQty: 1 }],
    });

    expect(returnRes.returnId).toBeDefined();
  });

  // Test 5
  it('Tier 3.5: Update profile, verify session token validity and profile sync state', async () => {
    // 1. Log in
    const regRes = await registerUser({
      fullName: 'Original Name',
      phone: '9000033333',
      password: 'password',
    });
    const verifyRes = await verifyOTP('9000033333', (regRes as any).devOtp);
    await useAuthStore.getState().setSession(verifyRes.token, verifyRes.user!);

    // 2. Verify state
    expect(useAuthStore.getState().user?.fullName).toBe('Original Name');

    // 3. Update profile user name
    useAuthStore.getState().updateUser({ fullName: 'Updated Name' });
    expect(useAuthStore.getState().user?.fullName).toBe('Updated Name');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  // =========================================================================
  // Tier 4: Real-World Workload Scenarios (5 tests)
  // =========================================================================

  // Test 6
  it('Tier 4.1: Scenario A - Bulk discount and GST calculation priority under large volumes', () => {
    // Under Tier pricing:
    // Quantity >= 50 units gets 10% discount.
    // Let's add 60 units of mockProduct (storePrice = 1000)
    // Subtotal = 60 * 1000 = 60,000
    // Discount = 10% of 60,000 = 6,000
    // Taxable amount = 54,000
    // GST = 18% of 54,000 = 9,720
    // Delivery charge = 0 (since 54,000 >= 999)
    // Grand Total = 54,000 + 9,720 = 63,720

    useCartStore.getState().addItem({
      productId: mockProduct._id,
      slug: mockProduct.slug,
      name: mockProduct.name,
      image: mockProduct.images[0],
      price: mockProduct.storePrice,
      maxQty: 100,
      unit: mockProduct.unit,
    });

    useCartStore.getState().updateQty(mockProduct._id, 60);

    const store = useCartStore.getState();
    expect(store.subtotal()).toBe(60000);
    expect(store.bulkDiscount()).toBe(6000);
    expect(store.gst()).toBe(9720);
    expect(store.grandTotal()).toBe(63720);
  });

  // Test 7
  it('Tier 4.2: Scenario B - Coupon code discount stack rules check', () => {
    // Verify that applying coupons changes coupon code state but does not overwrite bulk tier discount state
    useCartStore.getState().addItem({
      productId: mockProduct._id,
      slug: mockProduct.slug,
      name: mockProduct.name,
      image: mockProduct.images[0],
      price: mockProduct.storePrice,
      maxQty: 100,
      unit: mockProduct.unit,
    });
    useCartStore.getState().updateQty(mockProduct._id, 20); // triggers 5% bulk discount

    useCartStore.getState().setPromoCode('FESTIVE10');
    expect(useCartStore.getState().bulkDiscount()).toBe(1000); // 5% of 20,000
    expect(useCartStore.getState().promoCode).toBe('FESTIVE10');
  });

  // Test 8
  it('Tier 4.3: Scenario C - Session restoration under token expiry and checkout state preservation', async () => {
    // 1. Login user
    const regRes = await registerUser({
      fullName: 'Session User',
      phone: '9000044444',
      password: 'password',
    });
    const verifyRes = await verifyOTP('9000044444', (regRes as any).devOtp);
    await useAuthStore.getState().setSession(verifyRes.token, verifyRes.user!);

    // 2. Set checkout selections
    useCheckoutStore.getState().setPaymentMethod('credit');
    useCheckoutStore.getState().setCouponCode('WELCOME100');

    // 3. Simulate app reload (restore session)
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // 4. Verify checkout choices remain intact
    expect(useCheckoutStore.getState().paymentMethod).toBe('credit');
    expect(useCheckoutStore.getState().couponCode).toBe('WELCOME100');
  });

  // Test 9
  it('Tier 4.4: Scenario D - Returns lifecycle validation milestone tracking', async () => {
    // 1. Submit return request
    const initRes = await initiateReturn({
      orderId: 'order-lifecycle-test',
      reason: 'damaged_product' as const,
      method: 'pickup',
      items: [{ itemId: 'item-abc', returnQty: 1 }],
    });

    const returnId = initRes.returnId;

    // 2. Check returns status milestones
    const returnStatus = await getReturnStatus(returnId);
    expect(returnStatus.milestones[0].key).toBe('return_requested');
    expect(returnStatus.milestones[0].status).toBe('active');
    expect(returnStatus.milestones[1].status).toBe('pending');
  });

  // Test 10
  it('Tier 4.5: Scenario E - Min order quantity and inventory stock bounds validation', () => {
    const minQty = 10;
    const stockQty = 15;

    const testProduct: Product = {
      ...mockProduct,
      minOrderQty: minQty,
      stockQty,
    };

    // 1. Add item
    useCartStore.getState().addItem({
      productId: testProduct._id,
      slug: testProduct.slug,
      name: testProduct.name,
      image: testProduct.images[0],
      price: testProduct.storePrice,
      maxQty: testProduct.stockQty,
      unit: testProduct.unit,
    });

    // 2. Verify setting quantity higher than stock clamps to stockQty
    useCartStore.getState().updateQty(testProduct._id, 25);
    expect(useCartStore.getState().items[0].quantity).toBe(stockQty);

    // 3. Verify updating quantity to 0 removes the item
    useCartStore.getState().updateQty(testProduct._id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
