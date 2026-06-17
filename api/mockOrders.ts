import type { EcomOrder, Address } from './orders';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory mock orders store — survives the session, resets on app restart
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_ORDERS: EcomOrder[] = [];


// Newly placed orders (from checkout in this session) are prepended here
export const SESSION_ORDERS: EcomOrder[] = [];

export function getMockOrders(): EcomOrder[] {
  return [...SESSION_ORDERS, ...MOCK_ORDERS];
}

export function getMockOrderById(id: string): EcomOrder | undefined {
  return getMockOrders().find((o) => o._id === id);
}

export function addMockOrder(order: EcomOrder) {
  SESSION_ORDERS.unshift(order);
}



async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function mockFetchOrders(params?: { status?: string }): Promise<{ orders: EcomOrder[]; total: number }> {
  await delay(500);
  let orders = getMockOrders();
  if (params?.status) {
    orders = orders.filter((o) => o.status === params.status);
  }
  return { orders, total: orders.length };
}

export async function mockFetchOrderById(id: string): Promise<{ order: EcomOrder }> {
  await delay(300);
  const order = getMockOrderById(id);
  if (!order) throw new Error('Order not found');
  return { order };
}

export async function mockInitiateCheckout(payload: {
  cartItems: { productId: string; name: string; price: number; quantity: number; image: string }[];
  shippingAddress?: Address;
  paymentMethod?: string;
}): Promise<{ order: { _id: string; orderNumber: string; totalAmount: number }; message: string }> {
  await delay(700);

  const subtotal = payload.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.18);
  const delivery = subtotal >= 999 ? 0 : 99;
  const total = subtotal + gst + delivery;
  const orderId = `mock-order-new-${Date.now()}`;
  const orderNum = `ORD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const newOrder: EcomOrder = {
    _id: orderId,
    orderNumber: orderNum,
    items: payload.cartItems.map((i) => ({
      name: i.name,
      image: i.image,
      quantity: i.quantity,
      price: i.price,
      unit: 'piece',
    })),
    deliveryAddress: payload.shippingAddress || {
      fullName: 'Customer',
      phone: '',
      addressLine1: 'Address on file',
      city: 'India',
      state: 'India',
      pincode: '000000',
    },
    subtotal,
    gstAmount: gst,
    deliveryCharge: delivery,
    totalAmount: total,
    paymentStatus: 'pending',
    status: 'confirmed',
    paymentMethod: payload.paymentMethod || 'cod',
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
  };

  addMockOrder(newOrder);

  return {
    order: { _id: orderId, orderNumber: orderNum, totalAmount: total },
    message: 'Order placed successfully',
  };
}
