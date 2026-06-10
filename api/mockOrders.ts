import type { EcomOrder, Address } from './orders';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory mock orders store — survives the session, resets on app restart
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_ORDERS: EcomOrder[] = [
  {
    _id: 'mock-order-001',
    orderNumber: 'ORD-2025-001',
    items: [
      { name: 'MS Angle Bar 40×40 mm', image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&auto=format&fit=crop&q=80', quantity: 10, price: 4800, unit: 'piece' },
      { name: 'TMT Bar 10mm Fe500D', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&auto=format&fit=crop&q=80', quantity: 20, price: 650, unit: 'piece' },
    ],
    deliveryAddress: {
      fullName: 'Rahul Sharma', phone: '9876543210',
      addressLine1: '14, Sector 5, Industrial Area',
      city: 'Jaipur', state: 'Rajasthan', pincode: '302005',
    },
    subtotal: 61000,
    gstAmount: 10980,
    deliveryCharge: 0,
    totalAmount: 71980,
    paymentStatus: 'paid',
    status: 'delivered',
    placedAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    paymentMethod: 'cod',
    estimatedDelivery: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
  },
  {
    _id: 'mock-order-002',
    orderNumber: 'ORD-2025-002',
    items: [
      { name: 'MS Channel 100×50 mm', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80', quantity: 5, price: 7200, unit: 'piece' },
    ],
    deliveryAddress: {
      fullName: 'Rahul Sharma', phone: '9876543210',
      addressLine1: '14, Sector 5, Industrial Area',
      city: 'Jaipur', state: 'Rajasthan', pincode: '302005',
    },
    subtotal: 36000,
    gstAmount: 6480,
    deliveryCharge: 99,
    totalAmount: 42579,
    paymentStatus: 'paid',
    status: 'shipped',
    trackingNumber: 'DELHIVERY1234567',
    courierName: 'Delhivery',
    placedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    paymentMethod: 'cod',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
  },
  {
    _id: 'mock-order-003',
    orderNumber: 'ORD-2025-003',
    items: [
      { name: 'GI Pipe 20mm (Light Grade)', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80', quantity: 50, price: 320, unit: 'piece' },
      { name: 'MS Flat Bar 50×5 mm', image: 'https://images.unsplash.com/photo-1604754742629-3e5728249d73?w=400&auto=format&fit=crop&q=80', quantity: 8, price: 3200, unit: 'piece' },
    ],
    deliveryAddress: {
      fullName: 'Rahul Sharma', phone: '9876543210',
      addressLine1: '14, Sector 5, Industrial Area',
      city: 'Jaipur', state: 'Rajasthan', pincode: '302005',
    },
    subtotal: 41600,
    gstAmount: 7488,
    deliveryCharge: 0,
    totalAmount: 49088,
    paymentStatus: 'pending',
    status: 'confirmed',
    placedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    paymentMethod: 'cod',
    estimatedDelivery: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
  },
];

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
