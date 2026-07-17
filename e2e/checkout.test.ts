/**
 * e2e/checkout.test.ts
 *
 * Tier 1 & 2 E2E Tests: Address and Razorpay/credit checkout flows.
 * Verifies address CRUD operations, state transitions in checkout store,
 * placement of orders via COD, payment creation on Razorpay gateway, and signature verification.
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
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from '@/api/addresses';
import { initiateCheckout } from '@/api/checkout';
import { createOrder, verifyPayment } from '@/api/payments';
import { useCheckoutStore } from '@/stores/checkoutStore';
import type { Address } from '@/api/orders';

describe('E2E Checkout, Address & Payment Flows', () => {
  const testAddressPayload: Omit<Address, '_id'> = {
    fullName: 'Jane Doe',
    phone: '9999988888',
    addressLine1: 'Flat 101, Steel Tower',
    addressLine2: 'Industrial Area Phase 2',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    isDefault: true,
  };

  beforeEach(() => {
    useCheckoutStore.getState().resetCheckout();
  });

  // Test 1: Clean checkout state
  it('should start with clean checkout store state', () => {
    const state = useCheckoutStore.getState();
    expect(state.selectedAddress).toBeNull();
    expect(state.deliveryOption).toBeNull();
    expect(state.paymentMethod).toBeNull();
    expect(state.couponCode).toBe('');
    expect(state.couponDiscount).toBe(0);
    expect(state.ecomOrderId).toBeNull();
  });

  // Test 2: Address List Init
  it('should fetch addresses and initially get an empty list if not configured', async () => {
    const list = await getAddresses();
    expect(Array.isArray(list)).toBe(true);
  });

  // Test 3: Add Address
  it('should successfully add a new delivery address', async () => {
    const res: any = await addAddress(testAddressPayload);
    expect(res.address).toBeDefined();
    expect(res.address._id).toBeDefined();
    expect(res.address.fullName).toBe(testAddressPayload.fullName);
    expect(res.address.city).toBe(testAddressPayload.city);
  });

  // Test 4: Get Address list contains the added address
  it('should retrieve the added delivery address in getAddresses', async () => {
    await addAddress(testAddressPayload);
    const list = await getAddresses();
    const found = list.find((a) => a.fullName === testAddressPayload.fullName);
    expect(found).toBeDefined();
    expect(found?.pincode).toBe(testAddressPayload.pincode);
  });

  // Test 5: Update Address
  it('should successfully update an existing address', async () => {
    const addRes: any = await addAddress(testAddressPayload);
    const id = addRes.address._id;

    const updatedRes: any = await updateAddress(id, {
      fullName: 'Jane Smith',
    });
    expect(updatedRes.success).toBe(true);

    const listAfter = await getAddresses();
    const updated = listAfter.find((a) => a._id === id);
    expect(updated?.fullName).toBe('Jane Smith');
  });

  // Test 6: Delete Address
  it('should delete an address and verify it is removed', async () => {
    const addRes: any = await addAddress({
      ...testAddressPayload,
      fullName: 'Jane Smith',
    });
    const id = addRes.address._id;

    const deleteRes: any = await deleteAddress(id);
    expect(deleteRes.message).toBe('Address removed');

    const listAfter = await getAddresses();
    const deleted = listAfter.find((a) => a._id === id);
    expect(deleted).toBeUndefined();
  });

  // Test 7: Selected Address store state
  it('should allow selecting a delivery address in checkout store', () => {
    const mockAddr = {
      _id: 'addr-123',
      fullName: 'John Selector',
      phone: '8888877777',
      addressLine1: 'Some place',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    };
    useCheckoutStore.getState().setSelectedAddress(mockAddr);
    expect(useCheckoutStore.getState().selectedAddress).toEqual(mockAddr);
  });

  // Test 8: Delivery option and payment method store state
  it('should allow setting delivery option and payment method in checkout store', () => {
    const delOption: any = { id: 'express', name: 'Express Delivery', price: 150 };
    useCheckoutStore.getState().setDeliveryOption(delOption);
    useCheckoutStore.getState().setPaymentMethod('credit');

    expect(useCheckoutStore.getState().deliveryOption).toEqual(delOption);
    expect(useCheckoutStore.getState().paymentMethod).toBe('credit');
  });

  // Test 9: Coupon codes store state
  it('should allow setting and clearing coupon codes in checkout store', () => {
    useCheckoutStore.getState().setCouponCode('SAVE20');
    useCheckoutStore.getState().setCouponDiscount(200);

    expect(useCheckoutStore.getState().couponCode).toBe('SAVE20');
    expect(useCheckoutStore.getState().couponDiscount).toBe(200);

    useCheckoutStore.getState().clearCoupon();
    expect(useCheckoutStore.getState().couponCode).toBe('');
    expect(useCheckoutStore.getState().couponDiscount).toBe(0);
  });

  // Test 10: Place Order API (COD)
  it('should successfully place an order via initiateCheckout API (COD method)', async () => {
    const cartItems = [
      {
        productId: 'prod-001',
        name: 'Steel Tube',
        price: 800,
        quantity: 2,
        image: 'tube.png',
      },
    ];
    const shippingAddress: Address = {
      fullName: 'Buyer COD',
      phone: '7777766666',
      addressLine1: 'COD Street',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
    };

    const res = await initiateCheckout({
      cartItems,
      addressId: 'addr-mock-id',
      shippingAddress,
      paymentMethod: 'cod',
    });

    expect(res.ecomOrderId).toBeDefined();
    expect(res.orderNumber).toBeDefined();
    expect(res.amount).toBe(800 * 2 + Math.round(800 * 2 * 0.18) + 0); // subtotal + gst + free shipping
    expect(res.currency).toBe('INR');
  });

  // Test 11: Create Razorpay Order
  it('should successfully initiate a Razorpay order via payments API', async () => {
    const amount = 1500; // in INR
    const rzOrder = await createOrder(amount);
    expect(rzOrder.id).toBeDefined();
    expect(rzOrder.amount).toBe(amount * 100); // 150000 paise
    expect(rzOrder.currency).toBe('INR');
    expect(rzOrder.key).toBeDefined();
  });

  // Test 12: Verify Razorpay Payment Signature
  it('should verify a payment transaction via payments verification API', async () => {
    const verifyRes = await verifyPayment(
      'order_rzp_123',
      'pay_rzp_456',
      'sig_rzp_789',
      'ecom-order-999'
    );
    expect(verifyRes.success).toBe(true);
    expect(verifyRes.message).toContain('successfully');
  });

  // Test 13: Reset Checkout state
  it('should reset checkout store after completion', () => {
    useCheckoutStore.getState().setCouponCode('DISCOUNT50');
    useCheckoutStore.getState().resetCheckout();
    expect(useCheckoutStore.getState().couponCode).toBe('');
  });
});
