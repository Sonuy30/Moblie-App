import client from './client';
import { Address } from './orders';

export const getAddresses = async (): Promise<Address[]> => {
  const { data } = await client.get('/api/store/addresses');
  return data.addresses || data || [];
};

export const addAddress = async (payload: Omit<Address, '_id'>) => {
  const { data } = await client.post('/api/store/addresses', payload);
  return data;
};

export const updateAddress = async (id: string, payload: Partial<Address>) => {
  const { data } = await client.put(`/api/store/addresses/${id}`, payload);
  return data;
};

export const deleteAddress = async (id: string) => {
  const { data } = await client.delete(`/api/store/addresses/${id}`);
  return data;
};

export const setDefaultAddress = async (id: string) => {
  const { data } = await client.put(`/api/store/addresses/${id}/default`);
  return data;
};
