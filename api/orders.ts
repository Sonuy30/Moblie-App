import client from './client';

export interface EcomOrderItem {
  name: string;
  image: string;
  quantity: number;
  price: number;
  productId?: string;
}

export interface Address {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface EcomOrder {
  _id: string;
  orderNumber: string;
  items: EcomOrderItem[];
  deliveryAddress: Address;
  subtotal: number;
  gstAmount: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'paid' | 'failed' | 'pending';
  status: 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  placedAt: string;
  updatedAt: string;
}

export const getOrders = async (): Promise<EcomOrder[]> => {
  const { data } = await client.get('/api/store/orders');
  return data.orders || data || [];
};

export const getOrderById = async (id: string): Promise<EcomOrder> => {
  const { data } = await client.get(`/api/store/orders/${id}`);
  return data.order || data;
};
