import AsyncStorage from '@react-native-async-storage/async-storage';
import client from './client';
import { type Address } from './orders';
import { Config } from '@/utils/config';

const ADDRESSES_CACHE_KEY = 'aits_cached_addresses';

// Helper to check if backend is offline/missing
function isBackendMissing(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const errorWithResponse = err as { response?: { status?: number } };
    const status = errorWithResponse.response?.status;
    if (!status || status === 405) return true;
  }
  return false;
}

export const getAddresses = async (): Promise<Address[]> => {
  if (Config.USE_MOCK_API) {
    const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
    return cached ? (JSON.parse(cached) as Address[]) : [];
  }

  try {
    const { data } = await client.get<unknown>('/api/mobile/addresses');
    let list: Address[] = [];
    if (data && typeof data === 'object') {
      if (Array.isArray(data)) {
        list = data as Address[];
      } else {
        const obj = data as { addresses?: unknown };
        if (Array.isArray(obj.addresses)) {
          list = obj.addresses as Address[];
        }
      }
    }
    await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    if (err && typeof err === 'object') {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        return [];
      }
    }
    // Network error or backend down: fallback to local cached addresses
    console.info('[addresses] getAddresses falling back to local cache');
    const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
    return cached ? (JSON.parse(cached) as Address[]) : [];
  }
};

export const addAddress = async (payload: Omit<Address, '_id'>): Promise<unknown> => {
  const newAddress: Address = {
    ...payload,
    _id: `addr-mock-${Date.now()}`,
  };

  if (Config.USE_MOCK_API) {
    const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
    const list = cached ? (JSON.parse(cached) as Address[]) : [];
    const updatedList = [...list, newAddress];
    await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(updatedList));
    return { address: newAddress };
  }

  try {
    const { data } = await client.post<unknown>('/api/mobile/addresses', payload);
    let saved: Address = newAddress;
    if (data && typeof data === 'object') {
      const obj = data as { address?: unknown };
      if (obj.address && typeof obj.address === 'object') {
        saved = obj.address as Address;
      } else {
        saved = data as Address;
      }
    }
    // Update local cache
    const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
    const list = cached ? (JSON.parse(cached) as Address[]) : [];
    await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify([...list, saved]));
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      console.info('[addresses] addAddress falling back to local storage');
      const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
      const list = cached ? (JSON.parse(cached) as Address[]) : [];
      const updatedList = [...list, newAddress];
      await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(updatedList));
      return { address: newAddress };
    }
    throw err;
  }
};

export const updateAddress = async (id: string, payload: Partial<Address>): Promise<unknown> => {
  if (Config.USE_MOCK_API) {
    const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
    let list = cached ? (JSON.parse(cached) as Address[]) : [];
    list = list.map((a) => (a._id === id ? { ...a, ...payload } : a));
    await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(list));
    return { success: true };
  }

  try {
    const { data } = await client.post<unknown>('/api/mobile/addresses', payload);
    // Update local cache
    await getAddresses();
    return data;
  } catch (err) {
    if (isBackendMissing(err)) {
      const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
      let list = cached ? (JSON.parse(cached) as Address[]) : [];
      list = list.map((a) => (a._id === id ? { ...a, ...payload } : a));
      await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(list));
      return { success: true };
    }
    throw err;
  }
};

export const deleteAddress = async (id: string) => {
  // Update local cache
  const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
  if (cached) {
    let list = JSON.parse(cached) as Address[];
    list = list.filter((a) => a._id !== id);
    await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(list));
  }
  return { message: 'Address removed' };
};

export const setDefaultAddress = async (id: string) => {
  const cached = await AsyncStorage.getItem(ADDRESSES_CACHE_KEY);
  if (cached) {
    let list = JSON.parse(cached) as Address[];
    list = list.map((a) => ({ ...a, isDefault: a._id === id }));
    await AsyncStorage.setItem(ADDRESSES_CACHE_KEY, JSON.stringify(list));
  }
  return { message: 'Default address updated' };
};
