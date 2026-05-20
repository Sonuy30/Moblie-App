import client from './client';
import { Address } from './orders';

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

// Staff: get all assigned deliveries
export const fetchAssignedDeliveries = async () => {
  const { data } = await client.get('/api/staff/deliveries');
  return data as { deliveries: DeliveryOrder[] };
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
  const { data } = await client.put(`/api/staff/deliveries/${orderId}/status`, payload);
  return data;
};

// Customer: confirm delivery received
export const confirmDeliveryReceived = async (
  orderId: string,
  deliveryToken: string
) => {
  const { data } = await client.post(`/api/store/delivery/${orderId}/confirm`, {
    deliveryToken,
  });
  return data;
};
