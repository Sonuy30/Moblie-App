import client from './client';
import { type Address } from './orders';
import { Config } from '@/utils/config';

export type DeliveryStatus = 
  | 'packed' 
  | 'shipped' 
  | 'out_for_delivery' 
  | 'delivered';

export interface DeliveryOrder {
  _id: string;
  orderNumber: string;
  customer: { fullName: string; phone: string };
  deliveryAddress: Address;
  items: { name: string; quantity: number; unit: string }[];
  status: DeliveryStatus;
  deliveryToken: string;
  estimatedDelivery: string;
  notes?: string;
}

// In-memory mock delivery orders
let MOCK_DELIVERIES: DeliveryOrder[] = [
  {
    _id: 'mock-del-001',
    orderNumber: 'ORD-2025-002',
    customer: { fullName: 'Rahul Sharma', phone: '9876543210' },
    deliveryAddress: {
      fullName: 'Rahul Sharma',
      phone: '9876543210',
      addressLine1: '14, Sector 5, Industrial Area',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302005',
    },
    items: [
      { name: 'MS Channel 100×50 mm', quantity: 5, unit: 'piece' }
    ],
    status: 'shipped',
    deliveryToken: '123456',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
    notes: 'Please call before arrival.'
  }
];

// Staff: get all assigned deliveries
export const fetchAssignedDeliveries = async () => {
  if (Config.USE_MOCK_API) {
    return { deliveries: MOCK_DELIVERIES };
  }
  const { data } = await client.get<{ deliveries: DeliveryOrder[] }>('/api/staff/deliveries');
  return data;
};

// Staff: update delivery status using deliveryToken
export const updateDeliveryStatus = async (
  orderId: string,
  payload: {
    status: DeliveryStatus;
    deliveryToken: string;
    notes?: string;
  }
) => {
  if (Config.USE_MOCK_API) {
    MOCK_DELIVERIES = MOCK_DELIVERIES.map((d) =>
      d._id === orderId ? { ...d, status: payload.status, notes: payload.notes } : d
    );
    return { success: true };
  }
  const { data } = await client.put<unknown>(`/api/staff/deliveries/${orderId}/status`, payload);
  return data;
};

// Customer: confirm delivery received
export const confirmDeliveryReceived = async (
  orderId: string,
  deliveryToken: string
) => {
  if (Config.USE_MOCK_API) {
    MOCK_DELIVERIES = MOCK_DELIVERIES.map((d) =>
      d._id === orderId ? { ...d, status: 'delivered' } : d
    );
    return { success: true };
  }
  const { data } = await client.post<unknown>(`/api/store/delivery/${orderId}/confirm`, {
    deliveryToken,
  });
  return data;
};

// ── Product Delivery Estimation ──

export interface DeliveryEstimate {
  estimatedDays: number;
  deliveryDate: string;
  shippingFee: number;
  isDeliverable: boolean;
  message?: string;
}

/**
 * Calculates delivery estimate for a given product and pincode.
 * Connects to the backend endpoint /api/delivery/estimate.
 */
export const getDeliveryEstimate = async (
  productId: string,
  pincode: string
): Promise<DeliveryEstimate> => {
  if (Config.USE_MOCK_API) {
    return mockGetDeliveryEstimate(productId, pincode);
  }
  try {
    const { data } = await client.get<DeliveryEstimate>('/api/delivery/estimate', {
      params: { productId, pincode },
    });
    return data;
  } catch {
    // If backend is unreachable or not implemented, fallback to local mock implementation
    console.info('[MOCK] getDeliveryEstimate fallback active');
    return mockGetDeliveryEstimate(productId, pincode);
  }
};

const mockGetDeliveryEstimate = async (
  _productId: string,
  pincode: string
): Promise<DeliveryEstimate> => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const pinPattern = /^[1-9][0-9]{5}$/; // Standard 6-digit Indian pincode format
  if (!pinPattern.test(pincode)) {
    return {
      estimatedDays: 0,
      deliveryDate: '',
      shippingFee: 0,
      isDeliverable: false,
      message: 'Invalid Pincode. Please enter a valid 6-digit Indian pincode.',
    };
  }

  const prefix = pincode.substring(0, 2);
  let estimatedDays = 4;
  let shippingFee = 99;

  // Region specific mock rules
  if (['11', '40', '56', '60', '70'].includes(prefix)) {
    estimatedDays = 2; // Metro cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata)
    shippingFee = 49;
  } else if (parseInt(prefix, 10) > 80) {
    estimatedDays = 7; // Remote areas / North East / J&K
    shippingFee = 149;
  }

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + estimatedDays);

  const formattedDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return {
    estimatedDays,
    deliveryDate: formattedDate,
    shippingFee,
    isDeliverable: true,
    message: `Delivery by ${formattedDate} | Shipping Fee: ₹${shippingFee}`,
  };
};
