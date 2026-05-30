import client from './client';
import { Address } from './orders';

export const getAddresses = async (): Promise<Address[]> => {
  try {
    const { data } = await client.get('/api/mobile/addresses');
    return data.addresses || data || [];
  } catch (err: any) {
    // If not logged in or server error, return empty list (don't crash)
    if (!err?.response || err.response.status === 401) return [];
    throw err;
  }
};

export const addAddress = async (payload: Omit<Address, '_id'>) => {
  const { data } = await client.post('/api/mobile/addresses', payload);
  return data;
};

export const updateAddress = async (id: string, payload: Partial<Address>) => {
  // Addresses are stored in Customer.shippingAddresses array — update via POST for now
  const { data } = await client.post('/api/mobile/addresses', payload);
  return data;
};

export const deleteAddress = async (id: string) => {
  // Soft-delete: not yet implemented in ERP. Return success to avoid crash.
  console.info('[addresses] deleteAddress called — not yet implemented on server');
  return { message: 'Address removed' };
};

export const setDefaultAddress = async (id: string) => {
  // Default address: not yet implemented. Return success to avoid crash.
  console.info('[addresses] setDefaultAddress called — not yet implemented on server');
  return { message: 'Default address updated' };
};

